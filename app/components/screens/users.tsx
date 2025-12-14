// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import { type UsersGridProps, UsersGrid } from '../grids/resources/users'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import PersonIcon from '@mui/icons-material/Person'

export interface UsersScreenProps
  extends Omit<
    UsersGridProps,
    'navigationMode' | 'navigationModeSelectedRowId'
  > {
  children: React.ReactNode
}

export function UsersScreen({ children, ...props }: UsersScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/users/:userId?', pathname)
  const withUser = match?.params.userId !== undefined
  const userId = React.useMemo(() => {
    const parsed =
      match?.params.userId !== undefined ? parseInt(match.params.userId) : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])

  const userLogin = React.useMemo(
    () => props.users.find((user) => user.id === userId)?.login ?? null,
    [props.users, userId]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'пользователи',
          href: '/users',
          Icon: PersonIcon
        }
      ],
      ...(withUser
        ? [
            {
              title:
                userLogin !== null
                  ? userLogin
                  : userId !== null
                    ? `[ID:${userId}]`
                    : '???',
              href: userId !== null ? `/users/${userId}` : undefined
            }
          ]
        : [])
    ],
    [userId, userLogin]
  )
  return (
    <LayoutScreenContainer
      title="пользователи"
      breadcrumbsItems={breadcrumbsItems}
    >
      <HorizontalTwoPartsContainer
        proportions={withUser ? 'ONE_TWO' : 'ONE_ZERO'}
      >
        <UsersGrid
          key={`${withUser}`}
          {...props}
          navigationMode={withUser}
          navigationModeSelectedRowId={
            withUser ? (userId ?? undefined) : undefined
          }
        />
        {children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
