// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers/layout-screen-container'
import {
  type CoveragesGridProps,
  CoveragesGrid
} from '../grids/resources/coverages'
// React
import * as React from 'react'
// Material UI
import HiveIcon from '@mui/icons-material/Hive'

export type CoveragesScreenProps = CoveragesGridProps

export function CoveragesScreen(props: CoveragesScreenProps) {
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'покрытия требований',
        href: '/coverages',
        Icon: HiveIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer
      title="покрытия требований"
      breadcrumbsItems={breadcrumbsItems}
    >
      <CoveragesGrid {...props} />
    </LayoutScreenContainer>
  )
}
