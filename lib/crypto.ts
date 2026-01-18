import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-cbc'
// Use a fixed key from env or generate a deterministic one for MVP (hash of secret)
// In prod, use a proper 32-byte hex key in env var.
const SECRET_KEY = process.env.AUTH_SECRET ?
    Buffer.from(process.env.AUTH_SECRET).subarray(0, 32) :
    randomBytes(32);

// Pad key if too short
const KEY = Buffer.concat([SECRET_KEY, Buffer.alloc(32)], 32);

export function encrypt(text: string): string {
    const iv = randomBytes(16)
    const cipher = createCipheriv(ALGORITHM, KEY, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return `${iv.toString('hex')}:${encrypted}`
}

export function decrypt(text: string): string {
    const [ivHex, encryptedHex] = text.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = createDecipheriv(ALGORITHM, KEY, iv)
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
}
