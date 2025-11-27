// Other
import { format } from 'date-fns'

export function formatDate(date: Date) {
  return format(date, 'dd.MM.yyyy')
}

export function formatDateTime(date: Date) {
  return format(date, 'dd.MM.yyyy/HH:mm:ss:SSS')
}
