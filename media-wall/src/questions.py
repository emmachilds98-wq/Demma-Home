"""v30, client: "the wall on the stairs is solid. electrics done ourselves, remove all other questions and that section. ask."
Both answered (the dining cabinet's top goes into plugs and screws; the light fittings and the socket are your own job, as planned)
and every other question dropped, with the Ask sheet: the plan keeps its stated assumptions, and the fit proof's checks say what
to measure on site. The list stays (empty) so the PDF, the overview and the page read one place if a question comes back.
v27: dropped: optc (the dining cabinet is the plan, for six) and chairs (the flip-top's chair cupboard: the cabinet keeps all six). New in v27: rears (v27.1: answered by your photo, dropped).
v20: answered and dropped: hdcrash ("no crashes"); chairs now six ideally, four fine; the ledge is 25 (as drawn).
v18.1: answered by the listings the client sent and dropped: the plant stand (98 × 29.5 × 158) and the vinyl stand (70 × 32 × 78).
v15: answered by the client's notes (20 Oct) and dropped: the lamp (it stays: bright red, colour bulbs green, pink, purple).
New: hat, lightbox. The curtains and the carpet came with the client's photo the same day (asked and answered).
v14: answered by the client's photos (20 Oct) and dropped: the stairs' direction (a straight flight rising towards the door).
New: site, westwall, lamp.
v13.6: ONE list of what we still need from Emma and Dave, most consequential first. The plan PDF's "Still to confirm"
(build_doc.py) and the viewer's Questions tab (build_viewer.py) both read it, so they can't drift apart.
Ids are kept from earlier rounds: answers already saved in the viewer's db stay attached to their question.
Answered and dropped in v13.6: the door, the walls, the PC case (v12.1), and where the leaf and legs live (the leaf carries them)."""
import geometry as G

LPS = G.ALL_LPS   # v19: 291: the wall's 191 (all face-out) and the vinyl stand's 100
SINGLES = 2 * G.TRAY_SINGLES


def _n(x):
    return f"{x:g}"


# (id, question, why it matters, how to check, a photo helps)
QUESTIONS = []

# a short line for the plan PDF's "Still to confirm" list, by id
PDF_LINE = {}
assert set(PDF_LINE) == {q[0] for q in QUESTIONS}


def pdf_items():
    return "\n".join(f"<li>{PDF_LINE[q[0]]}</li>" for q in QUESTIONS)

# v13.8: a few words per question for the plan's one-page summary ("To confirm"), so it follows this list too
SHORT = {}
assert set(SHORT) == {q[0] for q in QUESTIONS}


def summary_line():
    return " · ".join(SHORT[q[0]] for q in QUESTIONS)


# v25: quick taps on the page (the Ask sheet). Each question's rows: (label or None, [choices]). "Add a photo" opens the photo
# upload. The answer is saved as plain text in the same answers/<id> record, e.g. "Cupboard: For six, 31 deep · Behind the top: No".
# The PDF ignores these. Check the wording with Emma when it's shown.
OPTS = {}
assert set(OPTS) == {q[0] for q in QUESTIONS}
