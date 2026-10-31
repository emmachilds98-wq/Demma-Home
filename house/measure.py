"""V1 (Phase 1): every size the model still guesses that the client can measure, one row each, for the app's Measure screen.

Each row: the room, what to measure (the client's words: short), where to put the tape, what's drawn now (read live from the model, so
it is never stale) and how the answer goes back (set: the number replaces survey_data's at that path; length: a span keeps its start and
takes the new length; None: an agent folds it in by hand, then moves the row's sources on). tools/pull_edits.py reads the answers.
Add a row whenever a guess (E) goes into survey_data.py; take it out once the client's number is in (its source becomes the client's)."""
import survey_data as D
import model as M


def _door(did):
    a, b = D.FIT_DOORS[did]
    return round(b - a, 1)


def _landing_gap():
    return round(D.FIT_DOORS["master_door"][0] - 6 - (D.FIT_DOORS["bed2_door"][1] + 6), 1)


def _master_front():
    z0 = next(r["z0"] for r in M.rooms("first") if r["id"] == "master")
    return round(M.FRONT - (z0 + D.MASTER["wardrobes"]["d"]), 1)


ROWS = [
    # id, room, what, where, drawn, (how, path)
    ("bath_ceiling", "bathroom", "The ceiling over the toilet", "up from the floor", lambda: D.BATH["beam_y"], ("set", ("BATH", "beam_y"))),
    ("bath_slope", "bathroom", "Where the slope starts over the tiled box", "up from the floor", lambda: D.BATH["slope_y0"], ("set", ("BATH", "slope_y0"))),
    ("bath_vanity", "bathroom", "The vanity's width", "along its front", lambda: round(D.BATH["vanity"]["z"][1] - D.BATH["vanity"]["z"][0], 1), ("length", ("BATH", "vanity", "z"))),
    ("bath_bath", "bathroom", "The bath's length", "along its rim", lambda: D.BATH["bath"]["l"], ("set", ("BATH", "bath", "l"))),
    ("bath_door", "landing", "The bathroom door's width", "inside the frame", lambda: _door("bath_door"), ("length", ("FIT_DOORS", "bath_door"))),
    ("landing_gap", "landing", "Bedroom 2's frame to the master's", "along the wall", _landing_gap, None),
    ("bed2_door", "landing", "Bedroom 2's door width", "inside the frame", lambda: _door("bed2_door"), ("length", ("FIT_DOORS", "bed2_door"))),
    ("airing_door", "landing", "The boiler cupboard door's width", "inside the frame", lambda: _door("airing_door"), ("length", ("FIT_DOORS", "airing_door"))),
    ("master_door", "landing", "The master door's width", "inside the frame", lambda: _door("master_door"), ("length", ("FIT_DOORS", "master_door"))),
    ("hall_tapestry", "hall", "The tapestry's drop", "top to bottom", lambda: round(D.HALL["tapestry"]["y"][1] - D.HALL["tapestry"]["y"][0], 1), ("length", ("HALL", "tapestry", "y"))),
    ("hall_radiator", "hall", "The hall radiator's width", "end to end", lambda: round(D.HALL["radiator"]["z"][1] - D.HALL["radiator"]["z"][0], 1), ("length", ("HALL", "radiator", "z"))),
    ("master_front", "master", "Wardrobes' front to the front wall", "along the carpet", _master_front, None),
    ("master_alcove", "master", "The wardrobes' alcove width", "wall to wall", lambda: round(D.MASTER["alcove"][1] - D.MASTER["alcove"][0], 1), None),
    ("airing_bed2", "bed2", "How far the boiler cupboard sticks into the room", "from the wall beside it", lambda: D.AIRING["into_bed2"], ("set", ("AIRING", "into_bed2"))),
    ("bed2_long", "bed2", "Bathroom wall to the wall behind the wardrobes", "along the carpet, the longest way", lambda: 388.0, None),   # V1.20: the wall 25 into the master
    ("stairs_tread", "living", "One stair tread's depth", "nose to nose", lambda: __import__("model").Gm.STAIR_GOING, None),
    ("meters", "hall", "The meter cupboard's width", "inside", lambda: 38.0, None),
    ("bins", "porch", "The bin cupboard's width", "inside", lambda: 39.0, None),
    ("living_socket", "living", "The side-wall socket, from the corner", "along the wall", lambda: None, None),
]


def rows():
    out = []
    for rid, room, what, where, drawn, how in ROWS:
        v = drawn()
        out.append(dict(id=rid, room=room, what=what, where=where, drawn=None if v is None else round(float(v), 1),
                        how=how[0] if how else "agent", path=list(how[1]) if how else None))
    return out


if __name__ == "__main__":
    for r in rows():
        print(f"{r['room']:9} {r['what']:48} drawn {r['drawn']}  ({r['how']})")
