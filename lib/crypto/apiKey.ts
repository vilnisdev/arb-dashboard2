import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET
  if (!secret) throw new Error('API_KEY_ENCRYPTION_SECRET is not set')
  const key = Buffer.from(secret, 'hex')
  if (key.length !== 32) throw new Error('API_KEY_ENCRYPTION_SECRET must be 32 bytes (64 hex chars)')
  return key
}

export function encryptApiKey(plaintext: string): { encrypted: string; iv: string; tag: string } {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  }
}

export function decryptApiKey(row: { encrypted: string; iv: string; tag: string }): string {
  const key = getKey()
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(row.iv, 'hex'))
  decipher.setAuthTag(Buffer.from(row.tag, 'hex'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(row.encrypted, 'hex')),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}
