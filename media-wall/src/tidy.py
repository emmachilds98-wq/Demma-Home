"""v24, client: "can you now take away uneeded explainer text across the doc and give it a better overall design and ui".

The plan grew round by round, and its text kept the round each change came in: "(v16)", "v20: ...", "Since v16 ...". The client
reads the plan as it is now, so those markers come out of the page and the PDF. The history itself stays where it belongs: the
"What changed" boxes (class "decision") and the PDF's "Earlier rounds" appendix are left alone, and so are scripts and styles.
Long captions on the plan page keep their first sentence; the rest folds behind a "More" button (shorten_captions).
"""
import re

V = r"v\d{1,2}(?:\.\d)?"
# a parenthesis that holds only round numbers: "(v16)", "(v18.1)", "(v21, v23)", "(new in v19)", "(since v16)", "(v19 follow-up)"
_PAREN = re.compile(rf"\s?\((?:new in |since |as of |from |changed in )?{V}(?:(?:,| and|,? then) {V})*(?: follow-ups?)?\)")
# "v20: the chair cupboard ..." at the start of a sentence, caption or list item
_PREFIX = re.compile(rf"(^|(?<=[>(])|(?<=[.!?:;] )|(?<=\n))\s*(?:New in |new in |Since |since )?{V}(?:(?:,| and) {V})*:\s+")
# "Since v16 it lives ...", "since v16, " mid-sentence
_SINCE = re.compile(rf"\b(?:[Ss]ince|[Nn]ew in|[Aa]s of) {V},?(?:\s+|(?=\)))")
# a round number inside a parenthesis with other words: "(v17, from your note)", "(an option, v23)", "(v16; with the table by ...)"
_IN_PAREN_LEAD = re.compile(rf"\((?:changed in |new in |since )?{V}(?:\.\d)?[,;:]\s+")
_IN_PAREN_TAIL = re.compile(rf"[,;]\s+{V}\)")
# " · v23" left at the end of a heading or label
_DOT = re.compile(rf"\s+·\s+{V}(?=\s*(?:<|$|\"|\)))")
_KEEP = re.compile(r"(<script\b.*?</script>|<style\b.*?</style>|<div class=\"decision\">.*?</div>|<!--keep-->.*?<!--/keep-->)", re.S)


def _cap(m):
    """After a dropped prefix, start the sentence with a capital again."""
    return m.group(1) + m.group(2).upper()


def _text(seg):
    seg = _PAREN.sub("", seg)
    seg = _IN_PAREN_LEAD.sub("(", seg)
    seg = _IN_PAREN_TAIL.sub(")", seg)
    seg = _DOT.sub("", seg)
    # prefixes and "since v16": drop them, then re-capitalise a sentence that now starts in lower case
    seg = _PREFIX.sub(lambda m: m.group(1) + "\x00", seg)
    seg = _SINCE.sub("\x00", seg)
    seg = re.sub(r"((?:^|[>.!?]\s*|\n\s*))\x00([a-z])", _cap, seg)
    seg = seg.replace("\x00", "")
    seg = re.sub(r"(?<=\S) +\)", ")", seg).replace("()", "")
    return seg


def strip_versions(html_):
    """Every round marker out of the text, except inside the kept regions (history, scripts, styles)."""
    out, pos = [], 0
    for m in _KEEP.finditer(html_):
        out.append(_tidy_markup(html_[pos:m.start()]))
        out.append(m.group(0))
        pos = m.end()
    out.append(_tidy_markup(html_[pos:]))
    return "".join(out)


def _tidy_markup(chunk):
    """Work on text between tags only, so attributes and URLs are never touched."""
    parts = re.split(r"(<[^>]+>)", chunk)
    return "".join(p if p.startswith("<") else _text(p) for p in parts)


# ---------------------------------------------------------------- long captions on the page: the first sentence, then "More"
_CAPTION = re.compile(r'(<(p) class="caption"[^>]*>|<(figcaption)[^>]*>)(.*?)(</\2>|</\3>)', re.S)


def _first_sentence_split(inner):
    """Index just after the first sentence of `inner` (markup aware), or None."""
    depth = 0
    for i, ch in enumerate(inner):
        if ch == "<":
            depth += 1
        elif ch == ">":
            depth -= 1
        elif depth == 0 and ch in ".:" and inner[i + 1:i + 2] == " " and i > 40:
            nxt = inner[i + 2:i + 3]
            if nxt.isupper() or nxt in "<“(\"0123456789":
                return i + 1
    return None


def shorten_captions(html_, words=34):
    def one(m):
        open_, inner, close = m.group(1), m.group(4), m.group(5)
        if len(re.sub(r"<[^>]+>", " ", inner).split()) <= words or 'id="' in open_:
            return m.group(0)
        cut = _first_sentence_split(inner)
        if not cut or len(inner) - cut < 40:
            return m.group(0)
        return (f'{open_}{inner[:cut]} <button type="button" class="more" aria-expanded="false">More</button>'
                f'<span class="rest" hidden>{inner[cut:]}</span>{close}')
    out, pos = [], 0
    for k in _KEEP.finditer(html_):
        out.append(_CAPTION.sub(one, html_[pos:k.start()]))
        out.append(k.group(0))
        pos = k.end()
    out.append(_CAPTION.sub(one, html_[pos:]))
    return "".join(out)


MORE_JS = """document.addEventListener("click", e => { const b = e.target.closest("button.more"); if (!b) return;
  const r = b.nextElementSibling, open = r.hidden; r.hidden = !open; b.setAttribute("aria-expanded", String(open)); b.textContent = open ? "Less" : "More"; });"""


if __name__ == "__main__":
    tests = ["The chair cupboard (v20) holds four.", "v20: the chair cupboard beside the table holds four.", "Since v16 it lives on the wall.",
             "<li><b>v22: Fast</b> lights each bar</li>", "Open hooks (v19, v20) instead", "The room · v23", "(v20: 85 tall) stays",
             "a fold-down seat (new in v23).", "Fit proof 107 checks (v21, v23)", "a deep sill (v17, from your note)", "(an option, v23)",
             "the strips' app (smart colour since v16)", "Since v16 it lives", "(v16; with the table by the stairs)"]
    for t_ in tests:
        print(repr(t_), "->", repr(strip_versions(t_)))
