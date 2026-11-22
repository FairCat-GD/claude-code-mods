import type { ElementConstructor, RenderElement, SvgProps } from 'claude-code'

import { SPRITE_SCALE } from '../config'
import type { Sprite } from '../sprites'

// A sprite as the app draws it: framed when it moves, so its loop runs and follows reduced motion; else an image.
export function spriteElement(Svg: ElementConstructor<SvgProps>, sprite: Sprite, alt: string): RenderElement {
  const [width, height] = [sprite.width * SPRITE_SCALE, sprite.height * SPRITE_SCALE]
  return sprite.isAnimated ? (
    <Svg source={sprite.source} alt={alt} width={width} height={height} isInteractive />
  ) : (
    <Svg source={sprite.source} alt={alt} width={width} height={height} />
  )
}
