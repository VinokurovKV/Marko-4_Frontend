// Project
import type { AcountMenuConfig } from './common'
// Material UI
import PersonIcon from '@mui/icons-material/Person'
import SettingsIcon from '@mui/icons-material/Settings'

export const ACCOUNT_MENU_CONFIG: AcountMenuConfig = [
  {
    title: 'профиль',
    Icon: PersonIcon,
    href: '/profile',
    requiredAnyRights: [
      'READ_SELF',
      'READ_USER',
      'UPDATE_SELF',
      'UPDATE_USER',
      'UPDATE_SELF_PASS',
      'UPDATE_USER_PASS'
    ]
  },
  {
    title: 'настройки',
    Icon: SettingsIcon,
    href: '/settings'
  }
]
