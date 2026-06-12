/**
 * Criptografia client-side para sessão Master (Web Crypto API).
 * Usado em sessionStorage para não persistir dados em claro.
 * Sessão vale apenas na aba atual; nova aba = login obrigatório.
 */

const MASTER_SESSION_KEY = "masterAuthEncrypted"
const SALT = "aquiresolve-master-session-v1"
const ITERATIONS = 100_000
const KEY_LENGTH = 256
const IV_LENGTH = 12
const TAG_LENGTH = 128

function getSecret(): string {
  if (typeof window === "undefined") return ""
  return (
    process.env.NEXT_PUBLIC_MASTER_SESSION_SECRET ||
    "aquiresolve-master-fallback-change-in-production"
  )
}

async function deriveKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const base = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  )
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(SALT),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    base,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  )
}

function b64Encode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function b64Decode(s: string): Uint8Array {
  return new Uint8Array(
    atob(s)
      .split("")
      .map((c) => c.charCodeAt(0))
  )
}

export interface MasterSessionPayload {
  userId: string
  email: string
  nome: string
  permissoes: Record<string, boolean>
  loggedAt: number
}

export const clientSessionEncryption = {
  storageKey: MASTER_SESSION_KEY,

  async encrypt(payload: MasterSessionPayload): Promise<string> {
    const key = await deriveKey(getSecret())
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
    const enc = new TextEncoder()
    const plain = enc.encode(JSON.stringify(payload))

    const cipher = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
        tagLength: TAG_LENGTH,
      },
      key,
      plain
    )

    const combined = new Uint8Array(iv.length + cipher.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(cipher), iv.length)
    return b64Encode(combined.buffer)
  },

  async decrypt(encrypted: string): Promise<MasterSessionPayload | null> {
    try {
      const raw = b64Decode(encrypted)
      if (raw.length < IV_LENGTH) return null

      const iv = raw.slice(0, IV_LENGTH)
      const cipher = raw.slice(IV_LENGTH)

      const key = await deriveKey(getSecret())
      const dec = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv,
          tagLength: TAG_LENGTH,
        },
        key,
        cipher
      )

      const json = new TextDecoder().decode(dec)
      const data = JSON.parse(json) as MasterSessionPayload
      if (!data?.userId || !data?.email || !data?.permissoes) return null
      return data
    } catch {
      return null
    }
  },

  save(payload: MasterSessionPayload): Promise<void> {
    return this.encrypt(payload).then((s) => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(MASTER_SESSION_KEY, s)
      }
    })
  },

  load(): Promise<MasterSessionPayload | null> {
    if (typeof window === "undefined") return Promise.resolve(null)
    const s = sessionStorage.getItem(MASTER_SESSION_KEY)
    if (!s) return Promise.resolve(null)
    return this.decrypt(s)
  },

  clear(): void {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(MASTER_SESSION_KEY)
    }
  },
}
