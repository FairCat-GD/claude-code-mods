/// <reference types="node" />
import { readFileSync } from 'node:fs'
import pad from 'left-pad'

import { register } from '../hooks/register.ts'

export type Shout = (word: string) => string
export const shout: Shout = word => pad(`${word.toUpperCase()}!`, 12)
export const reached = [readFileSync, register]
