import { Link } from '@tanstack/react-router'
import { useWalletCollection } from '../queries'
import { networkLabels } from '@/shared/contracts/catalog'
import { Button } from '@/shared/ui/button'

export function WalletCollection() {
  const query = useWalletCollection()
  const wallets = new Map<string, { address: string; network: keyof typeof networkLabels; alias: string; items: Map<string, { nftId: string; name: string; image: string; imageAlt: string; editionLabel: string; quantity: number }> }>()
  for (const order of query.data?.orders ?? []) {
    const wallet = order.snapshot.wallet
    const address = wallet.network === 'solana' ? wallet.address : wallet.address.toLowerCase()
    const key = `${wallet.network}:${address}`
    if (!wallets.has(key)) wallets.set(key, { ...wallet, items: new Map() })
    const group = wallets.get(key)!
    for (const item of order.snapshot.items) {
      const itemKey = `${item.nftId}:${item.editionId}`
      const existing = group.items.get(itemKey)
      group.items.set(itemKey, { ...item, quantity: (existing?.quantity ?? 0) + item.quantity })
    }
  }
  return <section id="meus-nfts" className="wallet-collection" aria-labelledby="wallet-collection-title">
    <h2 id="wallet-collection-title">Meus NFTs na carteira</h2>
    <p className="account-help">Compras confirmadas na simulação. Os NFTs ficam vinculados ao endereço e à rede usados na compra.</p>
    {query.isPending && <p role="status">Carregando seus NFTs…</p>}
    {query.isError && <div role="alert"><p>Não foi possível consultar seus NFTs.</p><Button onClick={() => void query.refetch()}>Tentar novamente</Button></div>}
    {query.isSuccess && !wallets.size && <p>Você ainda não possui NFTs de compras confirmadas.</p>}
    {[...wallets].map(([key, wallet]) => <section key={key} className="wallet-collection-group" aria-label={`NFTs em ${wallet.alias} · ${networkLabels[wallet.network]}`}>
      <h3>{wallet.alias} · {networkLabels[wallet.network]}</h3><p className="wallet-collection-address">{wallet.address}</p>
      <ul className="wallet-collection-grid">{[...wallet.items].map(([id, item]) => <li key={id} data-testid="wallet-nft">
        <Link to="/nfts/$nftId" params={{ nftId: item.nftId }} search={{ quantity: 1, returnTo: '/carteiras#meus-nfts' }}><img src={item.image} alt={item.imageAlt} loading="lazy" width="240" height="240" /><h4>{item.name}</h4></Link>
        <p>Edição {item.editionLabel}</p><p>Quantidade: {item.quantity}</p>
      </li>)}</ul>
    </section>)}
  </section>
}
