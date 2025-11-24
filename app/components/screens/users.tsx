// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers/layout-screen-container'
import { type UsersGridProps, UsersGrid } from '../grids/users/users-grid'
// React
import * as React from 'react'
// Material UI
import PersonIcon from '@mui/icons-material/Person'

export type UsersScreenProps = UsersGridProps

export function UsersScreen(props: UsersScreenProps) {
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'пользователи',
        href: '/users',
        Icon: PersonIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer
      title="пользователи"
      breadcrumbsItems={breadcrumbsItems}
    >
      <UsersGrid {...props} />
    </LayoutScreenContainer>
  )
}
