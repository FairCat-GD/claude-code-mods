import { readFileSync } from 'node:fs'

import { shout } from '../tools/shout.ts'

export const register = () => [readFileSync, shout]
