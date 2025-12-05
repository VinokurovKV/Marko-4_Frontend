// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers/layout-screen-container'
import { type GroupsGridProps, GroupsGrid } from '../grids/resources/groups'
// React
import * as React from 'react'
// Material UI
import ViewWeekIcon from '@mui/icons-material/ViewWeek'

export type GroupsScreenProps = GroupsGridProps

export function GroupsScreen(props: GroupsScreenProps) {
  const title = 'группы тестов'
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: title,
        href: '/groups',
        Icon: ViewWeekIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer title={title} breadcrumbsItems={breadcrumbsItems}>
      <GroupsGrid {...props} />
    </LayoutScreenContainer>
  )
}
