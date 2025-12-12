// Project
import { useDateCol } from './date'

export function useDocumentDateCol() {
  return useDateCol({
    field: 'date',
    headerName: 'Дата публикации',
    minWidth: 140,
    flex: 0.01
  })
}
