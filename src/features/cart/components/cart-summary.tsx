import type { FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import type { CartResponse } from '@/shared/contracts/cart'
import type { CatalogSearch } from '@/shared/contracts/catalog'
import { Button } from '@/shared/ui/button'
import { formatEth } from '@/shared/lib/eth'
import type { CartAction } from '../api'

interface SummaryProps { cart: CartResponse; pending: boolean; catalogSearch: CatalogSearch; onAction: (action: CartAction, message: string) => Promise<void> }
export function CartSummary({ cart, pending, catalogSearch, onAction }: SummaryProps) {
  const quote = cart.quote
  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const code = String(new FormData(event.currentTarget).get('coupon') ?? '').trim()
    if (code) void onAction({ type: 'coupon', code, version: cart.version }, 'Cupom aplicado.')
  }
  const amount = (label: string, value: string, negative = false) => pending ? <span aria-hidden="true" className="inline-block h-4 w-24 rounded bg-card skeleton-shimmer" /> : <output aria-label={label}>{negative ? '− ' : ''}{formatEth(value)}</output>
  return (
    <aside className="cart-summary" aria-labelledby="cart-summary-title" aria-busy={pending}>
      <h2 id="cart-summary-title" className="cart-summary-title">Resumo da carteira</h2>
      <form onSubmit={apply} className="cart-coupon-form">
        <label htmlFor="coupon-code" className="mb-2 hidden text-sm font-bold lg:block">Código promocional</label>
        <div className="cart-coupon-input"><input id="coupon-code" name="coupon" key={quote.coupon?.code ?? ''} defaultValue={quote.coupon?.code ?? ''} required maxLength={32} autoComplete="off" placeholder="Digite o código promocional..." aria-label="Código promocional" disabled={pending} /><Button type="submit" disabled={pending}>Aplicar</Button></div>
      </form>
      {quote.coupon && <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-accent"><p>{quote.coupon.code} · {quote.coupon.valid ? `${quote.coupon.percentOff}% de desconto` : quote.coupon.error}</p><button type="button" disabled={pending} onClick={() => void onAction({ type: 'remove-coupon', version: cart.version }, 'Cupom removido.')} className="underline underline-offset-4">Remover cupom</button></div>}
      <dl className="cart-totals">
        <div><dt>Subtotal</dt><dd>{amount('Subtotal', quote.subtotalEth)}</dd></div>
        <div><dt>Desconto do lançamento</dt><dd>{amount('Desconto', quote.discountEth, true)}</dd></div>
        <div><dt>Taxa de rede</dt><dd>{amount('Taxa de rede', quote.networkFeeEth)}<span className="mt-1 block text-right text-xs text-accent">Taxa estimada</span></dd></div>
        <div className="cart-grand-total"><dt>Total</dt><dd>{amount('Total do carrinho', quote.totalEth)}</dd></div>
      </dl>
      {pending && <p role="status" className="text-xs text-muted-foreground">Atualizando valores…</p>}
      {pending || !quote.canCheckout ? <Button disabled aria-describedby="checkout-info" className="cart-checkout">Conectar e finalizar</Button> : <Button asChild aria-describedby="checkout-info" className="cart-checkout"><Link to="/pagamento">Conectar e finalizar</Link></Button>}
      <p id="checkout-info" className="text-xs leading-5 text-muted-foreground">Pagamento e conexão de carteira são simulados. Entrar na conta é necessário.</p>
      <Link to="/" search={catalogSearch} hash="mercado" className="text-center text-sm text-accent">Continuar explorando</Link>
    </aside>
  )
}
