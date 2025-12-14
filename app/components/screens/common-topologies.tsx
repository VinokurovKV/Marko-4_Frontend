// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import {
  type CommonTopologiesGridProps,
  CommonTopologiesGrid
} from '../grids/resources/common-topologies'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import DeviceHubIcon from '@mui/icons-material/DeviceHub'

export interface CommonTopologiesScreenProps
  extends Omit<
    CommonTopologiesGridProps,
    'navigationMode' | 'navigationModeSelectedRowId'
  > {
  children: React.ReactNode
}

export function CommonTopologiesScreen({
  children,
  ...props
}: CommonTopologiesScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/common-topologies/:commonTopologyId?', pathname)
  const withCommonTopology = match?.params.commonTopologyId !== undefined
  const commonTopologyId = React.useMemo(() => {
    const parsed =
      match?.params.commonTopologyId !== undefined
        ? parseInt(match.params.commonTopologyId)
        : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])

  const commonTopologyCode = React.useMemo(
    () =>
      props.commonTopologies.find(
        (commonTopology) => commonTopology.id === commonTopologyId
      )?.code ?? null,
    [props.commonTopologies, commonTopologyId]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'общие топологии',
          href: '/common-topologies',
          Icon: DeviceHubIcon
        }
      ],
      ...(withCommonTopology
        ? [
            {
              title:
                commonTopologyCode !== null
                  ? commonTopologyCode
                  : commonTopologyId !== null
                    ? `[ID:${commonTopologyId}]`
                    : '???',
              href:
                commonTopologyId !== null
                  ? `/common-topologies/${commonTopologyId}`
                  : undefined
            }
          ]
        : [])
    ],
    [commonTopologyId, commonTopologyCode]
  )
  return (
    <LayoutScreenContainer
      title="общие топологии"
      breadcrumbsItems={breadcrumbsItems}
    >
      <HorizontalTwoPartsContainer
        proportions={withCommonTopology ? 'ONE_TWO' : 'ONE_ZERO'}
      >
        <CommonTopologiesGrid
          key={`${withCommonTopology}`}
          {...props}
          navigationMode={withCommonTopology}
          navigationModeSelectedRowId={
            withCommonTopology ? (commonTopologyId ?? undefined) : undefined
          }
        />
        {children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
