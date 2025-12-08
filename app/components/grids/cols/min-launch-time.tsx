// Project
import { useDateTimeCol } from './date'

export function useMinLaunchTimeCol() {
  return useDateTimeCol({
    field: 'minLaunchTime',
    headerName: 'Время отложенного запуска',
    minWidth: 150,
    flex: 0.01
  })
}
