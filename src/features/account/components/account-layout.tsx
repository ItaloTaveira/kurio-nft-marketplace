import { useState, type PropsWithChildren } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useIsMutating } from '@tanstack/react-query'
import { MarketplaceHeader } from '@/app/components/marketplace-header'
import { useLogout } from '@/features/auth/queries'
import { apiErrorMessage } from '@/shared/api/errors'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'
import { CatalogSearch } from '@/features/catalog/components/catalog-search'
import { defaultCatalogSearch } from '@/shared/contracts/catalog'
import user from '@/shared/assets/figma/account-imgUser.svg'
import location from '@/shared/assets/figma/account-imgLocation.svg'
import shopping from '@/shared/assets/figma/account-imgShopping1.svg'
import heart from '@/shared/assets/figma/account-imgHeart1.svg'
import activity from '@/shared/assets/figma/account-imgActivity.svg'
import download from '@/shared/assets/figma/account-imgDownload.svg'
import danger from '@/shared/assets/figma/account-imgDangerTriangle.svg'
import logoutIcon from '@/shared/assets/figma/account-imgLogout1.svg'
import divider from '@/shared/assets/figma/account-imgLine2.svg'
import './account.css'

export function AccountLayout({ active, children }: PropsWithChildren<{ active: 'profile' | 'wallets' | 'favorites' }>) {
  const logout = useLogout()
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const pending = useIsMutating({ mutationKey: ['account-mutation'] }) + useIsMutating({ mutationKey: ['cart-mutation'] }) + useIsMutating({ mutationKey: ['checkout-mutation'] }) > 0
  return <><MarketplaceHeader marketOnPage={false} onSearch={() => setSearchOpen(true)} searchControl={<Button variant="ghost" asChild><Link to="/" search={defaultCatalogSearch}>← Mercado</Link></Button>} filterControl={<></>} /><main id="conteudo" tabIndex={-1} className="page-container account-layout"><aside className="account-sidebar"><h2>Meu perfil</h2><nav aria-label="Navegação da conta"><Link to="/perfil" aria-current={active === 'profile' ? 'page' : undefined}><span><img src={user} alt="" /></span>Dados do perfil</Link><Link to="/carteiras" aria-current={active === 'wallets' ? 'page' : undefined}><span><img src={location} alt="" /></span>Carteiras</Link><Link to="/favoritos" aria-current={active === 'favorites' ? 'page' : undefined}><span><img src={heart} alt="" /></span>Lista de interesse</Link>{[{ label: 'Atividade', icon: shopping }, { label: 'Ofertas', icon: activity }, { label: 'Arquivos baixados', icon: download }, { label: 'Suporte', icon: danger }].map(item => <span key={item.label} className="account-nav-pending" aria-disabled="true" title="Disponível em uma próxima etapa"><span><img src={item.icon} alt="" /></span>{item.label}</span>)}</nav><div className="account-sidebar-divider"><img src={divider} alt="" /></div><button type="button" className="account-sidebar-logout" disabled={pending || logout.isPending} onClick={() => logout.mutate()}><span><img src={logoutIcon} alt="" /></span>{logout.isPending ? 'Saindo…' : 'Sair'}</button>{logout.isError && <p role="alert" className="account-error px-4">{apiErrorMessage(logout.error)}</p>}</aside><section className="account-content">{children}</section></main><Dialog open={searchOpen} onOpenChange={setSearchOpen} title="Buscar NFTs" description="Pesquise pelo nome da arte ou da coleção."><CatalogSearch autoFocus initialQuery="" onSearch={q => { setSearchOpen(false); void navigate({ to: '/', search: { ...defaultCatalogSearch, q }, hash: 'mercado' }) }} /></Dialog></>
}
export function AccountLoading({ label }: { label: string }) { return <div role="status" aria-label={label} className="account-skeleton"><div className="h-5 w-60 rounded bg-card skeleton-shimmer" /><div className="account-fields-grid">{Array.from({ length: 6 }, (_, index) => <div key={index} aria-hidden="true" className="h-20 rounded bg-card skeleton-shimmer" />)}</div></div> }
export function AccountFailure({ retry }: { retry: () => void }) { return <div role="alert"><p>Não foi possível consultar seus dados. As informações salvas foram preservadas.</p><Button className="mt-5" onClick={retry}>Tentar novamente</Button></div> }
