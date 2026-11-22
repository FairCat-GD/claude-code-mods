// A fictional art folder on an 8 by 8 canvas, as data: the specs write it out as PNG and JSON files.
// Two roles, a whole default set and a set that lacks one role.
export const PALETTE: Record<string, string> = { A: '#112233', B: '#ddeeff', C: '#ff8800' }

// Each layer by its path, a row a string of palette keys, `.` for none.
export const LAYERS: Record<string, string[]> = {
  'base.png': ['........', '..AAAA..', '.ABBBBA.', '.ABBBBA.', '..AAAA..', '..A..A..', '..A..A..', '........'],
  'extras/mark.png': ['AB', 'BA'],
  'sets/plain/outfits/cook.png': ['...CC...', '..CCCC..', '........', '........', '........', '........', '........', '........'],
  'sets/plain/props/cook.png': ['........', '........', '........', '.......C', '.......C', '........', '........', '........'],
  'sets/plain/outfits/baker.png': ['........', '........', '........', '........', '..CCCC..', '........', '........', '........'],
  'sets/plain/props/baker.png': ['........', '........', '........', '........', '........', '........', '........', '........'],
  'sets/odd/outfits/cook.png': ['..BBBB..', '........', '........', '........', '........', '........', '........', '........'],
  'sets/odd/props/cook.png': ['........', '........', '........', 'C.......', '........', '........', '........', '........'],
}

const role = (set: string, id: string, costume: string, propWorkDy: number) => ({
  id,
  costume,
  outfit: `sets/${set}/outfits/${id}.png`,
  prop: `sets/${set}/props/${id}.png`,
  propWorkDy,
})

export const MANIFEST = {
  canvas: [8, 8],
  note: 'Words the converter does not carry.',
  eyes: {
    pupilTopRow: [
      [2, 2],
      [5, 2],
    ],
    closedColour: '#DDEEFF',
  },
  bob: { shiftDownRows: [0, 4], by: 1 },
  roleNames: { cook: 'Cook', baker: 'Baker' },
  defaultSet: 'plain',
  sets: {
    plain: { title: 'Plain', roles: [role('plain', 'baker', 'Bread maker', 0), role('plain', 'cook', 'Chef', -1)] },
    odd: { title: 'Odd', roles: [role('odd', 'cook', 'Odd chef', 1)] },
  },
  recipes: {
    rest: { frames: [{ body: 'none' }] },
    wave: {
      frames: [
        { body: 'none', propDy: 0 },
        { body: 'bob', propDy: 'propWorkDy' },
      ],
      note: 'carried nowhere',
    },
    flop: { frames: [{ body: 'flip-vertical rows 1..6, then down 1', eyes: 'closed', marks: 'Splat: two dots; see the script' }] },
    shout: { frames: [{ body: 'none', extra: 'extras/mark.png', prop: 'hidden', marks: { '#112233': [[1, 1]] } }], colour: 'faded: half grey' },
  },
}
