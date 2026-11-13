import { useState } from 'react'
import { Tabs } from 'radix-ui'
import type { NftDetail } from '@/shared/contracts/nft'
import { networkLabels } from '@/shared/contracts/catalog'
import { Button } from '@/shared/ui/button'

export function NftInformation({ nft }: { nft: NftDetail }) {
  const [visibleReviews, setVisibleReviews] = useState(3)
  return (
    <Tabs.Root defaultValue="details" className="detail-information">
      <Tabs.List aria-label="Informações do NFT" className="detail-info-tabs">
        <Tabs.Trigger value="details">Detalhes do NFT</Tabs.Trigger>
        <Tabs.Trigger value="reviews">Avaliações de colecionadores ({nft.rating.count})</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="details" className="detail-info-content">
        {nft.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        <dl className="mt-3 space-y-3">
          <div><dt>Rede:</dt><dd>Cunhado na {networkLabels[nft.network]} com procedência e metadados armazenados no IPFS.</dd></div>
          <div><dt>Contrato:</dt><dd>{nft.contract} · {nft.standard}</dd></div>
          <div><dt>Direitos autorais:</dt><dd>{nft.royaltyPercent}% nas vendas secundárias para {nft.creator}.</dd></div>
        </dl>
      </Tabs.Content>
      <Tabs.Content value="reviews" className="detail-info-content">
        <h2 className="sr-only">Avaliações de colecionadores</h2>
        <ul className="space-y-5">
          {nft.reviews.slice(0, visibleReviews).map(review => (
            <li key={review.id} className="border-b border-border pb-5">
              <div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold text-foreground">{review.author}</h3><span aria-label={`${review.rating} de 5 estrelas`} className="text-accent">{'★'.repeat(review.rating)}</span></div>
              <time dateTime={review.date} className="text-xs">{new Date(review.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</time>
              <p className="mt-2">{review.text}</p>
            </li>
          ))}
        </ul>
        <p role="status" className="my-4 text-xs">Exibindo {Math.min(visibleReviews, nft.reviews.length)} de {nft.reviews.length} avaliações.</p>
        {visibleReviews < nft.reviews.length && <Button variant="ghost" onClick={() => setVisibleReviews(count => count + 5)}>Mostrar mais avaliações</Button>}
      </Tabs.Content>
    </Tabs.Root>
  )
}
