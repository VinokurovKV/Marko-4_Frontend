// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers/layout-screen-container'
import {
  type CommonTopologiesGridProps,
  CommonTopologiesGrid
} from '../grids/resources/common-topologies'
// React
import * as React from 'react'
// Material UI
import DeviceHubIcon from '@mui/icons-material/DeviceHub'

export type CommonTopologiesScreenProps = CommonTopologiesGridProps

export function CommonTopologiesScreen(props: CommonTopologiesScreenProps) {
  const title = 'общие топологии'
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: title,
        href: '/common-topologies',
        Icon: DeviceHubIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer title={title} breadcrumbsItems={breadcrumbsItems}>
      <CommonTopologiesGrid {...props} />
    </LayoutScreenContainer>
  )
}
