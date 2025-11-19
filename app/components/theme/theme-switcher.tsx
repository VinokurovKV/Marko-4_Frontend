// Project
import { ToggleIconButton } from '../buttons/toggle-icon-button'
// React
import * as React from 'react'
// Material UI
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useColorScheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

export function ThemeSwitcher() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const preferredMode = prefersDarkMode ? 'dark' : 'light'

  const { mode, setMode } = useColorScheme()

  const paletteMode = !mode || mode === 'system' ? preferredMode : mode

  const toggleMode = React.useCallback(() => {
    setMode(paletteMode === 'dark' ? 'light' : 'dark')
  }, [setMode, paletteMode])

  return (
    <ToggleIconButton
      ActiveIcon={LightModeIcon}
      InactiveIcon={DarkModeIcon}
      activePrompt="дневной режим"
      inactivePrompt="ночной режим"
      active={paletteMode === 'dark'}
      onToggle={toggleMode}
    />
  )
}
