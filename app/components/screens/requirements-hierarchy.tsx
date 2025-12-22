// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import {
  type RequirementsHierarchyViewerProps,
  RequirementsHierarchyViewer
} from '../requirements-hierarchy/requirements-hierarchy-viewer'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import HubIcon from '@mui/icons-material/Hub'

export interface RequirementsHierarchyScreenProps
  extends RequirementsHierarchyViewerProps {
  children: React.ReactNode
}

export function RequirementsHierarchyScreen({
  children,
  ...props
}: RequirementsHierarchyScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/requirements-hierarchy/:requirementId?', pathname)
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
      props.requirementsHierarchy.vertexes.find(
        (vertex) => vertex.id === requirementId
      )?.code ?? null,
    [props.requirementsHierarchy.vertexes, requirementId]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'иерархия требований',
          href: '/requirements-hierarchy',
          Icon: HubIcon
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
      title="иерархия требований (экран дорабатывается, приведена иерархия для примера)"
      breadcrumbsItems={breadcrumbsItems}
    >
      <HorizontalTwoPartsContainer
        proportions={withRequirement ? 'TWO_ONE' : 'ONE_ZERO'}
      >
        <RequirementsHierarchyViewer
          // key={`${withRequirement}`}
          {...props}
        />
        {children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
