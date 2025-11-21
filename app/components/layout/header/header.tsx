// Project
import { ToggleIconButton } from '../../buttons/toggle-icon-button'
import { AccountMenu } from './account-menu'
import { ThemeSwitcher } from '../../theme/theme-switcher'
// React router
import { Link } from 'react-router'
// React
import * as React from 'react'
// Material UI
import MenuIcon from '@mui/icons-material/Menu'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import { styled } from '@mui/material/styles'
import MuiAppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'

const AppBar = styled(MuiAppBar)(({ theme }) => ({
  borderWidth: 0,
  borderBottomWidth: 1,
  borderStyle: 'solid',
  borderColor: theme.palette.divider,
  boxShadow: 'none',
  zIndex: theme.zIndex.drawer + 1
}))

export interface HeaderProps {
  logo: React.ReactNode
  menuIsOpen: boolean
  onToggleMenu: (isOpen: boolean) => void
}

export function Header({ logo, menuIsOpen, onToggleMenu }: HeaderProps) {
  const handleToggleMenu = React.useCallback(() => {
    onToggleMenu(!menuIsOpen)
  }, [menuIsOpen, onToggleMenu])

  return (
    <AppBar
      color="inherit"
      position="absolute"
      sx={{ displayPrint: 'none', overflow: 'clip' }}
    >
      <Toolbar sx={{ backgroundColor: 'inherit', mx: { xs: -0.75, sm: -1 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            flexWrap: 'wrap',
            width: '100%'
          }}
        >
          <Stack direction="row" alignItems="center">
            <Box sx={{ mr: 2 }}>
              {
                <ToggleIconButton
                  ActiveIcon={MenuOpenIcon}
                  InactiveIcon={MenuIcon}
                  activePrompt="уменьшить меню"
                  inactivePrompt="раскрыть меню"
                  active={menuIsOpen}
                  onToggle={handleToggleMenu}
                />
              }
            </Box>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Stack direction="row" alignItems="center">
                {logo}
              </Stack>
            </Link>
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ ml: 'auto' }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <ThemeSwitcher />
              <AccountMenu />
            </Stack>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
