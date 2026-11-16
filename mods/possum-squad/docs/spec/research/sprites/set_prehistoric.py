"""Possum Squad - the `prehistoric` set: stone-age opossums, some in dinosaur costumes. Loaded by sprites-first-pass.py."""
ID = 'prehistoric'
TITLE = 'Prehistoric'

COSTUMES = {
    'lead': 'Tribe chief', 'scout': 'Hunter', 'planner': 'Henge planner', 'builder': 'Mason',
    'tester': 'Wheel inventor', 'bugcatcher': 'Dragonfly catcher', 'reviewer': 'Elder',
    'researcher': 'Fossil digger', 'operator': 'Firekeeper', 'courier': 'Pterodactyl', 'writer': 'Carver',
    'artist': 'Cave painter', 'analyst': 'Stegosaurus', 'guard': 'T-rex', 'janitor': 'Sweeper',
    'pilot': 'Driver', 'helper': 'Cave kid',
}

SPOTS = [(7, 16), (9, 18), (15, 16), (16, 19), (12, 19), (8, 20), (13, 17), (10, 16)]


def leopard(g, h):
    h.garment(g, 'Y', 'Y')
    h.dots(g, SPOTS, 'b')
    h.dots(g, [(6, 16), (7, 15), (7, 16), (8, 15), (6, 17)], 'G')
    h.dots(g, [(7, 20), (10, 20), (13, 20), (16, 20)], 'y')


def hide(g, h, c, shade):
    """A one-shoulder hide tunic with a ragged hem."""
    h.garment(g, c, c)
    h.dots(g, [(16, 15), (17, 16), (16, 16), (15, 15), (17, 17)], 'G')
    h.dots(g, [(7, 20), (9, 20), (11, 20), (13, 20), (15, 20), (8, 17), (13, 18)], shade)


def lead(g, h):
    leopard(g, h)
    h.put(g, 7, 15, ["EsEsEsEsEs"])
    h.put(g, 4, 0, ["  R  C  Y  L  R ",
                    "  R  C  Y  L  R ",
                    "  r  c  y  l  r ",
                    "  R  C  Y  L  R ",
                    "  R  C  Y  L  R ",
                    " EEEEEEEEEEEEEE ",
                    " bEbEbEbEbEbEbE "])


def scout(g, h):
    hide(g, h, 'B', 'b')
    h.put(g, 4, 0, ["E              E",
                    "EE            EE",
                    " EEEEEEEEEEEEEE ",
                    "  EEEEEEEEEEEE  ",
                    "  EEKKEEEEKKEE  ",
                    "  EEEEEeeEEEEE  ",
                    "  WE E EE E EW  "])
    h.dots(g, [(6, 12), (7, 12), (16, 12), (17, 12)], 'r')


def planner(g, h):
    hide(g, h, 'T', 't')
    h.put(g, 7, 15, ["EsEsEsEsEs"])
    h.put(g, 5, 6, ["bbbbbbbbbbbbbb"])
    h.put(g, 12, -1, ["CC RR", "CC RR", "Cc Rr", "CC RR", "CC RR", "cC rR", " C  R"])


def builder(g, h):
    hide(g, h, 'B', 'b')
    h.put(g, 4, 2, ["     SSSSSS     ",
                    "   SSSSSSSSSS   ",
                    "  SSsSSSSSSDSS  ",
                    "  SSSSSsSSDSSS  ",
                    " ssssssssssssss "])


def tester(g, h):
    leopard(g, h)
    h.put(g, 5, 6, ["RRRRRRRRRRRRRR"])
    h.put(g, 17, 1, [" C", " C", "CC", "Cc", "C "])


def bugcatcher(g, h):
    hide(g, h, 'B', 'b')
    h.put(g, 4, 1, ["        l       ",
                    "     LLLLLL     ",
                    "   LLLLlLLLLL   ",
                    "  LLLLLlLLLLLLL ",
                    " LLLLLLlLLLLLLLL",
                    "  LLLLLlLLLLLL  "])


def reviewer(g, h):
    hide(g, h, 'D', 's')
    h.put(g, 5, 6, ["EbEbEbEbEbEbEb"])
    h.put(g, 6, 9, ["SSS      SSS"])
    h.put(g, 7, 13, ["ww      ww",
                     "www    www",
                     "wwwwwwwwww",
                     " wwSwwSww ",
                     " wwwwwwww ",
                     "  wwSSww  ",
                     "   wwww   ",
                     "    ww    "])


def researcher(g, h):
    hide(g, h, 'T', 't')
    h.dots(g, [(7, 15), (8, 16), (9, 17)], 't')
    h.put(g, 4, 1, ["      llll      ",
                    "    llLLLLll    ",
                    "   lLLlLLlLLl   ",
                    "  lLLLLLLLLLLl  ",
                    "  lLlLLlLLlLLl  ",
                    "  llllllllllll  "])


def operator(g, h):
    hide(g, h, 'b', 'B')
    h.dots(g, [(6, 12), (17, 12), (9, 13), (15, 13)], 's')
    h.put(g, 5, 6, ["BBBBBBBBBBBBBB"])
    h.put(g, 2, -2, ["E  E            E  E",
                     "EE E            E EE",
                     " EEE            EEE ",
                     "  EE            EE  ",
                     "  EE            EE  ",
                     "   E            E   "])


def courier(g, h):
    h.garment(g, 'c', 'C', 'c')
    h.hood(g, 'c', eyes='Y')
    h.put(g, 9, 7, ["YYYYYY", " YYYY ", "  YY  "])
    h.put(g, 12, -3, ["     cc", "    ccc", "   ccc ", "  ccc  ", " ccc   "])
    h.put(g, -2, 14, ["cc   cc", "ccc ccc", "ccccccc", "cc cc c", "c  c   "])
    h.put(g, 19, 12, ["cc   cc", "ccc ccc", "ccccccc", "c cc cc", "   c  c"])


def writer(g, h):
    hide(g, h, 'E', 'e')
    h.dots(g, [(7, 15), (8, 16), (9, 17)], 'e')
    h.put(g, 5, 4, ["l l        l l",
                    " lLl      lLl ",
                    "  lLLllllLLl  "])


def artist(g, h):
    hide(g, h, 'T', 't')
    h.dots(g, [(8, 17), (9, 17), (8, 18), (14, 19), (15, 19), (15, 20)], 'R')
    h.dots(g, [(12, 16), (13, 16), (12, 17)], 'O')
    h.dots(g, [(6, 12), (7, 12), (16, 12), (17, 12)], 'R')
    h.put(g, 5, 6, ["OOOOOOOOOOOOOO"])
    h.put(g, 5, 1, ["R R", "R R", "r r", "R R", "R R"])


def analyst(g, h):
    h.garment(g, 'O', 'F', 'O')
    h.hood(g, 'O', eyes='F')
    h.dots(g, [(7, 5), (16, 5)], 'K')
    h.dots(g, [(10, 3), (13, 6), (5, 7), (18, 4), (8, 18), (15, 17), (16, 20)], 'o')
    h.put(g, 5, -2, ["      YY      ",
                     "     YYYY     ",
                     " YY  YYYY  YY ",
                     "yYYy yYYy yYYy"])


def guard(g, h):
    h.garment(g, 'L', 'E', 'L')
    h.hood(g, 'L', eyes='Y', teeth='W')
    h.dots(g, [(7, 5), (16, 5)], 'K')
    h.put(g, 8, 0, ["l  l  l ", "ll ll ll"])
    h.dots(g, [(8, 18), (15, 17), (16, 20)], 'l')


def janitor(g, h):
    hide(g, h, 'B', 'b')
    h.put(g, 4, 3, ["    TTTTTTTT    ",
                    "  TTtTTTtTTTtT  ",
                    " TTTTTtTTTtTTTT ",
                    " TtTTTTTTTTTTtT "])
    h.put(g, 19, 5, ["TT ", "tTT", " tT"])


def pilot(g, h):
    leopard(g, h)
    h.put(g, 7, 15, ["TTTTTTTTTT"])
    h.put(g, 5, 2, ["    BBBBBB    ",
                    "  BBBBBBBBBB  ",
                    " BBBBBBBBBBBB ",
                    " BBBBBBBBBBBB ",
                    " EEEE BB EEEE ",
                    "BEIIEBBBBEIIEB",
                    " EEEE    EEEE "])


def helper(g, h):
    leopard(g, h)
    h.put(g, 8, 3, ["W      W", "WWWWWWWW", "W  RR  W"])


OUTFITS = {'lead': lead, 'scout': scout, 'planner': planner, 'builder': builder, 'tester': tester,
           'bugcatcher': bugcatcher, 'reviewer': reviewer, 'researcher': researcher, 'operator': operator,
           'courier': courier, 'writer': writer, 'artist': artist, 'analyst': analyst, 'guard': guard,
           'janitor': janitor, 'pilot': pilot, 'helper': helper}

PROPS = {
    'lead': (-3, -2, [" WWW ", "WKWKW", "WWWWW", " W W "] + ["  B  "] * 17, 0),
    'scout': (-2, -3, ["  S  ", " SSS ", " SSS ", "  S  ", "  E  "] + ["  B  "] * 18, 0),
    'planner': (-4, 10, [" SSSSSS ", "SSSSSSSS", "SIIIIIIS", "SSISSISS", "SSISSISS", "SSISSISS", "SSSSSSSS"], -1),
    'builder': (-3, 9, ["SSSSSS", "SSSSSS", "sSSSSs", "  EE  ", "  BB  ", "  BB  ", "  BB  ", "  BB  "], -3),
    'tester': (-4, 9, ["SSSSSSSS", "SsSSSSsS", "SSS  SSS", "SS    SS", "SS    SS", "SSS  SSS", "SsSSSSsS", "SSSSSSSS"], -1),
    'bugcatcher': (-4, 1, [" llllll ", "lE E E l", "l ECnC l", "lE Cn El", "l E n El", "lE E E l", " llllll "] + ["    l   "] * 10, -2),
    'reviewer': (-4, 10, [" SSSSS ", "SISISIS", "SISISIS", "SISISIS", "SSSSSSS", "SIIIISS", "SSSSSSS"], -1),
    'researcher': (-3, 11, ["  EE  ", " EEEE ", "EElEEE", "EEEElE", "ElEEEE", "EEEEEE", " EEEE "], -1),
    'operator': (-4, 16, ["   R   ", "  ROR  ", " ROYOR ", " OYYYO ", "BBBBBBB", " B B B "], 0),
    'courier': (-3, 8, ["SSSSSSS", "SIISIIS", "SSSSSSS", "SISIISS", "SSSSSSS"], -1),
    'writer': (-4, 9, [" SSSSSS ", "SSISSISS", "SISISSIS", "SSSIISSS", "SISSISIS", "SSSSSSSS", "     s  ", "     B  "], -1),
    'artist': (-4, 9, ["TTTTTTTT", "TTrrrTTT", "TrrrrrrT", "TTr TrTT", "TTTTTTTT"], -1),
    'analyst': (-4, 8, ["bbbbbbb", "bSSBBOb", "b     b", "bSBOOSb", "b     b", "bOBBSSb", "b     b", "bSOOBSb", "bbbbbbb"], -1),
    'guard': (-3, 8, ["WW WW", "WWWWW", " WWW ", "  W  ", "  W  ", "  W  ", "  W  ", "  W  ", " WWW ", "WW WW"], -2),
    'janitor': (-2, -1, ["  B  "] * 17 + [" LLL ", "LLlLL", "LlLLL", "LLLlL", " L L "], 0),
    'pilot': (-4, 10, [" SSSSS ", "SS S SS", "S SSS S", "SSS SSS", "S SSS S", "SS S SS", " SSSSS "], -1),
    'helper': (-3, 13, [" R R  ", "RRRRR ", "TtTtTT", "tTtTtT", "TtTtTT", " TTTT "], -1),
}
