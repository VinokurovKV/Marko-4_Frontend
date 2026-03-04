// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import {
  type CoveragesGridProps,
  CoveragesGrid
} from '../grids/resources/coverages'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import HiveIcon from '@mui/icons-material/Hive'

export interface CoveragesScreenProps extends Omit<
  CoveragesGridProps,
  'navigationMode' | 'navigationModeSelectedRowId'
> {
  children: React.ReactNode
}

export function CoveragesScreen({ children, ...props }: CoveragesScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/coverages/:coverageId?', pathname)
  const withCoverage = match?.params.coverageId !== undefined
  const coverageId = React.useMemo(() => {
    const parsed =
      match?.params.coverageId !== undefined
        ? parseInt(match.params.coverageId)
        : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])

  const coverageCode = React.useMemo(
    () =>
      props.coverages.find((coverage) => coverage.id === coverageId)?.code ??
      null,
    [props.coverages, coverageId]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'покрытия требований',
          href: '/coverages',
          Icon: HiveIcon
        }
      ],
      ...(withCoverage
        ? [
            {
              title:
                coverageCode !== null
                  ? coverageCode
                  : coverageId !== null
                    ? `[ID:${coverageId}]`
                    : '???',
              href: coverageId !== null ? `/coverages/${coverageId}` : undefined
            }
          ]
        : [])
    ],
    [withCoverage, coverageId, coverageCode]
  )
  return (
    <LayoutScreenContainer
      title="покрытия требований"
      breadcrumbsItems={breadcrumbsItems}
    >
      <HorizontalTwoPartsContainer
        proportions={withCoverage ? 'ONE_TWO' : 'ONE_ZERO'}
      >
        <CoveragesGrid
          key={`${withCoverage}`}
          {...props}
          navigationMode={withCoverage}
          navigationModeSelectedRowId={
            withCoverage ? (coverageId ?? undefined) : undefined
          }
        />
        {children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
