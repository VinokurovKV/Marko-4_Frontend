// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers/layout-screen-container'
import { type DevicesGridProps, DevicesGrid } from '../grids/resources/devices'
// React
import * as React from 'react'
// Material UI
import ComputerIcon from '@mui/icons-material/Computer'

export type DevicesScreenProps = DevicesGridProps

export function DevicesScreen(props: DevicesScreenProps) {
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'устройства',
        href: '/devices',
        Icon: ComputerIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer
      title="устройства"
      breadcrumbsItems={breadcrumbsItems}
    >
      <DevicesGrid {...props} />
    </LayoutScreenContainer>
  )
}
