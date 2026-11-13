import { useState } from 'react'
import { RadioGroup } from 'radix-ui'
import type { NftDetail } from '@/shared/contracts/nft'
import { Dialog } from '@/shared/ui/dialog'
import { navigateRadio } from '@/shared/lib/radio-navigation'
import zoomIcon from '@/shared/assets/figma/detail-zoom.svg'

export function NftGallery({ nft }: { nft: NftDetail }) {
  const [selected, setSelected] = useState(Math.min(1, nft.gallery.length - 1))
  const [zoomOpen, setZoomOpen] = useState(false)
  const image = nft.gallery[selected]!
  const thumbnails = (inDialog = false) => (
    <RadioGroup.Root
      aria-label="Imagens do NFT"
      value={image.id}
      onValueChange={id => setSelected(nft.gallery.findIndex(item => item.id === id))}
      className={inDialog ? 'flex justify-center gap-3' : 'detail-thumbnails'}
    >
      {nft.gallery.map((item, index) => (
        <RadioGroup.Item key={item.id} value={item.id} aria-label={`Imagem ${index + 1}`} onKeyDown={event => navigateRadio(event, id => setSelected(nft.gallery.findIndex(entry => entry.id === id)))} className={inDialog ? 'gallery-dialog-thumb' : 'detail-thumbnail'}>
          <img src={item.src} alt="" width="100" height="100" />
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  )
  return (
    <div className="detail-gallery">
      {thumbnails()}
      <button type="button" aria-label={`Ampliar imagem de ${nft.name}`} onClick={() => setZoomOpen(true)} className="detail-main-image">
        <img src={image.src} alt={image.alt} width="404" height="404" fetchPriority="high" />
        <img src={zoomIcon} alt="" className="detail-zoom-icon" />
      </button>
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen} title={nft.name} description={`Imagem ${selected + 1} de ${nft.gallery.length}. Use as miniaturas para mudar a seleção.`} className="inset-auto top-1/2 right-auto left-1/2 max-h-[90dvh] w-[calc(100%_-_32px)] max-w-3xl -translate-1/2 rounded-2xl border">
        <img src={image.src} alt={image.alt} width="700" height="700" className="mx-auto mb-4 max-h-[55dvh] w-auto rounded-2xl object-contain" />
        {thumbnails(true)}
      </Dialog>
    </div>
  )
}
