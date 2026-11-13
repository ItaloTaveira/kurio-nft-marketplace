import { useRef, type PropsWithChildren } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface DialogProps extends PropsWithChildren {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  className?: string
}
export function Dialog({ open, onOpenChange, title, description, children, className }: DialogProps) {
  const returnFocus = useRef<HTMLElement | null>(null)
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/70" />
        <DialogPrimitive.Content onOpenAutoFocus={() => { returnFocus.current = document.activeElement as HTMLElement }} onCloseAutoFocus={event => { event.preventDefault(); returnFocus.current?.focus() }} className={cn('fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto border-l border-border bg-background p-6 shadow-2xl', className)}>
          <div className="flex items-start justify-between gap-4">
            <DialogPrimitive.Title className="text-lg font-bold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close aria-label="Fechar painel" className="-mt-2 flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-card"><X size={20} /></DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="mb-6 text-sm leading-6 text-muted-foreground">{description}</DialogPrimitive.Description>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
