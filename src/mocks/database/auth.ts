import { avatarSchema, ensSchema } from '@/shared/contracts/account'
import { z } from 'zod'
import { userSchema, type LoginInput, type RegisterInput } from '@/shared/contracts/auth'
import { mergeGuestCart } from './cart'

export const authStorageKey = 'kurio:auth:v1'
const databaseSchema = z.object({ users: z.array(userSchema.extend({ salt: z.string(), digest: z.string(), username: z.string().optional(), ens: ensSchema.default(''), walletAlias: z.string().default(''), avatar: avatarSchema.default(null), version: z.number().int().nonnegative().default(0) })), sessions: z.array(z.object({ token: z.string(), userId: z.string(), expiresAt: z.string().datetime() })) })
type Database = z.infer<typeof databaseSchema>
export class AuthError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code }
}
export function readAuthDatabase(): Database {
  const stored = localStorage.getItem(authStorageKey)
  if (!stored) return { users: [], sessions: [] }
  const parsed = databaseSchema.safeParse(JSON.parse(stored))
  if (!parsed.success) throw new AuthError(503, 'AUTH_STORAGE_ERROR', 'Os dados de conta estão indisponíveis neste navegador.')
  return parsed.data
}
export function saveAuthDatabase(database: Database) { localStorage.setItem(authStorageKey, JSON.stringify(database)) }
export async function passwordDigest(password: string, salt: string) {
  const encoder = new TextEncoder()
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const value = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' }, material, 256)
  return Array.from(new Uint8Array(value), value => value.toString(16).padStart(2, '0')).join('')
}
export function resolveSession(request: Request) {
  const header = request.headers.get('Authorization')
  if (!header) return null
  const database = readAuthDatabase()
  const session = database.sessions.find(session => header === `Bearer ${session.token}`)
  const user = session && database.users.find(user => user.id === session.userId)
  if (!session || !user || Date.parse(session.expiresAt) <= Date.now() || localStorage.getItem('kurio:auth-scenario') === 'expired') throw new AuthError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar.')
  return { user: userSchema.parse(user), expiresAt: session.expiresAt }
}
export function cartOwner(request: Request) { return resolveSession(request)?.user.id ?? 'guest' }
export async function authenticate(input: LoginInput | RegisterInput, register: boolean) {
  const database = readAuthDatabase()
  let user = database.users.find(user => user.email === input.email)
  if (register) {
    if (user) throw new AuthError(409, 'EMAIL_CONFLICT', 'Este e-mail já está cadastrado. Entre na sua conta.')
    const salt = crypto.randomUUID()
    user = { id: crypto.randomUUID(), name: (input as RegisterInput).name, email: input.email, salt, digest: await passwordDigest(input.password, salt), ens: '', walletAlias: '', avatar: null, version: 0 }
    database.users.push(user)
  } else if (!user || await passwordDigest(input.password, user.salt) !== user.digest) {
    throw new AuthError(422, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
  }
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  // Persistir a conta antes do carrinho torna falhas parciais recuperáveis por login.
  saveAuthDatabase(database)
  mergeGuestCart(user!.id)
  database.sessions = database.sessions.filter(session => Date.parse(session.expiresAt) > Date.now())
  database.sessions.push({ token, userId: user!.id, expiresAt })
  saveAuthDatabase(database)
  return { token, user: userSchema.parse(user), expiresAt }
}
export function logout(request: Request) {
  const database = readAuthDatabase()
  database.sessions = database.sessions.filter(session => request.headers.get('Authorization') !== `Bearer ${session.token}`)
  saveAuthDatabase(database)
}

export function requireSession(request: Request) {
  const session = resolveSession(request)
  if (!session) throw new AuthError(401, 'AUTH_REQUIRED', 'Entre na sua conta para continuar.')
  return session
}
