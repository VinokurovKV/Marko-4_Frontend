// Project
import { useDateTimeCol } from './date'

export function useLaunchTimeCol() {
  return useDateTimeCol({
    field: 'launchTime',
    headerName: 'Время запуска',
    minWidth: 120,
    flex: 0.01
  })
}
