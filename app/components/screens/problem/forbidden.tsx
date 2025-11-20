// Project
import { WarningScreen } from './warning'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'

export function ForbiddenScreen() {
  const navigate = useNavigate()

  const handleClick = React.useCallback(() => {
    void navigate('/')
  }, [navigate])

  return (
    <WarningScreen
      text="Недостаточно прав для просмотра запрошенных данных"
      actionButton={{ text: 'на главный экран', onClick: handleClick }}
    />
  )
}
