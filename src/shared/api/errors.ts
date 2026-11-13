import { isAxiosError } from 'axios'

export function apiErrorMessage(error: unknown, fallback = 'Não foi possível concluir a operação. Tente novamente.') {
  const data: unknown = isAxiosError(error) ? error.response?.data : undefined
  return data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' ? data.message : fallback
}
