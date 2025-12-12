// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers'
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
  const title = 'покрытия требований'
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: title,
        href: '/coverages',
        Icon: HiveIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer title={title} breadcrumbsItems={breadcrumbsItems}>
      <CoveragesGrid {...props} />
    </LayoutScreenContainer>
  )
}
