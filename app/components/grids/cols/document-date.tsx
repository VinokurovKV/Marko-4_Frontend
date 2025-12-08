// Project
import { useDateCol } from './date'

export function useDocumentDateCol() {
  return useDateCol({
    field: 'date',
    headerName: 'Дата публикации',
    minWidth: 150,
    flex: 0.01
  })
}
