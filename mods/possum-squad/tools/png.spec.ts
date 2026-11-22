import assert from 'node:assert/strict'
import { test } from 'node:test'
import { crc32, deflateSync } from 'node:zlib'

import { decodePng, encodePng, type Image } from './png.ts'

// A fictional 3 by 2 image whose pixels differ from their neighbours, so every filter changes its bytes.
const IMAGE: Image = {
  width: 3,
  height: 2,
  pixels: new Uint8Array([17, 34, 51, 255, 200, 10, 90, 255, 0, 0, 0, 0, 250, 251, 252, 255, 3, 140, 77, 255, 64, 64, 64, 0]),
}

const FILTERS = [0, 1, 2, 3, 4] as const

// The header's bytes at their fixed places: depth at 24, colour type at 25, interlace at 28.
function withHeader(bytes: Uint8Array, at: number, value: number): Uint8Array {
  const changed = Uint8Array.from(bytes)
  changed[at] = value
  const header = changed.subarray(12, 29)
  new DataView(changed.buffer).setUint32(29, crc32(header))
  return changed
}

function withChunk(type: string, body: Uint8Array): Uint8Array {
  const named = Buffer.concat([Buffer.from(type, 'latin1'), body])
  const out = Buffer.alloc(named.length + 8)
  out.writeUInt32BE(body.length, 0)
  named.copy(out, 4)
  out.writeUInt32BE(crc32(named), named.length + 4)
  return out
}

const SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const header = (width: number, height: number) => {
  const body = Buffer.alloc(13)
  body.writeUInt32BE(width, 0)
  body.writeUInt32BE(height, 4)
  body.set([8, 6, 0, 0, 0], 8)
  return withChunk('IHDR', body)
}
const end = withChunk('IEND', new Uint8Array())

test('every filter type decodes back to the same pixels', () => {
  for (const filter of FILTERS) {
    const decoded = decodePng(encodePng(IMAGE, filter), `filter ${filter}`)
    assert.deepEqual({ ...decoded, pixels: [...decoded.pixels] }, { ...IMAGE, pixels: [...IMAGE.pixels] }, `filter ${filter}`)
  }
})

// The format's own Paeth predictor, written out here apart from the module's, so a wrong predictor shared by the
// module's writer and reader cannot pass by undoing itself.
function paethFiltered(image: Image): Uint8Array {
  const stride = image.width * 4
  const out = Buffer.alloc(image.height * (stride + 1))
  const at = (x: number, y: number) => (x < 0 || y < 0 ? 0 : (image.pixels[y * stride + x] ?? 0))
  for (let y = 0; y < image.height; y++) {
    out[y * (stride + 1)] = 4
    for (let x = 0; x < stride; x++) {
      const [a, b, c] = [at(x - 4, y), at(x, y - 1), at(x - 4, y - 1)]
      const p = a + b - c
      const [pa, pb, pc] = [Math.abs(p - a), Math.abs(p - b), Math.abs(p - c)]
      const predicted = pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      out[y * (stride + 1) + 1 + x] = (at(x, y) - predicted) & 0xff
    }
  }
  return Buffer.concat([SIGNATURE, header(image.width, image.height), withChunk('IDAT', deflateSync(out)), end])
}

test("a PNG filtered by the format's own Paeth predictor decodes to its pixels", () => {
  // The last pixel's neighbours (left 10, up 200, upper left 100) make Paeth pick the upper left.
  const corner: Image = { width: 2, height: 2, pixels: new Uint8Array([100, 100, 100, 100, 200, 200, 200, 200, 10, 10, 10, 10, 77, 77, 77, 77]) }
  for (const image of [IMAGE, corner]) assert.deepEqual([...decodePng(paethFiltered(image), 'paeth.png').pixels], [...image.pixels])
})

test('the specs write different bytes for each filter, so each decoding above is its own', () => {
  const written = FILTERS.map(filter => Buffer.from(encodePng(IMAGE, filter)).toString('hex'))
  assert.equal(new Set(written).size, FILTERS.length)
})

test('a file that is not an 8-bit RGBA, non-interlaced PNG is refused, by name', () => {
  const good = encodePng(IMAGE)
  const refusals: [string, Uint8Array, RegExp][] = [
    ['no signature', good.subarray(1), /not a PNG/],
    ['cut short', good.subarray(0, good.length - 5), /cut short/],
    ['palette colours', withHeader(good, 25, 3), /not 8-bit RGBA/],
    ['16 bits', withHeader(good, 24, 16), /not 8-bit RGBA/],
    ['interlaced', withHeader(good, 28, 1), /interlaced/],
    ['no image data', Buffer.concat([SIGNATURE, header(3, 2), end]), /no image data/],
    ['too little data', Buffer.concat([SIGNATURE, header(3, 2), withChunk('IDAT', deflateSync(Buffer.alloc(4))), end]), /wrong size/],
    ['an unknown filter', Buffer.concat([SIGNATURE, header(1, 1), withChunk('IDAT', deflateSync(Buffer.from([5, 0, 0, 0, 0]))), end]), /unknown filter/],
    ['data that does not inflate', Buffer.concat([SIGNATURE, header(1, 1), withChunk('IDAT', Buffer.from([1, 2, 3])), end]), /does not inflate/],
  ]
  for (const [what, bytes, why] of refusals) {
    assert.throws(() => decodePng(bytes, `fixture-${what}.png`), new RegExp(`fixture-${what}\\.png: .*${why.source}`), what)
  }
  const damaged = Uint8Array.from(good)
  damaged[45] = (damaged[45] ?? 0) ^ 0xff
  assert.throws(() => decodePng(damaged, 'damaged.png'), /damaged\.png: its IDAT chunk is damaged/)
})
