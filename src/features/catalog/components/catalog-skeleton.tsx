export function CatalogSkeleton() {
  return <div role="status" aria-label="Carregando NFTs" className="catalog-grid">{Array.from({ length: 9 }, (_, index) => <div key={index} aria-hidden="true" className="nft-card"><div className="nft-card-artwork skeleton-shimmer" /><div className="mt-3 h-4 w-4/5 rounded bg-card skeleton-shimmer" /><div className="mt-3 h-4 w-1/2 rounded bg-card skeleton-shimmer" /></div>)}</div>
}
