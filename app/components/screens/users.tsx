// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers'
import { type UsersGridProps, UsersGrid } from '../grids/resources/users'
// React
import * as React from 'react'
// Material UI
import PersonIcon from '@mui/icons-material/Person'

export type UsersScreenProps = UsersGridProps

export function UsersScreen(props: UsersScreenProps) {
  const title = 'пользователи'
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: title,
        href: '/users',
        Icon: PersonIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer title={title} breadcrumbsItems={breadcrumbsItems}>
      <UsersGrid {...props} />
    </LayoutScreenContainer>
  )
}
