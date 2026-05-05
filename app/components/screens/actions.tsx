// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import { type ActionsGridProps, ActionsGrid } from '../grids/actions'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges'

export interface ActionsScreenProps extends Omit<
  ActionsGridProps,
  'navigationMode' | 'navigationModeSelectedRowId'
> {
  children: React.ReactNode
}

export function ActionsScreen({ children, ...props }: ActionsScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/actions/:actionId?', pathname)
  const withAction = match?.params.actionId !== undefined
  const actionId = React.useMemo(() => {
    const parsed =
      match?.params.actionId !== undefined
        ? parseInt(match.params.actionId)
        : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'действия',
          href: '/actions',
          Icon: PublishedWithChangesIcon
        }
      ],
      ...(withAction
        ? [
            {
              title: `[ID:${actionId}]`,
              href: actionId !== null ? `/actions/${actionId}` : undefined
            }
          ]
        : [])
    ],
    [withAction, actionId]
  )
  return (
    <LayoutScreenContainer title="действия" breadcrumbsItems={breadcrumbsItems}>
      <HorizontalTwoPartsContainer
        proportions={withAction ? 'ONE_TWO' : 'ONE_ZERO'}
      >
        <ActionsGrid
          key={`${withAction}`}
          {...props}
          navigationMode={withAction}
          navigationModeSelectedRowId={
            withAction ? (actionId ?? undefined) : undefined
          }
        />
        {children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
