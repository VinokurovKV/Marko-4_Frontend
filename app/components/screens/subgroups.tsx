// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers/layout-screen-container'
import {
  type SubgroupsGridProps,
  SubgroupsGrid
} from '../grids/resources/subgroups'
// React
import * as React from 'react'
// Material UI
import ViewStreamIcon from '@mui/icons-material/ViewStream'

export type SubgroupsScreenProps = SubgroupsGridProps

export function SubgroupsScreen(props: SubgroupsScreenProps) {
  const title = 'подгруппы тестов'
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: title,
        href: '/subgroups',
        Icon: ViewStreamIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer title={title} breadcrumbsItems={breadcrumbsItems}>
      <SubgroupsGrid {...props} />
    </LayoutScreenContainer>
  )
}
