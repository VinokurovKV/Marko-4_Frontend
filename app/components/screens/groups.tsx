// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import { type GroupsGridProps, GroupsGrid } from '../grids/resources/groups'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import ViewWeekIcon from '@mui/icons-material/ViewWeek'

export interface GroupsScreenProps
  extends Omit<
    GroupsGridProps,
    'navigationMode' | 'navigationModeSelectedRowId'
  > {
  children: React.ReactNode
}

export function GroupsScreen({ children, ...props }: GroupsScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/groups/:groupId?', pathname)
  const withGroup = match?.params.groupId !== undefined
  const groupId = React.useMemo(() => {
    const parsed =
      match?.params.groupId !== undefined
        ? parseInt(match.params.groupId)
        : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])

  const groupCode = React.useMemo(
    () => props.groups.find((group) => group.id === groupId)?.code ?? null,
    [props.groups, groupId]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'группы тестов',
          href: '/groups',
          Icon: ViewWeekIcon
        }
      ],
      ...(withGroup
        ? [
            {
              title:
                groupCode !== null
                  ? groupCode
                  : groupId !== null
                    ? `[ID:${groupId}]`
                    : '???',
              href: groupId !== null ? `/groups/${groupId}` : undefined
            }
          ]
        : [])
    ],
    [groupId, groupCode]
  )
  return (
    <LayoutScreenContainer
      title="группы тестов"
      breadcrumbsItems={breadcrumbsItems}
    >
      <HorizontalTwoPartsContainer
        proportions={withGroup ? 'ONE_TWO' : 'ONE_ZERO'}
      >
        <GroupsGrid
          key={`${withGroup}`}
          {...props}
          navigationMode={withGroup}
          navigationModeSelectedRowId={
            withGroup ? (groupId ?? undefined) : undefined
          }
        />
        {children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
