// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import {
  type RequirementsGridProps,
  RequirementsGrid
} from '../grids/resources/requirements'
// import { RequirementsHierarchyViewer } from '../requirements-hierarchy/requirements-hierarchy-viewer'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import FormatListNumberedRtlIcon from '@mui/icons-material/FormatListNumberedRtl'

export interface RequirementsScreenProps
  extends Omit<
    RequirementsGridProps,
    'navigationMode' | 'navigationModeSelectedRowId'
  > {
  children: React.ReactNode
}

export function RequirementsScreen({
  children,
  ...props
}: RequirementsScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/requirements/:requirementId?', pathname)
  const withRequirement = match?.params.requirementId !== undefined
  const requirementId = React.useMemo(() => {
    const parsed =
      match?.params.requirementId !== undefined
        ? parseInt(match.params.requirementId)
        : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])

  const requirementCode = React.useMemo(
    () =>
      props.requirements.find((requirement) => requirement.id === requirementId)
        ?.code ?? null,
    [props.requirements, requirementId]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'требования',
          href: '/requirements',
          Icon: FormatListNumberedRtlIcon
        }
      ],
      ...(withRequirement
        ? [
            {
              title:
                requirementCode !== null
                  ? requirementCode
                  : requirementId !== null
                    ? `[ID:${requirementId}]`
                    : '???',
              href:
                requirementId !== null
                  ? `/requirements/${requirementId}`
                  : undefined
            }
          ]
        : [])
    ],
    [withRequirement, requirementId, requirementCode]
  )
  return (
    <LayoutScreenContainer
      title="требования"
      breadcrumbsItems={breadcrumbsItems}
    >
      <HorizontalTwoPartsContainer proportions={'ONE_ZERO' /* SEVEN_FIVE"*/}>
        <HorizontalTwoPartsContainer
          proportions={
            withRequirement ? 'ONE_TWO' /*'FIVE_SEVEN'*/ : 'ONE_ZERO'
          }
        >
          <RequirementsGrid
            key={`${withRequirement}`}
            {...props}
            navigationMode={withRequirement}
            navigationModeSelectedRowId={
              withRequirement ? (requirementId ?? undefined) : undefined
            }
          />
          {children}
        </HorizontalTwoPartsContainer>
        null
        {/* <RequirementsHierarchyViewer
          requirementsHierarchy={props.requirementsHierarchy}
          tests={props.tests}
        /> */}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
