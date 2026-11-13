import type { Nft } from '@/shared/contracts/catalog'
import { collections, networkIds } from '@/shared/contracts/catalog'
import emerald from '@/shared/assets/figma/catalog-emerald.webp'
import nomad from '@/shared/assets/figma/catalog-nomad.webp'
import vessel from '@/shared/assets/figma/catalog-vessel.webp'
import golden from '@/shared/assets/figma/catalog-golden.webp'

const artworks = [
  ['emerald-ape-042', 'Emerald Ape #042', '1.19', emerald, 'Macaco com óculos e jaqueta verde'],
  ['sage-nomad-009', 'Sage Nomad #009', '1.69', nomad, 'Macaco com chapéu verde e moletom lilás'],
  ['neon-vessel-552', 'Neon Vessel #552', '1.99', vessel, 'Macaco de terno claro e gola preta'],
  ['cosmic-bloom-118', 'Cosmic Bloom #118', '1.29', nomad, 'Macaco com chapéu verde e moletom lilás'],
  ['violet-nomad-314', 'Violet Nomad #314', '1.39', nomad, 'Macaco com chapéu verde e moletom lilás'],
  ['ivory-baron-088', 'Ivory Baron #088', '1.79', vessel, 'Macaco de terno claro e gola preta'],
  ['golden-beat-207', 'Golden Beat #207', '0.99', golden, 'Macaco dourado com fones de ouvido verdes'],
  ['golden-echo-208', 'Golden Echo #208', '0.79', golden, 'Macaco dourado com fones de ouvido verdes'],
  ['golden-signal-160', 'Golden Signal #160', '0.39', golden, 'Macaco dourado com fones de ouvido verdes'],
] as const

// Datas fixas e ordem estável: a demonstração não depende do relógio do computador.
export const catalogFixtures: Nft[] = Array.from({ length: 36 }, (_, index) => {
  const [id, name, priceEth, image, imageAlt] = artworks[index % artworks.length]!
  const edition = Math.floor(index / artworks.length)
  return {
    id: edition ? `${id}-series-${edition + 1}` : id,
    name: edition ? `${name} · Série ${edition + 1}` : name,
    priceEth, image, imageAlt,
    previousPriceEth: index === 2 ? '2.29' : undefined,
    collection: collections[index % collections.length]!.id,
    network: networkIds[(index + edition) % networkIds.length]!,
    listedAt: new Date(Date.UTC(2026, 10, 1) - index * 86_400_000).toISOString(),
    popularity: 100 - (index * 7) % 100,
    isNew: index < 18,
    imageLayout: index % artworks.length === 3 ? 'portrait' : 'square',
  }
})
