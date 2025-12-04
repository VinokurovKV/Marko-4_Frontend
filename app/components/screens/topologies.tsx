// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers/layout-screen-container'
import {
  type TopologiesGridProps,
  TopologiesGrid
} from '../grids/resources/topologies'
// React
import * as React from 'react'
// Material UI
import LanIcon from '@mui/icons-material/Lan'

export type TopologiesScreenProps = TopologiesGridProps

export function TopologiesScreen(props: TopologiesScreenProps) {
  const title = 'топологии'
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: title,
        href: '/topologies',
        Icon: LanIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer title={title} breadcrumbsItems={breadcrumbsItems}>
      <TopologiesGrid {...props} />
    </LayoutScreenContainer>
  )
}
