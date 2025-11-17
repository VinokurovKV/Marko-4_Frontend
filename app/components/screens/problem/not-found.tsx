// Project
import { WarningScreen } from './warning'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'

export function NotFoundScreen() {
  const navigate = useNavigate()

  const handleClick = React.useCallback(() => {
    void navigate('/')
  }, [navigate])

  return (
    <WarningScreen
      text="Страница не найдена (404)"
      actionButton={{ text: 'на главный экран', onClick: handleClick }}
    />
  )
}
