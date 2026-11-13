import type { KeyboardEvent } from 'react'

// Mantém seleção e foco juntos mesmo em toques rápidos nas setas.
export function navigateRadio(event: KeyboardEvent<HTMLButtonElement>, onSelect: (value: string) => void) {
  if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  const group = event.currentTarget.closest('[role="radiogroup"]')
  const items = Array.from(group?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? []).filter(item => !item.disabled)
  const index = items.indexOf(event.currentTarget)
  if (index < 0 || !items.length) return
  const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1
  const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + direction + items.length) % items.length
  const next = items[nextIndex]!
  event.preventDefault()
  onSelect(next.value)
  next.focus()
}
