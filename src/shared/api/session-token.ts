import { useSyncExternalStore } from 'react'
const key = 'kurio:session-token'
const event = 'kurio:session-changed'
export function getSessionToken() { return sessionStorage.getItem(key) ?? '' }
export function setSessionToken(token: string, expired = false) {
  if (token) sessionStorage.setItem(key, token)
  else sessionStorage.removeItem(key)
  if (expired) sessionStorage.setItem('kurio:session-expired', 'true')
  else sessionStorage.removeItem('kurio:session-expired')
  window.dispatchEvent(new Event(event))
}
function subscribe(listener: () => void) { window.addEventListener(event, listener); return () => window.removeEventListener(event, listener) }
export function useSessionToken() { return useSyncExternalStore(subscribe, getSessionToken, () => '') }
