"""Possum Squad - the `horror` set: opossums in monster costumes. Loaded by sprites-first-pass.py."""
ID = 'horror'
TITLE = 'Horror'

COSTUMES = {
    'lead': 'Vampire count', 'scout': 'Werewolf', 'planner': 'Fortune teller', 'builder': 'Stitched creature',
    'tester': 'Mad scientist', 'bugcatcher': 'Monster hunter', 'reviewer': 'Grim reaper',
    'researcher': 'Plague doctor', 'operator': 'Lab assistant', 'courier': 'Bat', 'writer': 'Ghost writer',
    'artist': 'Sugar skull', 'analyst': 'Mummy', 'guard': 'Gargoyle', 'janitor': 'Gravedigger',
    'pilot': 'Witch', 'helper': 'Pumpkin kid',
}


def lead(g, h):
    h.garment(g, 'I', None, 'I')
    h.put(g, 10, 15, ["RRRR", " yy "])
    h.dots(g, [(7, 10), (8, 10), (15, 10), (16, 10)], 'R')
    h.put(g, 7, 5, ["IIIIIIIIII", "IIIIIIIIII", "IIIIIIIIII", "   IIII   ", "    II    "])
    h.put(g, 2, 8, ["N                  N",
                    "NN                NN",
                    "NN                NN",
                    "NRN              NRN",
                    "NRN              NRN",
                    "NRRN            NRRN",
                    "NRRRN          NRRRN"])
    h.put(g, 2, 15, ["NNNN", "NRNN", "NRN ", "NRRN", "NRRN", "NRRNN", " NNNN"])
    h.put(g, 18, 15, ["NNN", " NN", "  N"])


def scout(g, h):
    h.garment(g, 'D', 'S', 'D')
    h.hood(g, 'D', eyes='Y', teeth='W')
    h.put(g, 4, -1, [" DD          DD ", "DDDD        DDDD", "DDPD        DPDD"])


def planner(g, h):
    h.garment(g, 'v')
    h.put(g, 7, 15, ["YvYvYvYvYv"])
    h.dots(g, [(8, 18), (15, 17), (16, 19)], 'Y')
    h.put(g, 4, 2, ["     VVVVVV     ",
                    "   VVVVVVVVVV   ",
                    "  VVVVVVVVVVVV  ",
                    "  VVVVVVVVVVVV  ",
                    "  yVyVyVyVyVyV  "])
    h.put(g, 19, 6, ["VV", "vV", " v", " v"])
    h.dots(g, [(4, 9), (3, 10), (4, 11)], 'Y')


def builder(g, h):
    h.garment(g, 'D', None, 'D')
    h.put(g, 7, 17, ["ll", "ll"])
    h.dots(g, [(9, 17), (9, 18), (7, 19), (8, 19)], 'E')
    h.dots(g, [(11, 15), (12, 16), (11, 17), (12, 18), (11, 19), (12, 20)], 'I')
    h.put(g, 7, 8, ["I I I I I "])
    h.dots(g, [(16, 11), (17, 12), (16, 13)], 'I')
    h.dots(g, [(4, 12), (5, 12), (18, 12), (19, 12)], 'S')
    h.put(g, 6, 4, [" I  I  I  I ", "IIIIIIIIIIII", " IIIIIIIIII "])


def tester(g, h):
    h.garment(g, 'W', 'w')
    h.dots(g, [(11, 17), (12, 17), (11, 19), (12, 19)], 'I')
    h.put(g, 3, 0, ["  S   W  S   W  S ",
                    "  SS SS SSS SS SS ",
                    " SSSSSSSSSSSSSSSS ",
                    "SSSwSSSSSSSSSSwSSS",
                    "SSSS          SSSS",
                    "SwS            SwS"])
    h.put(g, 5, 6, [" ssss    ssss ",
                    "IsLLsIIIIsLLsI",
                    " ssss    ssss "])


def bugcatcher(g, h):
    h.garment(g, 'B', 'B')
    h.put(g, 7, 15, ["bbbbbbbbbb"])
    h.put(g, 6, 19, ["bbbbbYYbbbbb"])
    h.put(g, 3, 1, ["      bbbbbb      ",
                    "     bbbbbbbb     ",
                    "     bbbbbbbb     ",
                    "     yyyYYyyy     ",
                    "bbbbbbbbbbbbbbbbbb"])


def reviewer(g, h):
    h.garment(g, 'I', 'I', 'I')
    h.put(g, 6, 19, ["EEEEEEEEEEEE"])
    h.put(g, 3, 0, ["        II        ",
                    "      IIIIII      ",
                    "    IIIIIIIIII    ",
                    "   IIIIIIIIIIII   ",
                    "  IIIIIIIIIIIIII  ",
                    " IIIIIIIIIIIIIIII ",
                    "IIIIIIIIIIIIIIIIII",
                    "IIIINNNNNNNNNNIIII",
                    "IIIN          NIII",
                    "IIN            NII",
                    "IIN            NII",
                    "IIN            NII",
                    "IIN            NII",
                    " IIN          NII ",
                    "  IIII      IIII  "])


def researcher(g, h):
    h.garment(g, 'I', 'I', 'I')
    h.put(g, 5, 9, ["TTTTTTTTTTTTTT",
                    "TTIIITTTTIIITT",
                    "TTICITTTTICITT",
                    "TTIIITTTTIIITT",
                    " TTTTTTTTTTTT ",
                    "  TTTTTTTTTT  ",
                    "    TTTTTT    ",
                    "     TTTT     ",
                    "      tt      "])
    h.put(g, 3, 2, ["      IIIIII      ",
                    "     IIIIIIII     ",
                    "     IIIIIIII     ",
                    "     ssssssss     ",
                    "IIIIIIIIIIIIIIIIII"])


def operator(g, h):
    h.garment(g, 'B', 'B')
    h.put(g, 6, 19, ["EEEEEEEEEEEE"])
    h.dots(g, [(8, 17), (14, 16), (16, 20), (10, 20)], 'b')
    h.put(g, 14, 9, ["    BB ", "   BBBB", "  BBBBB", "  BBBBB", " BBBBBB", " BBBBB "])
    h.dots(g, [(15, 10), (16, 10)], 'W')
    h.dots(g, [(7, 9), (8, 9)], 'K')
    h.put(g, 5, 2, ["    bbbbbb    ",
                    "  bbbbbbbbbb  ",
                    " bbbbbbbbbbbb ",
                    " bbbbbbbbbbbb ",
                    " b bb bb bb b "])


def courier(g, h):
    h.garment(g, 'v', 'V', 'v')
    h.hood(g, 'v')
    h.put(g, 3, -3, [" vv            vv ", " vvv          vvv ", " vPvv        vvPv ", " vPPvv      vvPPv ", "  vvvvv    vvvvv  "])
    h.put(g, -2, 14, ["vv   vv", "vvv vvv", "vvvvvvv", "vv vv v", "v  v   "])
    h.put(g, 19, 12, ["vv   vv", "vvv vvv", "vvvvvvv", "v vv vv", "   v  v"])


def writer(g, h):
    h.garment(g, 'w', 'w', 'w')
    h.hood(g, 'w')
    h.dots(g, [(4, 15), (5, 15), (4, 16), (4, 17), (4, 18), (5, 18), (4, 19), (5, 19), (4, 20), (5, 20), (3, 18), (3, 19), (3, 20)], 'w')
    h.put(g, 3, 21, ["ww ww ww ww w"])


def artist(g, h):
    h.garment(g, 'I', 'I', 'I')
    h.put(g, 9, 16, ["WWWWWW", "  WW  ", "WWWWWW", "  WW  "])
    h.put(g, 6, 9, [" OO ", "O  O", "O  O", " OO "])
    h.put(g, 14, 9, [" OO ", "O  O", "O  O", " OO "])
    h.dots(g, [(11, 13), (12, 13), (11, 14), (12, 14)], 'I')
    h.dots(g, [(11, 8), (12, 8)], 'R')
    h.dots(g, [(9, 14), (14, 14)], 'I')
    h.put(g, 4, 3, ["  OO   RR   OO  ",
                    " OYYO RYYR OYYO ",
                    "  OO L RR L OO  ",
                    " llllllllllllll "])


def analyst(g, h):
    for y in range(15, 21):
        for x in range(5, 19):
            if h.cell(g, x, y) in 'GW':
                h.setc(g, x, y, 'E' if y % 2 else 'e')
    h.garment(g, None, None, 'E')
    h.put(g, 5, 5, ["   EEEEEEEE   ",
                    " EEeEEEEEEeEE ",
                    "EEEEEEEEEEEEEE",
                    "eEEEEeEEeEEEEe"])
    h.dots(g, [(5, 12), (6, 12), (17, 12), (18, 12), (6, 13), (17, 13)], 'E')
    h.dots(g, [(4, 18), (4, 19), (3, 20), (3, 21)], 'E')


def guard(g, h):
    h.garment(g, 's', 'S', 's')
    h.hood(g, 's', eyes='R')
    h.put(g, 4, -1, ["S              S", "SS            SS", " SS          SS "])
    h.put(g, -2, 8, ["  s  ", " ss  ", "sss  ", "ssss ", "sssss", "sssss", " sss ", "  s  "])
    h.put(g, 21, 8, ["  s  ", "  ss ", "  sss", " ssss", "sssss", "sssss"])


def janitor(g, h):
    h.garment(g, 'D')
    h.put(g, 8, 15, ["llllllll", "      lL", "      l "])
    h.dots(g, [(6, 12), (16, 13), (8, 19), (15, 18)], 't')
    h.put(g, 3, 1, ["       bbbb       ",
                    "      bbbbbb      ",
                    "     bbbbbbbb     ",
                    "     BBBBBBBB     ",
                    "  bbbbbbbbbbbbbb  ",
                    " b bbbbbbbbbbbb b "])


def pilot(g, h):
    h.garment(g, 'V', 'V', 'v')
    h.put(g, 7, 15, ["IIIIIIIIII"])
    h.put(g, 3, -3, ["          II      ",
                     "         III      ",
                     "        IIII      ",
                     "        IIII      ",
                     "       IIIIII     ",
                     "       IIIIII     ",
                     "      IIIIIIII    ",
                     "      VVVyyVVV    ",
                     "     IIIIIIIIII   ",
                     "IIIIIIIIIIIIIIIIII"])


def helper(g, h):
    h.garment(g, 'O', 'O')
    h.dots(g, [(9, 17), (14, 17), (10, 18), (13, 18)], 'I')
    h.put(g, 9, 19, ["IIIIII"])
    h.put(g, 4, 0, ["       ll       ",
                    "      lLL       ",
                    "    OOOOOOOO    ",
                    "  OOoOOOOOOoOO  ",
                    " OOOoOOOOOOoOOO ",
                    " OOOoOOOOOOoOOO ",
                    "  OOoOOOOOOoOO  "])


OUTFITS = {'lead': lead, 'scout': scout, 'planner': planner, 'builder': builder, 'tester': tester,
           'bugcatcher': bugcatcher, 'reviewer': reviewer, 'researcher': researcher, 'operator': operator,
           'courier': courier, 'writer': writer, 'artist': artist, 'analyst': analyst, 'guard': guard,
           'janitor': janitor, 'pilot': pilot, 'helper': helper}

PROPS = {
    'lead': (-3, 11, ["yRRRy", "yRRRy", "yRRRy", " yyy ", "  y  ", "  y  ", " yyy "], -1),
    'scout': (-3, 11, ["  bb ", " byyb", " yFFy", " yFFy", " yFFy", " bbbb"], -1),
    'planner': (-3, 11, [" CCCC ", "CCWCCC", "CWCCCC", "CCCCCC", " CCCC ", " yyyy ", "yyyyyy"], -1),
    'builder': (-4, 9, ["BBBBBBB", "bBBBBBb", "bBBBBBb", "BBBBBBB", "   bb  ", "   bb  ", "   bb  ", "   bb  "], -3),
    'tester': (-3, 8, ["  Y   ", " YY   ", "  YY  ", "  SS  ", "  SS  ", " SLLS ", "SLLLLS", "SLLLLS", "SSSSSS"], -1),
    'bugcatcher': (-4, 1, [" SSSSSS ", "Sw w w S", "S wVwV S", "Sw VVV S", "S w V wS", "Sw w w S", " SSSSSS "] + ["    B   "] * 10, -2),
    'reviewer': (-4, -3, ["    SSSS", "  SSSSSB", " SSS   B", "SS     B", "S      B"] + ["       B"] * 17, 0),
    'researcher': (-4, 13, ["VVVV VVVV", "VEEEVEEEV", "VEyEVEyEV", "VEEEVEEEV", "VVVVVVVVV"], -1),
    'operator': (-4, 8, ["RRR      ", "RRR      ", " ss      ", "  ss     ", "   ss    ", "    ss   ", "  bbbbbbb", "  bYbbbYb", "  bbbbbbb"], -1),
    'courier': (-3, 8, ["WWWWWWW", "WWSSSWW", "WSWRWSW", "WWWWWWW", "WWWWWWW"], -1),
    'writer': (-3, 7, ["  WW", "  WW", " WWw", " WWw", "WWw ", "WWw ", " w  ", " b  ", " b  ", " I  "], -1),
    'artist': (-4, 8, ["     R ", "     B ", "     B ", "     B ", "       ", " TTTTT ", "TRTTLTT", "TTTTTnT", "TYT  TT", " TTTTT "], -1),
    'analyst': (-4, 10, [" SSSSS ", "SSISISS", "SIISSIS", "SSISIIS", "SISSISS", "SSIISSS", "SSSSSSS"], -1),
    'guard': (-3, 13, [" SSSS ", " S  S ", "YYYYYY", "YYKKYY", "YYKKYY", "YYYYYY"], -1),
    'janitor': (-2, 1, ["  B  ", " BBB "] + ["  B  "] * 14 + [" SSS ", "SSSSS", "SSSSS", " SSS ", "  S  "], 0),
    'pilot': (-4, 20, ["yyy", "yyyyBBBBBBBBBBBBBBBBBBBBBBBB", "yyy"], 0),
    'helper': (-3, 13, [" sss ", "s   s", "OOOOO", "OIOIO", "OOOOO", " OOO "], -1),
}
