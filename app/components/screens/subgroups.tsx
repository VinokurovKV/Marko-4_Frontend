// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import {
  type SubgroupsGridProps,
  SubgroupsGrid
} from '../grids/resources/subgroups'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import ViewStreamIcon from '@mui/icons-material/ViewStream'

export interface SubgroupsScreenProps
  extends Omit<
    SubgroupsGridProps,
    'navigationMode' | 'navigationModeSelectedRowId'
  > {
  children: React.ReactNode
}

export function SubgroupsScreen({ children, ...props }: SubgroupsScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/subgroups/:subgroupId?', pathname)
  const withSubgroup = match?.params.subgroupId !== undefined
  const subgroupId = React.useMemo(() => {
    const parsed =
      match?.params.subgroupId !== undefined
        ? parseInt(match.params.subgroupId)
        : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])

  const subgroupCode = React.useMemo(
    () =>
      props.subgroups.find((subgroup) => subgroup.id === subgroupId)?.code ??
      null,
    [props.subgroups, subgroupId]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'подгруппы тестов',
          href: '/subgroups',
          Icon: ViewStreamIcon
        }
      ],
      ...(withSubgroup
        ? [
            {
              title:
                subgroupCode !== null
                  ? subgroupCode
                  : subgroupId !== null
                    ? `[ID:${subgroupId}]`
                    : '???',
              href: subgroupId !== null ? `/subgroups/${subgroupId}` : undefined
            }
          ]
        : [])
    ],
    [withSubgroup, subgroupId, subgroupCode]
  )
  return (
    <LayoutScreenContainer
      title="подгруппы тестов"
      breadcrumbsItems={breadcrumbsItems}
    >
      <HorizontalTwoPartsContainer
        proportions={withSubgroup ? 'ONE_TWO' : 'ONE_ZERO'}
      >
        <SubgroupsGrid
          key={`${withSubgroup}`}
          {...props}
          navigationMode={withSubgroup}
          navigationModeSelectedRowId={
            withSubgroup ? (subgroupId ?? undefined) : undefined
          }
        />
        {children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
