import Decimal from 'decimal.js'
import type { Nft } from '@/shared/contracts/catalog'
import { networkLabels } from '@/shared/contracts/catalog'
import type { NftDetail } from '@/shared/contracts/nft'
import { catalogFixtures } from './catalog'
import detailEmerald from '@/shared/assets/figma/detail-emerald.webp'

const preferredRelated = ['cosmic-bloom-118', 'violet-nomad-314', 'ivory-baron-088', 'golden-beat-207', 'golden-signal-160']
const reviewTexts = [
  'Arte muito bem trabalhada, com cores e detalhes que valorizam a coleção.',
  'Gostei da identidade visual e da apresentação da obra. Uma ótima adição à coleção.',
  'Os atributos e a história da peça tornam o colecionável especial.',
]

export function makeNftDetail(nft: Nft): NftDetail {
  const network = networkLabels[nft.network]
  const tokenId = `#${(nft.name.match(/#(\d+)/)?.[1] ?? '1').padStart(4, '0')}`
  const reviews = Array.from({ length: 19 }, (_, index) => ({
    id: `${nft.id}-review-${index + 1}`,
    author: `Colecionador ${String(index + 1).padStart(2, '0')}`,
    rating: index < 15 ? 5 : 4,
    date: new Date(Date.UTC(2026, 9, 20) - index * 86_400_000).toISOString(),
    text: reviewTexts[index % reviewTexts.length]!,
  }))
  const related = [...catalogFixtures].filter(item => item.id !== nft.id).sort((a, b) => {
    const index = (id: string) => preferredRelated.includes(id) ? preferredRelated.indexOf(id) : 100
    return index(a.id) - index(b.id)
  }).slice(0, 5)
  return {
    ...nft, tokenId, collectionName: 'Kurio Apes', creator: 'Nova Sato',
    description: `Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na ${network}, com arte desbloqueável e acesso para colecionadores.`,
    mobileDescription: `Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na ${network}.`,
    paragraphs: [
      `${nft.name} é uma obra digital finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na ${network}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.',
    ],
    attributes: nft.id.startsWith('emerald-ape') ? ['Óculos', 'Esmeralda', 'Raro'] : ['Kurio Editions', 'Arte digital', 'Colecionável'],
    contract: '0x7A42…19E8', standard: nft.network === 'solana' ? 'Metaplex' : 'ERC-721', royaltyPercent: '5',
    // O frame original repete a mesma arte nas quatro miniaturas.
    gallery: Array.from({ length: 4 }, (_, index) => ({
      id: `image-${index + 1}`,
      src: nft.id === 'emerald-ape-042' ? detailEmerald : nft.image,
      alt: `${nft.imageAlt} — imagem ${index + 1}`,
    })),
    defaultEditionId: 'limited-50',
    editions: [
      { id: 'unique', label: '1/1', priceEth: new Decimal(nft.priceEth).mul(3).toFixed(2), remaining: 0, maxPerOrder: 1 },
      { id: 'limited-10', label: '1/10', priceEth: new Decimal(nft.priceEth).mul('1.5').toFixed(2), remaining: 2, maxPerOrder: 2 },
      { id: 'limited-50', label: '1/50', priceEth: nft.priceEth, remaining: 6, maxPerOrder: 3 },
      { id: 'open', label: 'ABERTA', priceEth: new Decimal(nft.priceEth).mul('0.8').toFixed(2), remaining: 20, maxPerOrder: 5 },
    ],
    reviews,
    rating: { value: Number(new Decimal(reviews.reduce((total, review) => total + review.rating, 0)).div(reviews.length).toFixed(1)), count: reviews.length },
    related,
  }
}
