import { useState, type FormEvent } from 'react'
import searchIcon from '@/shared/assets/figma/mobile-search.svg'

interface CatalogSearchProps { initialQuery: string; onSearch: (query: string) => void; autoFocus?: boolean }
export function CatalogSearch({ initialQuery, onSearch, autoFocus }: CatalogSearchProps) {
  const [query, setQuery] = useState(initialQuery)
  const submit = (event: FormEvent) => { event.preventDefault(); onSearch(query.trim()) }
  return (
    <form role="search" onSubmit={submit} className="flex h-[45px] min-w-0 flex-1 items-center rounded-[10px] bg-card text-secondary">
      <button type="submit" aria-label="Pesquisar NFTs" className="flex h-full w-10 shrink-0 items-center justify-center"><img src={searchIcon} alt="" /></button>
      <input type="search" aria-label="Buscar NFTs" placeholder="Explorar coleções" maxLength={120} value={query} onChange={event => setQuery(event.target.value)} autoFocus={autoFocus} className="h-full min-w-0 flex-1 rounded-r-[10px] bg-transparent pr-2 text-sm font-bold text-foreground placeholder:text-secondary focus-visible:outline-offset-0" />
    </form>
  )
}
