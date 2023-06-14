import { randomUUID } from 'node:crypto'
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.crypto.randomUUID = randomUUID