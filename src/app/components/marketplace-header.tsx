import { AccountControl } from '@/features/auth/components/account-control'
import type { ComponentProps } from 'react'
import { SiteHeader } from '@/shared/components/site-header'
import { CartLink } from '@/features/cart/components/cart-link'

export function MarketplaceHeader(props: ComponentProps<typeof SiteHeader>) {
  return <SiteHeader {...props} cartControl={<CartLink />} accountControl={<AccountControl />} />
}
