// Project
import { ToggleIconButton } from '../../buttons/toggle-icon-button'
import { AccountMenu } from './account-menu'
import { ThemeSwitcher } from '../../theme/theme-switcher'
import { useInteractiveGuide } from '~/components/interactive-guide/guide-provider'
// React router
import { Link } from 'react-router'
// React
import * as React from 'react'
// Material UI
import MenuIcon from '@mui/icons-material/Menu'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { styled } from '@mui/material/styles'
import MuiAppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
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
  const { startGuide } = useInteractiveGuide()

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
                  data-guide-id="header-menu-button"
                  ActiveIcon={MenuOpenIcon}
                  InactiveIcon={MenuIcon}
                  activePrompt="уменьшить меню"
                  inactivePrompt="раскрыть меню"
                  active={menuIsOpen}
                  onToggle={handleToggleMenu}
                />
              }
            </Box>
            <Link
              to="/"
              style={{ textDecoration: 'none' }}
              data-guide-id="header-logo"
            >
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
              <Tooltip title="Открыть руководство">
                <IconButton
                  size="medium"
                  onClick={startGuide}
                  data-guide-id="header-guide-button"
                  sx={{
                    height: '1.8rem',
                    width: '1.8rem',
                    borderWidth: 1.2,
                    borderStyle: 'solid',
                    borderColor: 'grey.600',
                    borderRadius: 1
                  }}
                >
                  <HelpOutlineIcon />
                </IconButton>
              </Tooltip>
              <Box data-guide-id="header-theme-switcher">
                <ThemeSwitcher />
              </Box>
              <Box data-guide-id="header-account-menu">
                <AccountMenu />
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
