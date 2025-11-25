// Project
import { serverConnector } from '~/server-connector'
import type { AcountMenuConfig } from '~/config/account-menu-config/common'
import { ACCOUNT_MENU_CONFIG } from '~/config/account-menu-config/data'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
// React router
import { useNavigate, Link } from 'react-router'
// React
import * as React from 'react'
// Material UI
import LogoutIcon from '@mui/icons-material/Logout'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

export function AccountMenu() {
  const navigate = useNavigate()
  const notifier = useNotifier()
  const meta = useMeta()

  const login = meta.status === 'AUTHENTICATED' ? meta.selfMeta.login : null
  const rightsSet =
    meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet

  const restrictedAcountMenuConfig: AcountMenuConfig = React.useMemo(() => {
    return ACCOUNT_MENU_CONFIG.filter((item) =>
      (item.requiredRights ?? []).every((right) => rightsSet.has(right))
    )
  }, [rightsSet])

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const open = Boolean(anchorEl)

  const handleMenuClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget)
    },
    []
  )

  const handleMenuClose = React.useCallback(() => {
    setAnchorEl(null)
  }, [])

  const handleLogoutClick = React.useCallback(() => {
    void (async () => {
      try {
        await serverConnector.logout({ deactivateAllTokens: false })
        notifier.showSuccess('выполнен выход из системы')
        void navigate('/login')
      } catch (error) {
        notifier.showError(error)
      }
    })()
  }, [])

  return (
    <React.Fragment>
      <Tooltip title="Управление аккаунтом">
        <IconButton onClick={handleMenuClick} size="small" sx={{ ml: 2 }}>
          <Avatar sx={{ width: 32, height: 32 }} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0
              }
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {login !== null ? (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              mt: 0.5,
              pl: 2,
              pr: 2
            }}
          >
            <Typography>Логин:</Typography>
            <Typography
              variant="body1"
              color="textPrimary"
              sx={{
                fontWeight: 'bold',
                textAlign: 'left'
              }}
            >
              {login}
            </Typography>
          </Stack>
        ) : null}
        <Divider sx={{ mt: 1, mb: 1 }} />
        {restrictedAcountMenuConfig.map((item) => (
          <MenuItem key={item.href} component={Link} to={item.href}>
            <ListItemIcon>
              <item.Icon fontSize="small" />
            </ListItemIcon>
            {capitalize(item.title, true)}
          </MenuItem>
        ))}
        <MenuItem onClick={handleLogoutClick}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Выйти
        </MenuItem>
      </Menu>
    </React.Fragment>
  )
}
