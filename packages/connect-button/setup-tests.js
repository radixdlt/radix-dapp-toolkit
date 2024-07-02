import { randomUUID } from 'node:crypto'

global.crypto.randomUUID = randomUUID
