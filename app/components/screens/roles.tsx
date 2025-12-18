// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import { type RolesGridProps, RolesGrid } from '../grids/resources/roles'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy'

export interface RolesScreenProps
  extends Omit<
    RolesGridProps,
    'navigationMode' | 'navigationModeSelectedRowId'
  > {
  children: React.ReactNode
}

export function RolesScreen({ children, ...props }: RolesScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/roles/:roleId?', pathname)
  const withRole = match?.params.roleId !== undefined
  const roleId = React.useMemo(() => {
    const parsed =
      match?.params.roleId !== undefined ? parseInt(match.params.roleId) : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])

  const roleName = React.useMemo(
    () => props.roles.find((role) => role.id === roleId)?.name ?? null,
    [props.roles, roleId]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'роли',
          href: '/roles',
          Icon: TheaterComedyIcon
        }
      ],
      ...(withRole
        ? [
            {
              title:
                roleName !== null
                  ? roleName
                  : roleId !== null
                    ? `[ID:${roleId}]`
                    : '???',
              href: roleId !== null ? `/roles/${roleId}` : undefined
            }
          ]
        : [])
    ],
    [withRole, roleId, roleName]
  )
  return (
    <LayoutScreenContainer title="роли" breadcrumbsItems={breadcrumbsItems}>
      <HorizontalTwoPartsContainer
        proportions={withRole ? 'ONE_THREE' : 'ONE_ZERO'}
      >
        <RolesGrid
          key={`${withRole}`}
          {...props}
          navigationMode={withRole}
          navigationModeSelectedRowId={
            withRole ? (roleId ?? undefined) : undefined
          }
        />
        {children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
