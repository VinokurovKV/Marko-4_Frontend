// Project
// import { formatDate } from '~/utilities/format-date'
import { useDateTimeCol } from './date'

export function useCreateTimeCol() {
  return useDateTimeCol({
    field: 'createTime',
    headerName: 'Время создания',
    minWidth: 190,
    flex: 0.01
  })
}
