// Project
import type { Right } from '@common/enums'
// Material UI
import type { OverridableComponent } from '@mui/material/OverridableComponent'
import type { SvgIconTypeMap } from '@mui/material/SvgIcon'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type Icon = OverridableComponent<SvgIconTypeMap<{}, 'svg'>> & {
  muiName: string
}

export type AcountMenuConfig = {
  title: string
  Icon: Icon
  href: string
  requiredRights?: Right[]
  requiredAnyRights?: Right[]
}[]
