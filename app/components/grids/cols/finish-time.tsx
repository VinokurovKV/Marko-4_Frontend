// Project
import { useDateTimeCol } from './date'

export function useFinishTimeCol() {
  return useDateTimeCol({
    field: 'finishTime',
    headerName: 'Время завершения',
    minWidth: 120,
    flex: 0.01
  })
}
