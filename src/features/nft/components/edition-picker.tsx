import { RadioGroup } from 'radix-ui'
import type { NftEdition } from '@/shared/contracts/nft'
import { navigateRadio } from '@/shared/lib/radio-navigation'
import selectedRing from '@/shared/assets/figma/edition-selected.svg'
import uniqueRing from '@/shared/assets/figma/edition-unique.svg'
import limitedRing from '@/shared/assets/figma/edition-limited.svg'
import openRing from '@/shared/assets/figma/edition-open.svg'

interface EditionPickerProps {
  editions: NftEdition[]
  selectedId?: string
  onSelect: (id: string) => void
}
export function EditionPicker({ editions, selectedId, onSelect }: EditionPickerProps) {
  return (
    <div className="detail-editions">
      <h2 id="edition-label" className="text-[15px] font-bold leading-4">Edição:</h2>
      <RadioGroup.Root aria-labelledby="edition-label" value={selectedId ?? ''} onValueChange={onSelect} className="mt-2 flex flex-wrap gap-3 lg:mt-3 lg:gap-1.5">
        {editions.map(edition => {
          const ring = edition.id === selectedId ? selectedRing : edition.label === '1/1' ? uniqueRing : edition.label === 'ABERTA' ? openRing : limitedRing
          return (
            <RadioGroup.Item key={edition.id} value={edition.id} disabled={edition.remaining === 0} onKeyDown={event => navigateRadio(event, onSelect)} aria-label={`Edição ${edition.label}${edition.remaining === 0 ? ' — esgotada' : ''}`} title={edition.remaining ? `${edition.remaining} disponíveis · até ${edition.maxPerOrder} por pedido` : 'Edição esgotada'} className="edition-option" style={{ backgroundImage: `url("${ring}")` }}>
              {edition.label}
            </RadioGroup.Item>
          )
        })}
      </RadioGroup.Root>
    </div>
  )
}
