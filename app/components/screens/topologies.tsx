// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import {
  type TopologiesGridProps,
  TopologiesGrid
} from '../grids/resources/topologies'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import LanIcon from '@mui/icons-material/Lan'

export interface TopologiesScreenProps
  extends Omit<
    TopologiesGridProps,
    'navigationMode' | 'navigationModeSelectedRowId'
  > {
  children: React.ReactNode
}

export function TopologiesScreen({
  children,
  ...props
}: TopologiesScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/topologies/:topologyId?', pathname)
  const withTopology = match?.params.topologyId !== undefined
  const topologyId = React.useMemo(() => {
    const parsed =
      match?.params.topologyId !== undefined
        ? parseInt(match.params.topologyId)
        : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])

  const topologyCode = React.useMemo(
    () =>
      props.topologies.find((topology) => topology.id === topologyId)?.code ??
      null,
    [props.topologies, topologyId]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'топологии',
          href: '/topologies',
          Icon: LanIcon
        }
      ],
      ...(withTopology
        ? [
            {
              title:
                topologyCode !== null
                  ? topologyCode
                  : topologyId !== null
                    ? `[ID:${topologyId}]`
                    : '???',
              href:
                topologyId !== null ? `/topologies/${topologyId}` : undefined
            }
          ]
        : [])
    ],
    [withTopology, topologyId, topologyCode]
  )
  return (
    <LayoutScreenContainer
      title="топологии"
      breadcrumbsItems={breadcrumbsItems}
    >
      <HorizontalTwoPartsContainer
        proportions={withTopology ? 'ONE_TWO' : 'ONE_ZERO'}
      >
        <TopologiesGrid
          key={`${withTopology}`}
          {...props}
          navigationMode={withTopology}
          navigationModeSelectedRowId={
            withTopology ? (topologyId ?? undefined) : undefined
          }
        />
        {children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
