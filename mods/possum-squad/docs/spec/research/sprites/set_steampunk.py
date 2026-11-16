"""Possum Squad - the `steampunk` set. Loaded by sprites-first-pass.py; h holds its drawing helpers."""
ID = 'steampunk'
TITLE = 'Steampunk'

COSTUMES = {
    'lead': 'Inventor-in-chief', 'scout': 'Aeronaut', 'planner': 'Draughtsman', 'builder': 'Boilermaker',
    'tester': 'Chemist', 'bugcatcher': 'Collector', 'reviewer': 'Inspector', 'researcher': 'Professor',
    'operator': 'Stoker', 'courier': 'Rocket postman', 'writer': 'Typist', 'artist': 'Photographer',
    'analyst': 'Clerk', 'guard': 'Diver', 'janitor': 'Chimney sweep', 'pilot': 'Airship pilot',
    'helper': 'Tin wind-up',
}


def lead(g, h):
    h.garment(g, 'c', None, 'b')
    h.put(g, 10, 15, ["OooO"])
    h.dots(g, [(8, 17), (8, 19), (15, 17), (15, 19)], 'Y')
    h.dots(g, [(9, 16), (14, 16)], 'C')
    h.dots(g, [(13, 18), (14, 19), (15, 18)], 'y')
    h.put(g, 5, -3, ["   BBBBBBBb   ",
                     "   BBBBBBBb   ",
                     "   BBBByBBb   ",
                     "   BBByYyBb   ",
                     "   BBBByBBb   ",
                     "   BBBBBBBb   ",
                     "  yCCyyyyCCy  ",
                     "   yyyyyyyy   ",
                     "   BBBBBBBb   ",
                     "bbbbbbbbbbbbbb"])


def scout(g, h):
    h.garment(g, 'B')
    h.put(g, 8, 15, ["RRRRRRRR", "   rr   "])
    h.put(g, 4, 1, ["      TTTT      ",
                    "    TTTTTTTT    ",
                    "   TTTTTTTTTT   ",
                    "  TyCCyTTyCCyT  ",
                    "  bbbbbbbbbbbb  ",
                    "TTTTTTTTTTTTTTTT"])


def planner(g, h):
    h.garment(g, 'l')
    h.put(g, 10, 15, ["yYYy"])
    h.dots(g, [(11, 17), (12, 17), (11, 19), (12, 19)], 'Y')
    h.put(g, 7, 12, ["b        b", "bbbb  bbbb"])
    h.put(g, 5, 1, ["    ssssss    ",
                    "   sssssssS   ",
                    "  sssssssssS  ",
                    "  sssssssssS  ",
                    "  yyyyYYyyyy  ",
                    " ssssssssssss "])


def builder(g, h):
    h.put(g, 8, 16, ["BBBBBBBB"] * 5)
    h.dots(g, [(9, 15), (14, 15)], 'B')
    h.put(g, 10, 18, ["bbbb", "bBBb"])
    h.dots(g, [(8, 16), (15, 16), (8, 20), (15, 20)], 'y')
    h.dots(g, [(6, 12), (16, 13)], 's')
    h.put(g, 5, 2, ["    bbbbbb    ",
                    "  bbbbbbbbbb  ",
                    " bbbbbbbbbbbb ",
                    " bbbbbbbbbbbb ",
                    " yyyy bb yyyy ",
                    "byIIybbbbyIIyb",
                    " yyyy    yyyy "])


def tester(g, h):
    h.garment(g, 'E', 'w')
    h.dots(g, [(11, 17), (12, 17), (11, 19), (12, 19)], 'O')
    h.put(g, 5, 6, [" yyyy    yyyy ",
                    "byLLybbbbyLLyb",
                    " yyyy    yyyy "])


def bugcatcher(g, h):
    h.garment(g, 'T')
    h.put(g, 10, 15, ["RrrR"])
    h.put(g, 4, 3, ["    EEEEEEEE    ",
                    "    EEEEEEEE    ",
                    "    RRRRRRRR    ",
                    "EEEEEEEEEEEEEEEE"])


def reviewer(g, h):
    h.garment(g, 'T', 'T')
    h.put(g, 7, 15, ["BBBBBBBBBB"])
    h.dots(g, [(11, 17), (12, 17), (11, 19), (12, 19)], 'b')
    h.dots(g, [(11, 0), (12, 0)], 'b')
    h.put(g, 4, 1, ["      TTTT      ",
                    "    TBTTTTBT    ",
                    "   TTTBTTBTTT   ",
                    "  TTBTTTTTTBTT  ",
                    "  TTTTBTTBTTTT  ",
                    "tttttttttttttttt"])


def researcher(g, h):
    h.garment(g, 'v')
    h.put(g, 10, 15, ["EEEE", " EE "])
    h.put(g, 7, 2, ["  MMMMMM  ",
                    " MMMMMMMM ",
                    " MMMMMMMMY",
                    " yyyyyyyyY",
                    "         Y"])
    h.put(g, 6, 9, [" yyyy  yyyy ",
                    "y    yy    y",
                    "y    yy    y",
                    " yyyy  yyyy "])


def operator(g, h):
    h.put(g, 8, 16, ["oooooooo"] * 5)
    h.dots(g, [(8, 15), (15, 15)], 'o')
    h.dots(g, [(9, 16), (14, 16)], 'Y')
    h.put(g, 10, 18, ["OOOO", "OooO"])
    h.garment(g, None, None, 'o')
    h.dots(g, [(16, 12), (7, 13), (6, 11)], 's')
    h.put(g, 4, 1, ["     bbbbbb     ",
                    "    bBbBbBbB    ",
                    "   bBbBbBbBbB   ",
                    "  byCCybbyCCyb  ",
                    "   bbbbbbbbbb   ",
                    "  ssssssssssss  "])


def courier(g, h):
    h.garment(g, 'N', 'N', 'N')
    h.dots(g, [(11, 16), (12, 16), (11, 18), (12, 18), (11, 20), (12, 20)], 'Y')
    h.put(g, 1, 8, [" R ", "RYR", "yYy", "yYy", "yYy", "yYy", "yYy", "yyy", "sOs", " O ", " R "])
    h.put(g, 20, 8, [" R ", "RYR", "yYy", "yYy", "yYy", "yYy", "yyy", "sOs"])
    h.put(g, 4, 1, ["     NNNNNN     ",
                    "   NNNNNNNNNN   ",
                    "  NNNNNNNNNNNN  ",
                    "  NNNNNYYNNNNN  ",
                    "  RRRRRRRRRRRR  ",
                    "   KKKKKKKKKK   "])


def writer(g, h):
    h.garment(g, 'M')
    h.dots(g, [(6, 17), (17, 17)], 'Y')
    h.put(g, 10, 15, ["IIII"])
    h.put(g, 4, 4, ["   llllllllll   ",
                    "  LLLLLLLLLLLL  ",
                    "  LLLLLLLLLLLL  ",
                    "cLLLLLLLLLLLLLLc"])


def artist(g, h):
    h.garment(g, 'E', 'E')
    h.put(g, 9, 15, ["NNNNNN", " NNNN ", "  NN  "])
    h.dots(g, [(11, 19), (12, 19)], 'b')
    h.put(g, 4, 1, ["        oo      ",
                    "     OOOOOOOO   ",
                    "   OOOOOOOOOOOO ",
                    "  OOOOOOOOOOOOOO",
                    "  OOOOOOOOOOOOO ",
                    "   oooooooooo   "])


def analyst(g, h):
    h.garment(g, 'l')
    h.put(g, 11, 15, ["II", "II", "II", " I"])
    h.dots(g, [(7, 18), (8, 19), (9, 19)], 'Y')
    h.dots(g, [(6, 16), (17, 16)], 'L')
    h.put(g, 5, 6, ["bbbbbbbbbbbbbb"])
    h.put(g, 13, 7, ["yyyyy", "yCCCy", "yCCCy", "yyyyy"])


def guard(g, h):
    h.garment(g, 'T', 'T', 'T')
    h.put(g, 6, 19, ["bbbbbYYbbbbb"])
    h.put(g, 3, 0, ["       yyyy       ",
                    "     YYYYYYYY     ",
                    "   YYYYYYYYYYYY   ",
                    "  YYYYYYYYYYYYYY  ",
                    " YYYYYYYYYYYYYYYY ",
                    " YYsYYYYYYYYYYsYY ",
                    "YYYYYYYYYYYYYYYYYY",
                    "YYYYyyyyyyyyyyYYYY",
                    "YYYy          yYYY",
                    "YYy            yYY",
                    "YYy            yYY",
                    "YYy            yYY",
                    "YYy            yYY",
                    "YYYy          yYYY",
                    " YYYyyyyyyyyyyYYY ",
                    "  ssssssssssssss  "])


def janitor(g, h):
    h.garment(g, 's')
    h.put(g, 8, 15, ["RRRRRRRR", "      Rr", "      R "])
    h.dots(g, [(6, 12), (17, 11), (9, 13)], 's')
    h.put(g, 4, 3, ["    IIIIIIII    ",
                    "  IIIIIIIIIIII  ",
                    " IIIIIIIIIIIIII ",
                    "  ssssssssssss  "])


def pilot(g, h):
    h.garment(g, 'N', 'N')
    h.dots(g, [(10, 17), (13, 17), (10, 19), (13, 19)], 'Y')
    h.put(g, 7, 15, ["EEEEEEEEEE"])
    h.put(g, 16, 11, ["     EE ", "   EEEEe", " EEEE  e", "EEE     "])
    h.put(g, 3, 1, ["      BBBBBB      ",
                    "    BBBBBBBBBB    ",
                    "   BBBBBBBBBBBB   ",
                    "  BBBBBBBBBBBBBB  ",
                    "  ByyyyybbyyyyyB  ",
                    "  ByCCCybbyCCCyB  ",
                    "  BByyyBBBByyyBB  ",
                    "  BB          BB  ",
                    "  BB          BB  ",
                    "  Bb          bB  ",
                    "  bb          bb  ",
                    "   b          b   "])


def helper(g, h):
    h.garment(g, 'S', 'S', 's')
    h.dots(g, [(6, 16), (17, 16), (7, 20), (16, 20)], 's')
    h.put(g, 10, 16, ["yyyy", "yRRy", "yRRy", "yyyy"])
    h.put(g, 19, 7, [" YY ", "Y  Y", "Y  Y", " YY ", " YY ", " YY ", " yy "])
    h.put(g, 5, 0, ["      ss      ",
                    "      SS      ",
                    "     SSSS     ",
                    "    SSSSSS    ",
                    "   SSSSSSSS   ",
                    "  SSSSSSSSSS  ",
                    " ssssssssssss "])


OUTFITS = {'lead': lead, 'scout': scout, 'planner': planner, 'builder': builder, 'tester': tester,
           'bugcatcher': bugcatcher, 'reviewer': reviewer, 'researcher': researcher, 'operator': operator,
           'courier': courier, 'writer': writer, 'artist': artist, 'analyst': analyst, 'guard': guard,
           'janitor': janitor, 'pilot': pilot, 'helper': helper}

# hand props: (x, y, rows, dy on the second work frame)
PROPS = {
    'lead': (-3, 11, ["y     ", "yY    ", "yYY   ", "yYYYBB", "yYYYBB", "yYY   ", "yY    ", "y     "], -1),
    'scout': (-4, 14, ["yy      ", "yyYYYSSb", "yyYYYSSb", "yy      "], -1),
    'planner': (-4, 9, ["yyyyyyy", "nnnnnnn", "nWWWWWn", "nWnnnWn", "nWnWWWn", "nWnnnWn", "nWWWWWn", "nnnnnnn", "yyyyyyy"], -1),
    'builder': (-2, 9, ["SSSSSS", "ySSSSy", "SSSSSS", "  BB  ", "  BB  ", "  BB  ", "  BB  ", "  BB  "], -3),
    'tester': (-4, 7, ["    L  ", "  L    ", "   SS  ", "   SS  ", "   SS  ", "  SLLS ", " SLLLLS", " SLLLLS", "  SSSS ", "  O  O ", " yyyyyy", " y    y"], -1),
    'bugcatcher': (-4, 1, [" SSSSSS ", "Sw w w S", "S w w wS", "Sw wYw S", "S wYYYwS", "Sw w w S", " SSSSSS "] + ["    B   "] * 10, -2),
    'reviewer': (-4, 8, [" yyyyy  ", "yCCCCCy ", "yCWWCCy ", "yCWCCCy ", "yCCCCCy ", "yCCCCCy ", " yyyyy  ", "     bb ", "      bb", "       b"], -1),
    'researcher': (-4, 13, ["BBBB BBBB", "BEEEBEEEB", "BEsEBEsEB", "BEEEBEEEB", "BEsEBEsEB", "BBBBBBBBB"], -1),
    'operator': (-4, 9, ["  w    ", " ww    ", "  RRR  ", " R R R ", "R  R  R", "RRRSRRR", "R  R  R", " R R R ", "  RRR  ", "  sss  ", "  sss  "], -2),
    'courier': (-3, 14, ["WWWWWWW", "WWSSSWW", "WSWRWSW", "WWWWWWW", "WWWWWWW"], -1),
    'writer': (-4, 9, ["  WWWWW  ", "  WsssW  ", "  WsssW  ", " bbbbbbb ", "byKyKyKyb", "bKyKyKyKb", "byKyKyKyb", "bbbbbbbbb"], -1),
    'artist': (-4, 8, ["bbbbbb  ", "bSSSSbBB", "bSCCSbBB", "bSSSSbBB", "bbbbbb  ", "  ss    ", " s  s   ", " s  s   ", "s    s  ", "s    s  ", "s    s  "], 0),
    'analyst': (-4, 9, ["    W   ", "    W   ", "yyyyWyyy", "yWWWWWyY", "yKyKyKyY", "yyKyKyyy", "yKyKyKy ", "bbbbbbb "], -1),
    'guard': (-2, 7, ["YYYY", "Y  Y", "Y  Y", "YYYY", " YY ", " YY ", " YY ", " YYY", " YY ", " YYY"], -1),
    'janitor': (-3, -2, [" sIsIs ", "IsIsIsI", "sIsIsIs", "IsIsIsI", " sIsIs "] + ["   B   "] * 16, 0),
    'pilot': (-4, 10, ["  BBB  ", " B B B ", "B BBB B", "BBByBBB", "B BBB B", " B B B ", "  BBB  "], -1),
    'helper': (-4, 12, ["Y      ", " y     ", "  y    ", "   yYY ", "  YYYYY", "  YYYYY", "  yyyyy"], -1),
}
