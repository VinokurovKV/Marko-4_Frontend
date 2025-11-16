// Project
import { WarningScreen } from './warning'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'

export function LateSetupScreen() {
  const navigate = useNavigate()

  const handleClick = React.useCallback(() => {
    void navigate('/')
  }, [navigate])

  return (
    <WarningScreen
      text="Инициализация системы уже выполнена"
      actionButton={{ text: 'Войти в систему', onClick: handleClick }}
    />
  )
}
