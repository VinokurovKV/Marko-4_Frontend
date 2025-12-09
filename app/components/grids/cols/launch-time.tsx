// Project
import { useDateTimeCol } from './date'

export function useLaunchTimeCol() {
  return useDateTimeCol({
    field: 'launchTime',
    headerName: 'Время запуска',
    minWidth: 200,
    flex: 0.01
  })
}
