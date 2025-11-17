// Project
import { ErrorScreen } from './error'

export function NotConnectedScreen() {
  return (
    <ErrorScreen
      text="Возникли проблемы при обращении к серверу. Попробуйте обновить
            страницу."
    />
  )
}
