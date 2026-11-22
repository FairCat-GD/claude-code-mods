import { argv } from 'node:process'

export const shout = (word: string) => `${word.toUpperCase()}!`

if (import.meta.main) console.log(shout(argv[2] ?? 'quiet'))
