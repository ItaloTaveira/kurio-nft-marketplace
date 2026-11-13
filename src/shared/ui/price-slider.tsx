import { Slider } from 'radix-ui'
import thumb from '@/shared/assets/figma/slider-thumb.svg'
import track from '@/shared/assets/figma/slider-track.svg'
import active from '@/shared/assets/figma/slider-active.svg'

interface PriceSliderProps { value: number[]; onValueChange: (value: number[]) => void }
// Inteiros representam centésimos de ETH apenas no controle; o contrato usa strings.
export function PriceSlider({ value, onValueChange }: PriceSliderProps) {
  return (
    <Slider.Root min={2} max={1230} step={1} minStepsBetweenThumbs={0} value={value} onValueChange={onValueChange} className="relative flex h-8 w-full touch-none items-center select-none">
      <Slider.Track className="relative h-1 grow rounded-full" style={{ backgroundImage: `url("${track}")`, backgroundSize: '100% 100%' }}>
        <Slider.Range className="absolute h-full" style={{ backgroundImage: `url("${active}")`, backgroundSize: '100% 100%' }} />
      </Slider.Track>
      {['Preço mínimo', 'Preço máximo'].map(label => <Slider.Thumb key={label} aria-label={label} className="relative block size-[15px] rounded-full"><img src={thumb} alt="" className="absolute top-1/2 left-1/2 max-w-none -translate-1/2" /></Slider.Thumb>)}
    </Slider.Root>
  )
}
