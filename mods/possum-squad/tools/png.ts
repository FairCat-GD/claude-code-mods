import { crc32, deflateSync, inflateSync } from 'node:zlib'

// RGBA, 8 bits a channel, row by row.
export type Image = { width: number; height: number; pixels: Uint8Array }

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const RGBA = 6
const CHANNELS = 4

function paeth(left: number, up: number, upLeft: number): number {
  const estimate = left + up - upLeft
  const toLeft = Math.abs(estimate - left)
  const toUp = Math.abs(estimate - up)
  const toUpLeft = Math.abs(estimate - upLeft)
  if (toLeft <= toUp && toLeft <= toUpLeft) return left
  return toUp <= toUpLeft ? up : upLeft
}

// The art's layers are 8-bit RGBA and not interlaced; anything else is refused rather than guessed at.
export function decodePng(bytes: Uint8Array, name: string): Image {
  const refuse = (why: string): never => {
    throw new Error(`${name}: ${why}`)
  }
  if (bytes.length < SIGNATURE.length || SIGNATURE.some((byte, at) => bytes[at] !== byte)) refuse('not a PNG')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let at = SIGNATURE.length
  let header: { width: number; height: number } | undefined
  let ended = false
  const data: Uint8Array[] = []
  while (!ended) {
    if (at + 12 > bytes.length) refuse('cut short')
    const length = view.getUint32(at)
    if (at + 12 + length > bytes.length) refuse('cut short')
    const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8))
    const body = bytes.subarray(at + 8, at + 8 + length)
    if (crc32(bytes.subarray(at + 4, at + 8 + length)) !== view.getUint32(at + 8 + length)) refuse(`its ${type} chunk is damaged`)
    if (header === undefined && type !== 'IHDR') refuse('does not start with its header')
    if (type === 'IHDR') {
      const [depth, colour, compression, filter, interlace] = body.subarray(8, 13)
      if (depth !== 8 || colour !== RGBA) refuse('is not 8-bit RGBA')
      if (compression !== 0 || filter !== 0) refuse('uses an unknown compression or filter method')
      if (interlace !== 0) refuse('is interlaced')
      header = { width: view.getUint32(at + 8), height: view.getUint32(at + 12) }
    }
    if (type === 'IDAT') data.push(body)
    if (type === 'IEND') ended = true
    at += 12 + length
  }
  if (header === undefined || data.length === 0) refuse('holds no image data')
  const { width, height } = header as { width: number; height: number }
  const stride = width * CHANNELS
  let packed: Uint8Array
  try {
    packed = inflateSync(Buffer.concat(data))
  } catch {
    return refuse('its image data does not inflate')
  }
  if (packed.length !== height * (stride + 1)) refuse('its image data is the wrong size')
  const pixels = new Uint8Array(height * stride)
  for (let y = 0; y < height; y++) {
    const filter = packed[y * (stride + 1)]
    const line = packed.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    for (let x = 0; x < stride; x++) {
      const left = x >= CHANNELS ? (pixels[y * stride + x - CHANNELS] ?? 0) : 0
      const up = y > 0 ? (pixels[(y - 1) * stride + x] ?? 0) : 0
      const upLeft = x >= CHANNELS && y > 0 ? (pixels[(y - 1) * stride + x - CHANNELS] ?? 0) : 0
      const raw = line[x] ?? 0
      let value: number
      if (filter === 0) value = raw
      else if (filter === 1) value = raw + left
      else if (filter === 2) value = raw + up
      else if (filter === 3) value = raw + ((left + up) >> 1)
      else if (filter === 4) value = raw + paeth(left, up, upLeft)
      else return refuse(`row ${y} has an unknown filter`)
      pixels[y * stride + x] = value & 0xff
    }
  }
  return { width, height, pixels }
}

const chunk = (type: string, body: Uint8Array) => {
  const named = Buffer.concat([Buffer.from(type, 'latin1'), body])
  const out = Buffer.alloc(named.length + 8)
  out.writeUInt32BE(body.length, 0)
  named.copy(out, 4)
  out.writeUInt32BE(crc32(named), named.length + 4)
  return out
}

// Writes an 8-bit RGBA PNG, every row with the one filter given: the specs write their fictional art with it.
export function encodePng(image: Image, filter: 0 | 1 | 2 | 3 | 4 = 0): Uint8Array {
  const { width, height, pixels } = image
  const stride = width * CHANNELS
  const packed = Buffer.alloc(height * (stride + 1))
  for (let y = 0; y < height; y++) {
    packed[y * (stride + 1)] = filter
    for (let x = 0; x < stride; x++) {
      const raw = pixels[y * stride + x] ?? 0
      const left = x >= CHANNELS ? (pixels[y * stride + x - CHANNELS] ?? 0) : 0
      const up = y > 0 ? (pixels[(y - 1) * stride + x] ?? 0) : 0
      const upLeft = x >= CHANNELS && y > 0 ? (pixels[(y - 1) * stride + x - CHANNELS] ?? 0) : 0
      const predicted = [0, left, up, (left + up) >> 1, paeth(left, up, upLeft)][filter] ?? 0
      packed[y * (stride + 1) + 1 + x] = (raw - predicted) & 0xff
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header.set([8, RGBA, 0, 0, 0], 8)
  return Buffer.concat([Buffer.from(SIGNATURE), chunk('IHDR', header), chunk('IDAT', deflateSync(packed)), chunk('IEND', new Uint8Array())])
}
