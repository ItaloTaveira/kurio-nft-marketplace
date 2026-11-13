import { useState } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { useSessionToken } from '@/shared/api/session-token'
import { apiErrorMessage } from '@/shared/api/errors'
import { useFavoriteCommands, useFavorites } from './queries'
export function FavoriteButton({ id, name, icon, className = '', text = false }: { id: string; name: string; icon: string; className?: string; text?: boolean }) {
  const token = useSessionToken()
  const favorites = useFavorites()
  const commands = useFavoriteCommands()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const saved = favorites.data?.ids.includes(id) ?? false
  const toggle = async () => {
    if (!token) { await navigate({ to: '/entrar', search: { returnTo: `${location.pathname}${location.searchStr}` } }); return }
    if (favorites.isError) { void favorites.refetch(); return }
    setError('')
    try { await commands.mutateAsync(id, !saved) } catch (error) { setError(apiErrorMessage(error)) }
  }
  return <><button type="button" className={className} disabled={!!token && (favorites.pending || favorites.isPending)} aria-label={`${saved ? 'Remover' : 'Adicionar'} ${name} ${saved ? 'dos' : 'aos'} favoritos`} aria-pressed={saved} title={favorites.isError ? 'Tentar consultar favoritos novamente' : saved ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} onClick={() => void toggle()}><img src={icon} alt="" />{text && <span>{saved ? 'Salvo' : 'Favoritar'}</span>}{saved && <span className="favorite-saved" aria-hidden="true">✓</span>}</button>{error && <span role="alert" className="favorite-error">{error}</span>}</>
}
