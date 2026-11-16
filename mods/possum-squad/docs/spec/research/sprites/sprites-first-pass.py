"""Possum Squad - first-pass sprite source: the engine and the `classic` set.
Every set_<id>.py file beside this one adds another set.

One base opossum on a 32x32 canvas, plus a layered outfit per role:
garment (recolours the torso), headgear, extras, and a hand prop.
Coordinates below are in the base's own 24x24 grid; OX/OY place it on the canvas.
Run: python3 squad.py <output-dir>
"""
import sys
from PIL import Image, ImageDraw

SIZE = 32
OX, OY = 4, 7

PAL = {
    'W': (244, 241, 235), 'w': (214, 218, 228), 'G': (154, 156, 166), 'D': (112, 114, 126),
    'K': (38, 38, 46), 'P': (244, 160, 182), 'p': (206, 110, 138),
    'Y': (250, 204, 60), 'y': (214, 160, 36), 'F': (255, 242, 160),
    'O': (246, 138, 44), 'o': (198, 96, 30), 'R': (226, 72, 80), 'r': (166, 44, 58),
    'B': (146, 100, 62), 'b': (98, 66, 44), 'T': (216, 190, 140), 't': (170, 146, 100),
    'E': (236, 220, 170), 'e': (196, 176, 120),
    'N': (44, 58, 110), 'n': (78, 120, 196), 'C': (124, 220, 236), 'c': (52, 150, 160),
    'L': (104, 196, 110), 'l': (52, 122, 72), 'V': (150, 98, 200), 'v': (98, 60, 146),
    'S': (192, 196, 206), 's': (126, 132, 146), 'M': (140, 44, 70), 'I': (48, 50, 78),
}

BASE = """
........................
........................
........................
........................
........................
....KKK..........KKK....
...KPPKK........KKPPK...
...KPPKWWGGGGGGWWKPPK...
....KKWWWGGGGGGWWWKK....
.....WWWWWWGGWWWWWW.....
.....WWKKWWWWWWKKWW.....
.....WWKKWWWWWWKKWW.....
......WWWWWWWWWWWW......
.......WWWWPPWWWW.......
........WWWPPWWW........
.......GGGWWWWGGG.......
......GGGGGGGGGGGG......
.....PGGGGWWWWGGGGP.....
......GGGWWWWWWGGG..PP..
......GGGWWWWWWGGG...P..
......GGGGWWWWGGGGPPPP..
.......GGG....GGG.......
......PPPP....PPPP......
........................
""".strip().split('\n')


def blank():
    return [['.'] * SIZE for _ in range(SIZE)]


def put(g, x, y, rows):
    for j, r in enumerate(rows):
        for i, c in enumerate(r):
            if c not in ' .':
                X, Y = x + i + OX, y + j + OY
                if 0 <= X < SIZE and 0 <= Y < SIZE:
                    g[Y][X] = c


def cell(g, x, y):
    return g[y + OY][x + OX]


def setc(g, x, y, c):
    if 0 <= x + OX < SIZE and 0 <= y + OY < SIZE:
        g[y + OY][x + OX] = c


def base():
    g = blank()
    put(g, 0, 0, BASE)
    return g


def garment(g, main=None, belly=None, legs=None):
    for y in range(15, 21):
        for x in range(5, 19):
            c = cell(g, x, y)
            if c == 'G' and main:
                setc(g, x, y, main)
            elif c == 'W' and belly:
                setc(g, x, y, belly)
    if legs:
        for x in range(6, 18):
            if cell(g, x, 21) == 'G':
                setc(g, x, 21, legs)


def dots(g, pts, c):
    for x, y in pts:
        setc(g, x, y, c)


# ---------------------------------------------------------------- outfits
def lead(g):
    garment(g, 'R', 'W', 'R')
    put(g, 6, 15, ["WWWWWWWWWWWW"])
    dots(g, [(8, 15), (11, 15), (15, 15), (10, 18), (13, 19), (11, 20)], 'K')
    put(g, 4, 0, ["  Y    YY    Y  ",
                  "  YY  YYYY  YY  ",
                  "  YYYYYYYYYYYY  ",
                  "  YRYYCYYCYYRY  ",
                  "  YYYYYYYYYYYY  ",
                  "  yyyyyyyyyyyy  ",
                  "  MMMMMMMMMMMM  "])


def scout(g):
    garment(g, 'T')
    dots(g, [(7, 18), (16, 18)], 't')
    put(g, 8, 15, ["LLLLLLLL", "   ll   ", "   l    "])
    put(g, 4, 1, ["      TTTT      ",
                  "    TTTTTTTT    ",
                  "   TTTTTTTTTT   ",
                  "  TTTTTTTTTTTT  ",
                  "  bbbbbbbbbbbb  ",
                  "TTTTTTTTTTTTTTTT"])


def planner(g):
    garment(g, 'B')
    put(g, 10, 15, ["RrrR"])
    dots(g, [(11, 17), (12, 17), (11, 19), (12, 19)], 'B')
    put(g, 4, 3, ["    BBBBBBBB    ",
                  "  BTBTBTBTBTBB  ",
                  " BBTBTBTBTBTBBB ",
                  "  bbbbbbbbbbbb  "])
    put(g, 19, 1, ["   p", "  Y ", " Y  ", "Y   "])


def builder(g):
    garment(g, 'O')
    dots(g, [(8, 16), (8, 17), (8, 18), (15, 16), (15, 17), (15, 18)], 'F')
    put(g, 6, 19, ["bbbbbYYbbbbb"])
    dots(g, [(7, 20), (8, 20), (15, 20), (16, 20)], 'B')
    put(g, 4, 0, ["      YYYY      ",
                  "    YYYYYYYY    ",
                  "   YYYyYYyYYY   ",
                  "   YYYyYYyYYY   ",
                  "  YYYYYYYYYYYY  ",
                  "  YYYYYYYYYYYY  ",
                  "yyyyyyyyyyyyyyyy"])


def tester(g):
    garment(g, 'W', 'w')
    dots(g, [(7, 15), (8, 15), (9, 15), (14, 15), (15, 15), (16, 15)], 'S')
    dots(g, [(11, 17), (12, 17), (11, 19), (12, 19)], 's')
    dots(g, [(15, 17)], 'R')
    dots(g, [(16, 17)], 'n')
    dots(g, [(15, 18), (16, 18)], 'S')
    put(g, 5, 7, [" SSSS    SSSS ",
                  "NSCCSNNNNSCCSN",
                  " SSSS    SSSS "])


def bugcatcher(g):
    garment(g, 'e')
    dots(g, [(7, 18), (7, 19), (16, 18), (16, 19)], 'B')
    put(g, 4, 2, ["     llllll     ",
                  "    LLLLLLLL    ",
                  "   LLLLLLLLLL   ",
                  "   yyyyyyyyyy   ",
                  " LLLLLLLLLLLLLL ",
                  "lLLLLLLLLLLLLLLl"])


def reviewer(g):
    garment(g, 'M', None, 'M')
    put(g, 9, 15, ["IIssII", "I    I"])
    dots(g, [(11, 17), (12, 17), (11, 19), (12, 19)], 's')
    dots(g, [(6, 17), (17, 17)], 'y')
    put(g, 5, -2, ["   MMMMMMMM   ",
                   "   MMMMMMMM   ",
                   "   MMMMMMMM   ",
                   "   MMMMMMMM   ",
                   "   MMMMMMMM   ",
                   "   yyyyyyyy   ",
                   "   MMMMMMMM   ",
                   "   MMMMMMMM   ",
                   "MMMMMMMMMMMMMM"])
    put(g, 14, 9, [" yy ", "y  y", "y  y", " yy "])
    dots(g, [(18, 12), (18, 13), (17, 14)], 'y')


def researcher(g):
    garment(g, 'l')
    put(g, 7, 15, ["MMMMMMMMMM", "       MY ", "       MM ", "       YM "])
    put(g, 3, 1, ["        II        ",
                  "    IIIIIIIIII    ",
                  "IIIIIIIIIIIIIIIIYI",
                  "   IIIIIIIIIIII Y ",
                  "    IIIIIIIIII  Y ",
                  "                Y ",
                  "               YYY"])
    put(g, 6, 9, [" yyyy  yyyy ",
                  "y    yy    y",
                  "y    yy    y",
                  " yyyy  yyyy "])


def operator(g):
    put(g, 8, 16, ["nnnnnnnn"] * 5)
    dots(g, [(8, 15), (15, 15)], 'n')
    dots(g, [(9, 16), (14, 16)], 'Y')
    put(g, 10, 18, ["NNNN", "NnnN"])
    garment(g, None, None, 'n')
    dots(g, [(16, 12)], 's')
    put(g, 4, 1, ["     nnnnnn     ",
                  "    WnWnWnWn    ",
                  "   nWnWnWnWnW   ",
                  "   WnWnWnWnWn   ",
                  "   nnnnnnnnnn   ",
                  "  NNNNNNNNNNNN  "])


def courier(g):
    garment(g, 'n', 'n', 'N')
    dots(g, [(11, 16), (12, 16), (11, 18), (12, 18), (11, 20), (12, 20)], 'Y')
    dots(g, [(15, 15), (14, 16), (13, 17), (12, 18), (10, 19), (9, 20)], 'b')
    put(g, 5, 18, ["BBBB", "bbbB", "BYBB", "BBBB"])
    put(g, 4, 1, ["     nnnnnn     ",
                  "   nnnnnnnnnn   ",
                  "  nnnnnnnnnnnn  ",
                  "  nnnnnnnnnnnn  ",
                  "  RRRRRYYRRRRR  ",
                  "   KKKKKKKKKK   "])


def writer(g):
    garment(g, 'V', 'v', 'v')
    put(g, 6, 15, ["WwWwWwWwWwWw"])
    dots(g, [(11, 17), (12, 17), (11, 19), (12, 19)], 'Y')
    put(g, 3, -4, ["  WW              ",
                   " WWW              ",
                   " WWw              ",
                   " WWw              ",
                   "  WWw   VVVVVV    ",
                   "  WWw VVVVVVVVVV  ",
                   "   WVVVVVVVVVVVVV ",
                   "   VVVVVVVVVVVVVV ",
                   "   YYvvvvvvvvvvvv ",
                   "   vvvvvvvvvvvvvv "])


def artist(g):
    for y in range(15, 21):
        garment_row = 'N' if y % 2 else 'W'
        for x in range(5, 19):
            if cell(g, x, y) in 'GW':
                setc(g, x, y, garment_row)
    put(g, 9, 15, ["RRRRRR", "  rR  "])
    put(g, 4, 1, ["          r     ",
                  "     RRRRRRRR   ",
                  "   RRRRRRRRRRRR ",
                  "  RRRRRRRRRRRRRR",
                  "  RRRRRRRRRRRRR ",
                  "   rrrrrrrrrr   "])


def analyst(g):
    garment(g, 'b')
    put(g, 11, 15, ["RR", "RR", "rR", "RR", " R"])
    dots(g, [(6, 17), (17, 17)], 'Y')
    put(g, 4, 4, ["   llllllllll   ",
                  "  LLLLLLLLLLLL  ",
                  "  LLLLLLLLLLLL  ",
                  "cLLLLLLLLLLLLLLc"])


def guard(g):
    garment(g, 'I', None, 'I')
    put(g, 11, 15, ["II", "II", "II", "II", " I"])
    put(g, 6, 10, ["KKSKKKKKKSKK", " KKK    KKK "])
    dots(g, [(19, 9), (19, 10), (18, 12), (19, 13), (18, 14), (18, 15)], 's')


def janitor(g):
    put(g, 8, 16, ["LLLLLLLL"] * 5)
    dots(g, [(9, 15), (14, 15)], 'L')
    put(g, 10, 18, ["llll", "lLLl"])
    put(g, 4, 3, ["    RRRRRRRR    ",
                  "  RRWRRRWRRRWR  ",
                  " RRRRRWRRRWRRRR ",
                  " RWRRRRRRRRRRWR "])
    put(g, 19, 5, ["RR ", "rRR", " rR"])


def pilot(g):
    garment(g, 'B', 'b')
    dots(g, [(x, y) for x in (11, 12) for y in range(16, 21)], 'S')
    put(g, 7, 15, ["RRRRRRRRRR"])
    put(g, 16, 11, ["     RR ", "   RRRRr", " RRRR  r", "RRR     "])
    put(g, 3, 1, ["      BBBBBB      ",
                  "    BBBBBBBBBB    ",
                  "   BBBBBBBBBBBB   ",
                  "  BBBBBBBBBBBBBB  ",
                  "  BSSSSSbbSSSSSB  ",
                  "  BSCCCSbbSCCCSB  ",
                  "  BBSSSBBBBSSSBB  ",
                  "  BB          BB  ",
                  "  BB          BB  ",
                  "  Bb          bB  ",
                  "  bb          bb  ",
                  "   b          b   "])


def helper(g):
    dots(g, [(8, y) for y in range(15, 20)] + [(15, y) for y in range(15, 20)], 'l')
    put(g, 9, 17, ["llllll"])
    dots(g, [(11, 17), (12, 17)], 'Y')
    put(g, 5, 0, ["      WW      ",
                  "     WWWW     ",
                  "      WW      ",
                  "    OOOOOO    ",
                  "  OOOOOOOOOO  ",
                  " OOOOOOOOOOOO ",
                  " oOoOoOoOoOoO ",
                  " OoOoOoOoOoOo "])


# hand props: (x, y, rows, dy on the second work frame)
PROPS = {
    'lead': (-3, 7, [" RR ", "RRRR", "RRRR", " RR ", " YY ", " yy ", " YY ", " yy ", " YY ", " yy ", " YY "], -1),
    'scout': (-4, 14, ["F     ", "FF    ", "FFFYNN", "FFFYNN", "FF    ", "F     "], -1),
    'planner': (-2, 9, ["  nn ", " nWn ", " nnn ", " nWn ", " nnn ", " nWn ", " nnn ", " nWn ", "  nn "], -1),
    'builder': (-2, 10, ["SSSSSS", "SSSSSS", "  BB  ", "  BB  ", "  BB  ", "  BB  ", "  BB  "], -3),
    'tester': (-2, 10, ["   L  ", " L    ", "  SS  ", "  SS  ", "  SS  ", " SLLS ", " SLLS ", "SLLLLS", "SLLLLS", "SSSSSS"], -1),
    'bugcatcher': (-4, 1, [" SSSSSS ", "Sw w w S", "S w w wS", "Sw wRw S", "S w w wS", "Sw w w S", " SSSSSS ", "    B   ",
                           "    B   ", "    B   ", "    B   ", "    B   ", "    B   ", "    B   ", "    B   ", "    B   ", "    B   "], -2),
    'reviewer': (-4, 9, ["bbbbbbb", "bWWWWWb", "bWLWssb", "bWWWWWb", "bWRWssb", "bWWWWWb", "bWLWssb", "bWWWWWb", "bbbbbbb"], -1),
    'researcher': (-4, 13, ["MMMM MMMM", "MWWWMWWWM", "MWsWMWsWM", "MWWWMWWWM", "MWsWMWsWM", "MMMMMMMMM"], -1),
    'operator': (-2, 8, ["SS  SS", "SS  SS", "SSSSSS", " SSSS ", "  SS  ", "  SS  ", "  SS  ", "  SS  ", "  SS  ", " SSSS "], -2),
    'courier': (-3, 10, ["WWWWWWW", "WWSSSWW", "WSWRWSW", "WWWWWWW", "WWWWWWW"], -1),
    'writer': (-3, 11, ["EEEEEE", "eEEEEe", " EbbE ", " EEEE ", " EbbE ", " EEEE ", " EbbE ", "eEEEEe", "EEEEEE"], -1),
    'artist': (-4, 8, ["     R ", "     B ", "     B ", "     B ", "       ", " TTTTT ", "TRTTLTT", "TTTTTnT", "TYT  TT", " TTTTT "], -1),
    'analyst': (-4, 10, ["WWWWWWWW", "WIIIIILW", "WIIIYILW", "WIRIYILW", "WIRIYILW", "WWWWWWWW", "   bb   ", "   bb   "], -1),
    'guard': (-3, 12, [" SSSS ", " S  S ", "YYYYYY", "YYKKYY", "YYKKYY", "YYYYYY"], -1),
    'janitor': (-2, -1, ["  B  "] * 17 + [" yyy ", "yyyyy", "yEyEy", "yEyEy", "yEyEy"], 0),
    'pilot': (-3, 10, ["K      ", "KK     ", "KWK    ", "KWWK   ", "KWWWK  ", "KWWWWK ", "KWWKKKK", "KWK    ", "KK     "], -2),
    'helper': (-2, 14, ["  KKK  ", "  K K  ", "RRRRRRR", "RRRYRRR", "rrrrrrr", "RRRRRRR"], -1),
}

ROLES = [
    ('lead', 'Lead', lead), ('scout', 'Scout', scout), ('planner', 'Planner', planner),
    ('builder', 'Builder', builder), ('tester', 'Tester', tester), ('bugcatcher', 'Bug catcher', bugcatcher),
    ('reviewer', 'Reviewer', reviewer), ('researcher', 'Researcher', researcher), ('operator', 'Operator', operator),
    ('courier', 'Courier', courier), ('writer', 'Writer', writer), ('artist', 'Artist', artist),
    ('analyst', 'Analyst', analyst), ('guard', 'Guard', guard), ('janitor', 'Janitor', janitor),
    ('pilot', 'Pilot', pilot), ('helper', 'Helper', helper),
]


# ---------------------------------------------------------------- frames
def bob(g):
    n = [r[:] for r in g]
    last = OY + 20
    for y in range(last, 0, -1):
        n[y] = g[y - 1][:]
    n[0] = ['.'] * SIZE
    return n


def blink(g):
    n = [r[:] for r in g]
    for x in (7, 8, 15, 16):
        if cell(n, x, 10) == 'K':
            setc(n, x, 10, 'W')
    return n


def character(key, fn, frame=0, eyes_closed=False, props=None):
    g = blink(base()) if eyes_closed else base()
    fn(g)
    if frame == 1:
        g = bob(g)
    x, y, rows, dy = (props or PROPS)[key]
    put(g, x, y + (1 + dy if frame == 1 else 0), rows)
    return g


def plain():
    return base()


def needs_you():
    g = base()
    helper(g)
    put(g, -4, 2, ["WWWWWWWW", "WWRRRRWW", "WRRWWRRW", "WWWWRRWW", "WWWRRWWW", "WWWWWWWW", "WWWRRWWW", "WWWWWWWW",
                   "   BB   ", "   BB   ", "   BB   ", "   BB   ", "   BB   ", "   BB   ", "   BB   "])
    return g


def asleep():
    g = blink(base())
    helper(g)
    g = bob(g)
    put(g, 19, 0, ["CCCC", "  C ", " C  ", "CCCC"])
    put(g, 23, -5, ["CCC", " C ", "CCC"])
    return g


def startled():
    g = base()
    helper(g)
    put(g, 7, 9, ["KK      KK"])
    put(g, 11, 15, ["KK"])
    put(g, 21, -2, ["YY", "YY", "YY", "YY", "  ", "YY"])
    put(g, -2, 3, ["Y  ", " Y ", "   ", "YY "])
    return g


def playing_dead():
    g = base()
    helper(g)
    f = blank()
    top, bot = OY + 0, OY + 22
    for y in range(top, bot + 1):
        f[top + bot - y + 2] = g[y][:]
    for x in (7, 8, 15, 16):
        Y = top + bot - (OY + 10) + 2
        f[Y][x + OX] = 'W'
    yy = top + bot - (OY + 14) + 2
    f[yy - 1][11 + OX] = 'R'
    f[yy - 1][12 + OX] = 'R'
    f[yy - 2][12 + OX] = 'R'
    f[yy - 3][12 + OX] = 'r'
    return f


JOEY = ["KK  KK", "WWWWWW", "WKWWKW", " WPPW "]


def lead_with_joeys(n=3):
    g = character('lead', lead, 0)
    spots = [(19, 2), (18, 10), (19, 14)]
    for x, y in spots[:n]:
        put(g, x, y, JOEY)
    return g


# ---------------------------------------------------------------- rendering
def to_image(g, scale, bg, outline=None, dim=0.0):
    im = Image.new('RGB', (SIZE * scale, SIZE * scale), bg)
    px = im.load()
    for y in range(SIZE):
        for x in range(SIZE):
            c = g[y][x]
            col = None
            if c != '.':
                col = PAL[c]
                if dim:
                    grey = int(0.3 * col[0] + 0.59 * col[1] + 0.11 * col[2])
                    col = tuple(int((grey * 0.7 + v * 0.3) * (1 - dim) + b * dim) for v, b in zip(col, bg))
            elif outline:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    X, Y = x + dx, y + dy
                    if 0 <= X < SIZE and 0 <= Y < SIZE and g[Y][X] != '.':
                        col = outline
                        break
            if col:
                for j in range(scale):
                    for i in range(scale):
                        px[x * scale + i, y * scale + j] = col
    return im


def sheet(items, scale, bg, fg, cols, outline=None, label=True):
    cw, ch = SIZE * scale + 16, SIZE * scale + (22 if label else 8)
    rows = (len(items) + cols - 1) // cols
    im = Image.new('RGB', (cols * cw + 16, rows * ch + 16), bg)
    d = ImageDraw.Draw(im)
    for n, it in enumerate(items):
        name, g = it[0], it[1]
        dim = it[2] if len(it) > 2 else 0.0
        x, y = 16 + (n % cols) * cw, 12 + (n // cols) * ch
        im.paste(to_image(g, scale, bg, outline, dim), (x, y))
        if label:
            d.text((x + 4, y + SIZE * scale + 4), name, fill=fg)
    return im


DARK, LIGHT = (26, 26, 28), (248, 246, 240)

CLASSIC_COSTUMES = {
    'lead': 'King', 'scout': 'Explorer', 'planner': 'Architect', 'builder': 'Builder', 'tester': 'Lab tester',
    'bugcatcher': 'Bug catcher', 'reviewer': 'Critic', 'researcher': 'Scholar', 'operator': 'Engineer',
    'courier': 'Postman', 'writer': 'Bard', 'artist': 'Painter', 'analyst': 'Bookkeeper',
    'guard': 'Agent in black', 'janitor': 'Cleaner', 'pilot': 'Aviator', 'helper': 'Helper',
}


# ---------------------------------------------------------------- sets
def hood(g, c, eyes=None, teeth=None):
    """A costume hood around the face: rows 2..14 of the body grid. The face shows through rows 9..13."""
    rows = ["  cccccccccccccc  ", " cccccccccccccccc ", "cccccccccccccccccc", "cccccccccccccccccc",
            "cccccccccccccccccc", "cccccccccccccccccc", "cccccccccccccccccc", "cc              cc",
            "cc              cc", "cc              cc", "cc              cc", " cc            cc ",
            "  ccc        ccc  "]
    put(g, 3, 2, [r.replace('c', c) for r in rows])
    if eyes:
        dots(g, [(6, 5), (7, 5), (16, 5), (17, 5)], eyes)
    if teeth:
        dots(g, [(x, 8) for x in range(7, 17, 2)], teeth)


class _Helpers:
    pass


H = _Helpers()
H.put, H.garment, H.dots, H.cell, H.setc, H.hood = put, garment, dots, cell, setc, hood


def load_sets():
    """classic lives in this file; every set_<id>.py beside it adds one more set."""
    import glob
    import importlib.util
    import os
    sets = [{'id': 'classic', 'title': 'Classic', 'costumes': CLASSIC_COSTUMES,
             'outfits': {k: fn for k, _, fn in ROLES}, 'props': PROPS}]
    here = os.path.dirname(os.path.abspath(__file__))
    for path in sorted(glob.glob(os.path.join(here, 'set_*.py'))):
        spec = importlib.util.spec_from_file_location(os.path.basename(path)[:-3], path)
        m = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(m)
        sets.append({'id': m.ID, 'title': m.TITLE, 'costumes': m.COSTUMES, 'props': m.PROPS,
                     'outfits': {k: (lambda g, f=f: f(g, H)) for k, f in m.OUTFITS.items()}})
    order = {'classic': 0, 'steampunk': 1, 'horror': 2, 'prehistoric': 3}
    sets.sort(key=lambda st: order.get(st['id'], 9))
    for st in sets:
        missing = [k for k, _, _ in ROLES if k not in st['outfits'] or k not in st['props'] or k not in st['costumes']]
        assert not missing, (st['id'], missing)
    return sets


def set_frames(st, frame=0, closed=False, label='role'):
    names = {k: n for k, n, _ in ROLES}
    return [((names[k] if label == 'role' else st['costumes'][k]), character(k, st['outfits'][k], frame, closed, st['props']))
            for k, _, _ in ROLES]


# ---------------------------------------------------------------- art export
def _layer_png(g, path):
    im = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    px = im.load()
    for y in range(SIZE):
        for x in range(SIZE):
            if g[y][x] != '.':
                px[x, y] = PAL[g[y][x]] + (255,)
    im.save(path)


def _layer_from_png(path):
    im = Image.open(path).convert('RGBA')
    rev = {v: k for k, v in PAL.items()}
    g = blank()
    for y in range(SIZE):
        for x in range(SIZE):
            r, gg, b, a = im.getpixel((x, y))
            if a:
                g[y][x] = rev[(r, gg, b)]
    return g


def _over(a, b):
    n = [r[:] for r in a]
    for y in range(SIZE):
        for x in range(SIZE):
            if b[y][x] != '.':
                n[y][x] = b[y][x]
    return n


def PAL_HEX(k):
    return '#%02x%02x%02x' % PAL[k]


def export_art(out, sets):
    """Writes the layers the build consumes: base, state extras, palette, and per set one outfit and one
    prop layer per role, plus the manifest. Then recomposes every sprite from the PNGs and checks it."""
    import json
    import os
    os.makedirs(out + '/extras', exist_ok=True)
    b = base()
    _layer_png(b, out + '/base.png')
    manifest_sets = {}
    for st in sets:
        sid = st['id']
        for d in ('outfits', 'props'):
            os.makedirs('%s/sets/%s/%s' % (out, sid, d), exist_ok=True)
        roles = []
        for key, _, _ in ROLES:
            dressed = base()
            st['outfits'][key](dressed)
            outfit = blank()
            for y in range(SIZE):
                for x in range(SIZE):
                    if dressed[y][x] != b[y][x]:
                        assert dressed[y][x] != '.', 'outfits only paint, never erase'
                        outfit[y][x] = dressed[y][x]
            prop = blank()
            x, y, rows, dy = st['props'][key]
            put(prop, x, y, rows)
            _layer_png(outfit, '%s/sets/%s/outfits/%s.png' % (out, sid, key))
            _layer_png(prop, '%s/sets/%s/props/%s.png' % (out, sid, key))
            roles.append({'id': key, 'costume': st['costumes'][key],
                          'outfit': 'sets/%s/outfits/%s.png' % (sid, key),
                          'prop': 'sets/%s/props/%s.png' % (sid, key), 'propWorkDy': 1 + dy})
        manifest_sets[sid] = {'title': st['title'], 'roles': roles}
    sign = blank()
    put(sign, -4, 2, ["WWWWWWWW", "WWRRRRWW", "WRRWWRRW", "WWWWRRWW", "WWWRRWWW", "WWWWWWWW", "WWWRRWWW", "WWWWWWWW",
                      "   BB   ", "   BB   ", "   BB   ", "   BB   ", "   BB   ", "   BB   ", "   BB   "])
    zzz = blank()
    put(zzz, 19, 0, ["CCCC", "  C ", " C  ", "CCCC"])
    put(zzz, 23, -5, ["CCC", " C ", "CCC"])
    alert = blank()
    put(alert, 21, -2, ["YY", "YY", "YY", "YY", "  ", "YY"])
    put(alert, -2, 3, ["Y  ", " Y ", "   ", "YY "])
    _layer_png(sign, out + '/extras/sign.png')
    _layer_png(zzz, out + '/extras/zzz.png')
    _layer_png(alert, out + '/extras/alert.png')
    joey = Image.new('RGBA', (6, 4), (0, 0, 0, 0))
    for j, r in enumerate(JOEY):
        for i, c in enumerate(r):
            if c != ' ':
                joey.putpixel((i, j), PAL[c] + (255,))
    joey.save(out + '/extras/joey.png')
    json.dump({k: PAL_HEX(k) for k in PAL}, open(out + '/palette.json', 'w'), indent=1)
    manifest = {
        'canvas': [SIZE, SIZE],
        'bodyOffset': [OX, OY],
        'note': 'All layer PNGs are 32x32 RGBA, already positioned on the canvas. Coordinates below are canvas pixels, x right, y down.',
        'compose': ['base', 'outfit (from the set)', 'state marks', 'prop (from the set) or state extra'],
        'shared': 'base.png, extras/, palette.json, the recipes, the role ids and the role names are shared by every set; a set is 17 outfit and 17 prop layers and a costume name per role',
        'eyes': {'pupilTopRow': [[11, 17], [12, 17], [19, 17], [20, 17]], 'closedColour': PAL_HEX('W'),
                 'note': 'closing the eyes repaints these four pixels on the base layer, under the outfit, so glasses and masks stay intact'},
        'bob': {'shiftDownRows': [0, OY + 20], 'by': 1, 'staysPut': 'rows %d and below (legs, feet)' % (OY + 21)},
        'roleNames': {k: n for k, n, _ in ROLES},
        'defaultSet': 'classic',
        'sets': manifest_sets,
        'recipes': {
            'idle': {'frames': [{'body': 'none'}]},
            'blink': {'frames': [{'body': 'none', 'eyes': 'closed'}]},
            'working': {'frames': [{'body': 'none', 'propDy': 0}, {'body': 'bob', 'propDy': 'propWorkDy'}],
                        'note': 'the bob moves outfit with body; the prop layer moves by its own offset'},
            'planned': {'frames': [{'body': 'none'}], 'colour': 'greyed: 70% luminance grey, 30% colour, then 45% toward the background'},
            'needs-you': {'frames': [{'body': 'none', 'extra': 'extras/sign.png', 'prop': 'hidden'}]},
            'finished': {'frames': [{'body': 'bob', 'eyes': 'closed', 'extra': 'extras/zzz.png'}]},
            'stopped': {'frames': [{'body': 'none', 'extra': 'extras/alert.png',
                                    'marks': {'#26262e': [[11, 16], [12, 16], [19, 16], [20, 16], [15, 22], [16, 22]]}}],
                        'note': 'marks are raised brows and an open mouth'},
            'failed': {'frames': [{'body': 'flip-vertical rows %d..%d, then down 2' % (OY, OY + 22), 'eyes': 'closed',
                                   'marks': 'tongue: 3 red pixels and 1 dark red beside the nose; see playing_dead() in the script'}]},
        },
        'reference': 'sprites-first-pass.py and the set_<id>.py files beside it draw every pose above and are the reference for each recipe.',
    }
    json.dump(manifest, open(out + '/manifest.json', 'w'), indent=1)
    bb = _layer_from_png(out + '/base.png')
    n = 0
    for st in sets:
        for key, _, _ in ROLES:
            g = _over(_over(bb, _layer_from_png('%s/sets/%s/outfits/%s.png' % (out, st['id'], key))),
                      _layer_from_png('%s/sets/%s/props/%s.png' % (out, st['id'], key)))
            assert g == character(key, st['outfits'][key], 0, False, st['props']), (st['id'], key)
            n += 1
    print('art export ok: %d sprites in %d sets recompose exactly' % (n, len(sets)))


if __name__ == '__main__':
    out = sys.argv[1]
    only = [a[6:] for a in sys.argv if a.startswith('--set=')]
    sets = [st for st in load_sets() if not only or st['id'] in only]
    fg = (200, 200, 205)
    for st in sets:
        sid = st['id']
        suffix = '' if sid == 'classic' else '-' + sid
        f0, f1, fb = set_frames(st, 0), set_frames(st, 1), set_frames(st, 0, True)
        sheet(f0, 5, DARK, fg, 6).save('%s/roles%s-dark.png' % (out, suffix))
        sheet(f0, 5, LIGHT, (60, 60, 66), 6, outline=(70, 70, 80)).save('%s/roles%s-light.png' % (out, suffix))
        frames = [sheet(f, 3, DARK, fg, 6) for f in (f0, f1, f0, f1, fb, f1)]
        frames[0].save('%s/squad%s-preview.gif' % (out, suffix), save_all=True, append_images=frames[1:], duration=220, loop=0)
    if not only:
        allf = [it for st in sets for it in set_frames(st, 0)]
        sheet(allf, 2, DARK, fg, 17, label=False).save(out + '/sets-at-panel-size.png')
        sheet(set_frames(sets[0], 0), 2, DARK, fg, 9, label=False).save(out + '/roles-at-panel-size.png')
        states = [('Starting', plain()), ('Planned', character('helper', helper, 0), 0.45), ('Needs you', needs_you()),
                  ('Finished', asleep()), ('Failed', playing_dead()), ('Stopped', startled()),
                  ('Lead + joeys', lead_with_joeys())]
        sheet(states, 5, DARK, fg, 7).save(out + '/states-dark.png')
        if '--art' in sys.argv:
            export_art(out + '/art', sets)
