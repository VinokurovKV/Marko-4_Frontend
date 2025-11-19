// Project
import type { Right } from '@common/enums'
// Material UI
import type { OverridableComponent } from '@mui/material/OverridableComponent'
import type { SvgIconTypeMap } from '@mui/material/SvgIcon'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type Icon = OverridableComponent<SvgIconTypeMap<{}, 'svg'>> & {
  muiName: string
}

interface SideNavigationConfigSecondLevelItem {
  id: string
  title: string
  Icon: Icon
  href: string
  requiredRights?: Right[]
}

type SideNavigationConfigFirstLevelItem = {
  id: string
  title: string
  Icon: Icon
  requiredRights?: Right[]
} & (
  | {
      href: string
    }
  | {
      nested: SideNavigationConfigSecondLevelItem[]
    }
)

interface SideNavigationConfigBlock {
  title: string
  requiredRights?: Right[]
  nested: SideNavigationConfigFirstLevelItem[]
}

export type SideNavigationConfig = SideNavigationConfigBlock[]
