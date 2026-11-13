import { z } from 'zod'

const email = z.string().trim().toLowerCase().email('Informe um e-mail válido.').max(254)
const password = z.string().min(8, 'Use pelo menos 8 caracteres.').max(128, 'Use até 128 caracteres.')
export const loginSchema = z.object({ email, password: z.string().min(1, 'Informe sua senha.').max(128) })
export const registerSchema = z.object({ name: z.string().trim().min(2, 'Use pelo menos 2 caracteres.').max(40, 'Use até 40 caracteres.'), email, password, confirmPassword: z.string() }).refine(value => value.password === value.confirmPassword, { path: ['confirmPassword'], message: 'As senhas precisam ser iguais.' })
export const userSchema = z.object({ id: z.string(), name: z.string(), email: z.string().email() })
export const sessionSchema = z.object({ user: userSchema, expiresAt: z.string().datetime() })
export const authResponseSchema = sessionSchema.extend({ token: z.string().min(1) })
export type Session = z.infer<typeof sessionSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
// Destinos conhecidos: sem domínios externos, barras duplas ou caminhos de conta.
export function safeAuthReturn(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2000 || (value.includes('\\') || Array.from(value).some(character => character.charCodeAt(0) <= 32))) return '/'
  try {
    const url = new URL(value, 'https://kurio.local')
    if (!value.startsWith('/') || url.origin !== 'https://kurio.local') return '/'
    return /^(\/|\/carrinho|\/perfil|\/carteiras|\/favoritos|\/pagamento|\/pedidos\/[a-zA-Z0-9-]{1,80}|\/nfts\/[a-z0-9-]+)$/.test(url.pathname) ? `${url.pathname}${url.search}${url.hash}` : '/'
  } catch { return '/' }
}
export const authSearchSchema = z.object({ returnTo: z.unknown().transform(safeAuthReturn).default('/'), expired: z.coerce.boolean().optional().catch(undefined) })

export function authFormSchema(register: boolean) {
  return z.object({ name: register ? registerSchema.shape.name : z.string(), email, password: register ? password : loginSchema.shape.password, confirmPassword: z.string() }).refine(value => !register || value.password === value.confirmPassword, { path: ['confirmPassword'], message: 'As senhas precisam ser iguais.' })
}

export const isPrivatePath = (pathname: string) => ['/perfil', '/carteiras', '/favoritos', '/pagamento'].includes(pathname) || /^\/pedidos\/[a-zA-Z0-9-]{1,80}$/.test(pathname)
