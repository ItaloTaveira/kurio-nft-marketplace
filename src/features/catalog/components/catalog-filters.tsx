import { useId, useState, type FormEvent } from 'react'
import Decimal from 'decimal.js'
import { Button } from '@/shared/ui/button'
import { PriceSlider } from '@/shared/ui/price-slider'
import { collections, ethSchema, networkIds, networkLabels, type CatalogResponse, type CatalogSearch } from '@/shared/contracts/catalog'

type FiltersProps = { search: CatalogSearch; facets?: CatalogResponse['facets']; onChange: (patch: Partial<CatalogSearch>) => void; onReset: () => void }
function PriceFilter({ search, onChange }: Pick<FiltersProps, 'search' | 'onChange'>) {
  const errorId = useId()
  const [min, setMin] = useState(search.minPrice ?? '0.02')
  const [max, setMax] = useState(search.maxPrice ?? '12.30')
  const [error, setError] = useState('')
  const parse = (value: string) => value.trim().replace(',', '.')
  const valid = ethSchema.safeParse(parse(min)).success && ethSchema.safeParse(parse(max)).success
  const minimum = valid ? Decimal.min(1230, Decimal.max(2, new Decimal(parse(min)).mul(100))).toNumber() : 2
  const maximum = valid ? Decimal.min(1230, Decimal.max(minimum, new Decimal(parse(max)).mul(100))).toNumber() : 1230
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!valid || new Decimal(parse(min)).gt(parse(max))) {
      setError('Informe preços válidos, com mínimo menor ou igual ao máximo.')
      return
    }
    setError('')
    onChange({ minPrice: parse(min), maxPrice: parse(max) })
  }
  return (
    <form onSubmit={submit} aria-label="Faixa de preço" className="mt-3 pl-3">
      <PriceSlider value={[minimum, maximum]} onValueChange={values => { setMin(new Decimal(values[0]!).div(100).toFixed(2)); setMax(new Decimal(values[1]!).div(100).toFixed(2)); setError('') }} />
      <div className="my-3 flex flex-wrap items-center gap-1 text-[15px]">
        <span>Preço:</span>
        <input aria-label="Preço mínimo em ETH" aria-invalid={!!error} aria-describedby={error ? errorId : undefined} inputMode="decimal" value={min} onChange={event => setMin(event.target.value)} className="w-[5ch] min-w-0 border-b border-border bg-transparent" />
        <span>–</span>
        <input aria-label="Preço máximo em ETH" aria-invalid={!!error} aria-describedby={error ? errorId : undefined} inputMode="decimal" value={max} onChange={event => setMax(event.target.value)} className="w-[5ch] min-w-0 border-b border-border bg-transparent" />
        <span>ETH</span>
      </div>
      {error && <p id={errorId} role="alert" className="mb-3 text-xs leading-5 text-accent">{error}</p>}
      <Button type="submit" className="h-9 px-3 text-base font-bold">Aplicar</Button>
    </form>
  )
}
export function CatalogFilters({ search, facets, onChange, onReset }: FiltersProps) {
  return (
    <div className="catalog-filters space-y-10 bg-card p-5">
      <fieldset>
        <legend className="text-lg font-bold leading-4">Coleções</legend>
        <div className="mt-3 pl-3">
          {collections.map(item => <label key={item.id} className="filter-option"><input type="checkbox" checked={search.collections.includes(item.id)} onChange={event => onChange({ collections: event.target.checked ? [...search.collections, item.id] : search.collections.filter(value => value !== item.id) })} /><span>{item.label}</span><span aria-hidden="true" className="ml-auto">{facets ? `(${facets.collections[item.id] ?? 0})` : '…'}</span></label>)}
        </div>
      </fieldset>
      <div><h3 className="text-lg font-bold leading-4">Faixa de preço</h3><PriceFilter key={`${search.minPrice}-${search.maxPrice}`} search={search} onChange={onChange} /></div>
      <fieldset>
        <legend className="text-lg font-bold leading-4">Rede</legend>
        <div className="mt-3 pl-3">{networkIds.map(id => <label key={id} className="filter-option"><input type="checkbox" checked={search.networks.includes(id)} onChange={event => onChange({ networks: event.target.checked ? [...search.networks, id] : search.networks.filter(value => value !== id) })} /><span>{networkLabels[id]}</span><span aria-hidden="true" className="ml-auto">{facets ? `(${facets.networks[id] ?? 0})` : '…'}</span></label>)}</div>
      </fieldset>
      <Button variant="ghost" onClick={onReset} className="h-auto p-0 text-sm text-accent underline underline-offset-4">Limpar filtros</Button>
    </div>
  )
}
