import { profileSchema, walletsSchema, type ProfileUpdate, type WalletFields, type WalletSlot, type Wallets } from '@/shared/contracts/account'
import { AuthError, passwordDigest, readAuthDatabase, requireSession, saveAuthDatabase } from './auth'

function profileOf(user: ReturnType<typeof readAuthDatabase>['users'][number]) {
  return profileSchema.parse({ ...user, username: user.username ?? `colecionador-${user.id.slice(0, 8)}` })
}
export function readProfile(request: Request) {
  const session = requireSession(request)
  return profileOf(readAuthDatabase().users.find(user => user.id === session.user.id)!)
}
function assertVersion(version: number, request: Request) {
  const header = request.headers.get('If-Match')
  if (!header || !/^"\d+"$/.test(header)) throw new AuthError(428, 'VERSION_REQUIRED', 'Atualize os dados antes de salvar.')
  if (Number(header.slice(1, -1)) !== version) throw new AuthError(409, 'ACCOUNT_CONFLICT', 'Os dados mudaram em outra operação. Confira as informações atuais e tente novamente.')
}
export async function updateProfile(request: Request, input: ProfileUpdate) {
  const session = requireSession(request)
  const database = readAuthDatabase()
  const user = database.users.find(user => user.id === session.user.id)!
  assertVersion(user.version, request)
  if (database.users.some(candidate => candidate.id !== user.id && candidate.email === input.email)) throw new AuthError(409, 'EMAIL_CONFLICT', 'Este e-mail já está cadastrado.')
  if (database.users.some(candidate => candidate.id !== user.id && profileOf(candidate).username === input.username)) throw new AuthError(409, 'USERNAME_CONFLICT', 'Este nome de usuário já está em uso.')
  let newDigest: string | undefined
  let salt: string | undefined
  if (input.newPassword) {
    if (await passwordDigest(input.currentPassword, user.salt) !== user.digest) throw new AuthError(422, 'PASSWORD_INVALID', 'A senha atual está incorreta.')
    salt = crypto.randomUUID()
    newDigest = await passwordDigest(input.newPassword, salt)
  }
  if (input.avatar && input.avatar !== user.avatar) {
    try {
      const bitmap = await createImageBitmap(await (await fetch(input.avatar)).blob())
      const valid = bitmap.width > 0 && bitmap.height > 0 && bitmap.width <= 1024 && bitmap.height <= 1024
      bitmap.close()
      if (!valid) throw new Error('dimensions')
    } catch { throw new AuthError(422, 'AVATAR_INVALID', 'Use uma imagem válida de até 1024 × 1024 pixels.') }
  }
  // O perfil e a senha são confirmados juntos; falhas não salvam alterações parciais.
  Object.assign(user, { name: input.name, username: input.username, email: input.email, ens: input.ens, walletAlias: input.walletAlias, avatar: input.avatar, version: user.version + 1 })
  if (newDigest && salt) {
    Object.assign(user, { digest: newDigest, salt })
    database.sessions = database.sessions.filter(candidate => candidate.userId !== user.id || request.headers.get('Authorization') === `Bearer ${candidate.token}`)
  }
  // Revalida após operações assíncronas para impedir gravação com sessão expirada.
  requireSession(request)
  saveAuthDatabase(database)
  return profileOf(user)
}
const walletKey = (id: string) => `kurio:wallets:v1:${id}`
export function readWallets(request: Request): Wallets {
  const session = requireSession(request)
  const stored = localStorage.getItem(walletKey(session.user.id))
  if (!stored) return { version: 0, primary: null, secondary: null, secondarySameAsPrimary: false }
  const parsed = walletsSchema.safeParse(JSON.parse(stored))
  if (!parsed.success) throw new AuthError(503, 'WALLET_STORAGE_ERROR', 'As carteiras salvas estão indisponíveis neste navegador.')
  return parsed.data
}
function saveWallets(request: Request, wallets: Wallets) {
  const session = requireSession(request)
  wallets.version += 1
  localStorage.setItem(walletKey(session.user.id), JSON.stringify(walletsSchema.parse(wallets)))
  return wallets
}
export function updateWallet(request: Request, slot: WalletSlot, input: WalletFields) {
  const wallets = readWallets(request)
  assertVersion(wallets.version, request)
  const other = wallets[slot === 'primary' ? 'secondary' : 'primary']
  const normalize = (address: string, network: string) => network === 'solana' ? address : address.toLowerCase()
  if (other && other.network === input.network && normalize(other.address, other.network) === normalize(input.address, input.network)) throw new AuthError(409, 'WALLET_CONFLICT', 'Este endereço já está na outra carteira. Use a opção “Igual à carteira principal”.')
  if (slot === 'secondary' && wallets.secondarySameAsPrimary) throw new AuthError(409, 'WALLET_LINKED', 'Desmarque “Igual à carteira principal” para editar a carteira secundária.')
  wallets[slot] = input
  return saveWallets(request, wallets)
}
export function setWalletPreference(request: Request, same: boolean) {
  const wallets = readWallets(request)
  assertVersion(wallets.version, request)
  if (same && !wallets.primary) throw new AuthError(422, 'PRIMARY_REQUIRED', 'Salve a carteira principal antes de usar esta opção.')
  wallets.secondarySameAsPrimary = same
  return saveWallets(request, wallets)
}
