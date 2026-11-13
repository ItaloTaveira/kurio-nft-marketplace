import { useId, useState } from 'react'
import './quantity-picker.css'
import minusIcon from '@/shared/assets/figma/detail-minus.svg'
import mobileMinus from '@/shared/assets/figma/detail-mobile-minus.svg'
import mobilePlus from '@/shared/assets/figma/detail-mobile-plus.svg'
import plusIcon from '@/shared/assets/figma/detail-plus.svg'

interface QuantityPickerProps { value: number; max: number; disabled: boolean; onChange: (value: number) => void; compact?: boolean }
export function QuantityPicker({ value, max, disabled, onChange, compact = false }: QuantityPickerProps) {
  const errorId = useId()
  const [error, setError] = useState('')
  const change = (next: number) => { setError(''); onChange(next) }
  return (
    <div className={`quantity-picker ${compact ? 'quantity-picker-compact' : ''}`}>
      <div className="flex items-center gap-1">
        <span className="mr-1 text-[15px] text-muted-foreground lg:sr-only">Qtd.</span>
        <button type="button" aria-label="Diminuir quantidade" disabled={disabled || value <= 1} onClick={() => change(value - 1)} className="quantity-button"><span>{!compact && <img src={minusIcon} alt="" className="hidden lg:block" />}<img src={mobileMinus} alt="" className={compact ? undefined : 'lg:hidden'} /></span></button>
        <input
          key={value}
          type="number" inputMode="numeric" step="1" min="1" max={Math.max(1, max)}
          defaultValue={value} disabled={disabled} aria-label="Quantidade"
          aria-invalid={!!error} aria-describedby={error ? errorId : undefined}
          onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur() }}
          onBlur={event => {
            const next = Number(event.currentTarget.value)
            if (!Number.isInteger(next) || next < 1 || next > max) {
              event.currentTarget.value = String(value)
              setError(`Escolha de 1 a ${max} unidades.`)
              return
            }
            change(next)
          }}
          className="quantity-input"
        />
        <button type="button" aria-label="Aumentar quantidade" title={`Limite de ${max} por pedido`} disabled={disabled || value >= max} onClick={() => change(value + 1)} className="quantity-button"><span>{!compact && <img src={plusIcon} alt="" className="hidden lg:block" />}<img src={mobilePlus} alt="" className={compact ? undefined : 'lg:hidden'} /></span></button>
      </div>
      {error && <p id={errorId} role="alert" className="mt-1 max-w-48 text-xs text-accent">{error}</p>}
    </div>
  )
}
