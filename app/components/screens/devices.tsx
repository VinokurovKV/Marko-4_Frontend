// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers'
import { type DevicesGridProps, DevicesGrid } from '../grids/resources/devices'
// React
import * as React from 'react'
// Material UI
import ComputerIcon from '@mui/icons-material/Computer'

export type DevicesScreenProps = DevicesGridProps

export function DevicesScreen(props: DevicesScreenProps) {
  const title = 'устройства'
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: title,
        href: '/devices',
        Icon: ComputerIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer title={title} breadcrumbsItems={breadcrumbsItems}>
      <DevicesGrid {...props} />
    </LayoutScreenContainer>
  )
}
