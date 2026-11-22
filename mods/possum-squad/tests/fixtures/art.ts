import type { Art, Layer } from '../../hooks/sprites/types'

// A fictional art on the real canvas: a box of a body, an outfit with a hat inside the flip and an antenna above
// it, glasses over one pupil, a prop that moves up two on the bob, and one-pixel extras.
const layer = (top: number, ...rows: string[]): Layer => ({ top, rows: rows.map(row => `\n${row.padEnd(32, '.')}`).join('') })

const SIDE = '..........KWWWWWWWWWWK'

export const FIXTURE_ART: Art = {
  canvas: { width: 32, height: 32 },
  palette: { K: '#26262e', W: '#f4f1eb', B: '#2c3a6e', R: '#e24850', r: '#a62c3a', G: '#9a9ca6', S: '#c0c4ce', C: '#7cdcec', Y: '#facc3c' },
  eyes: { pupils: '11 17, 20 17', closed: 'W' },
  bob: { top: 0, bottom: 27, by: 1 },
  base: layer(
    14,
    '..........KKKKKKKKKKKK',
    SIDE,
    SIDE,
    '..........KKWWWWWWWWKK',
    ...Array<string>(9).fill(SIDE),
    '..........KKKKKKKKKKKK',
    '..........KK........KK',
    '..........KK........KK',
  ),
  extras: { sign: layer(8, '..SS'), zzz: layer(6, '.........................C'), alert: layer(4, '..........................Y') },
  recipes: {
    idle: { frames: [{ body: 'none' }] },
    blink: { frames: [{ body: 'none', eyes: 'closed' }] },
    working: {
      frames: [
        { body: 'none', propDy: 0 },
        { body: 'bob', propDy: 'propWorkDy' },
      ],
    },
    'needs-you': { frames: [{ body: 'none', extra: 'sign', prop: 'hidden' }] },
    finished: { frames: [{ body: 'bob', eyes: 'closed', extra: 'zzz' }] },
    stopped: { frames: [{ body: 'none', extra: 'alert', marks: { K: '15 24' } }] },
    failed: { frames: [{ body: { top: 3, bottom: 29, down: 2 }, eyes: 'closed', marks: 'tongue' }] },
  },
  sets: {
    classic: {
      title: 'Fixture',
      roles: {
        scout: {
          costume: 'Map reader',
          outfit: layer(1, '...............r', '', '............RRRRRRRR', '............RRRRRRRR', ...Array<string>(12).fill(''), '...........B'),
          prop: layer(20, '..GG', '..GG', '..GG'),
          propWorkDy: -2,
        },
      },
    },
    odd: { title: 'Odd', roles: {} },
  },
  defaultSet: 'classic',
}
