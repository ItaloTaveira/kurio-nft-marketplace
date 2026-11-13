import { apiErrorMessage } from '@/shared/api/errors'
import { Link } from '@tanstack/react-router'
import { AccountLayout, AccountFailure, AccountLoading } from '@/features/account/components/account-layout'
import { useFavorites, useFavoriteError } from '@/features/favorites/queries'
import { NftCard } from '@/features/catalog/components/nft-card'
import { defaultCatalogSearch } from '@/shared/contracts/catalog'
import '@/features/catalog/components/catalog.css'
export function FavoritesPage() {
  const query = useFavorites()
  const error = useFavoriteError()
  return <AccountLayout active="favorites"><h1>Lista de interesse</h1>{error && <p role="alert" className="account-error">{apiErrorMessage(error)}</p>}{query.isPending && <AccountLoading label="Carregando favoritos" />}{query.isError && <AccountFailure retry={() => void query.refetch()} />}{query.data && (query.data.items.length ? <div className="favorites-grid">{query.data.items.map(nft => <NftCard key={nft.id} nft={nft} />)}</div> : <p>Você ainda não salvou NFTs. <Link to="/" search={defaultCatalogSearch} hash="mercado" className="text-accent underline">Explorar mercado</Link></p>)}</AccountLayout>
}
