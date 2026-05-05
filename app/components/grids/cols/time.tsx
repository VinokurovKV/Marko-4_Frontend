// Project
import { useDateTimeCol } from './date'

export function useTimeCol() {
  return useDateTimeCol({
    field: 'time',
    headerName: 'Время',
    minWidth: 160,
    flex: 0.01
  })
}
