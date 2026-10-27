"""v56: the sun's position over the house (NOAA's simplified solar formulas), for the 3D model's sun and sky (BUILD_SPEC phase 4).
sun(datetime in UTC) -> (azimuth in degrees from north, clockwise; elevation in degrees). Relative to the back of the house: subtract
FACING (14°): positive is to the right looking out, negative to the left. Round 44 used this to find that the back windows get the sun
only on spring and summer mornings."""
import math, datetime as dt
from house import FACING

LAT, LON = 51.5, 0.0          # about right for the sun; the exact location is never stored (client, 25 Oct)


def sun(t):
    d = (t - dt.datetime(2000, 1, 1, 12)).total_seconds() / 86400
    g = math.radians((357.529 + 0.98560028 * d) % 360); q = (280.459 + 0.98564736 * d) % 360
    L = math.radians((q + 1.915 * math.sin(g) + 0.020 * math.sin(2 * g)) % 360); e = math.radians(23.439 - 0.00000036 * d)
    ra = math.atan2(math.cos(e) * math.sin(L), math.cos(L)); dec = math.asin(math.sin(e) * math.sin(L))
    gmst = (18.697374558 + 24.06570982441908 * d) % 24; H = math.radians((gmst * 15 + LON) % 360) - ra
    la = math.radians(LAT)
    el = math.asin(math.sin(la) * math.sin(dec) + math.cos(la) * math.cos(dec) * math.cos(H))
    az = math.atan2(-math.sin(H), math.tan(dec) * math.cos(la) - math.sin(la) * math.cos(H))
    return math.degrees(az) % 360, math.degrees(el)


def off_back(t):
    """(degrees right of straight out of the back windows, elevation)."""
    az, el = sun(t)
    return (az - FACING + 180) % 360 - 180, el


if __name__ == "__main__":
    for h in range(4, 21):
        r, el = off_back(dt.datetime(2026, 6, 21, h))
        if el > 0: print(f"21 Jun {h:02d}:00 UTC  {r:+5.0f}° off straight out, {el:4.0f}° up{'  (in the window)' if abs(r) < 80 else ''}")
