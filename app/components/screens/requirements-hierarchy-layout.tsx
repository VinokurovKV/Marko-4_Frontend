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
// React
import * as React from 'react'
// Material UI
import FormatListNumberedRtlIcon from '@mui/icons-material/FormatListNumberedRtl'

export interface RequirementsHierarchyLayoutScreenProps extends Omit<
  RequirementsGridProps,
  'navigationMode' | 'navigationModeSelectedRowId'
> {
  children: React.ReactNode
}

export function RequirementsHierarchyLayoutScreen(
  props: RequirementsHierarchyLayoutScreenProps
) {
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'требования',
        href: '/requirements',
        Icon: FormatListNumberedRtlIcon
      },
      {
        title: 'иерархия',
        href: `/requirements/hierarchy`
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer
      title="требования"
      breadcrumbsItems={breadcrumbsItems}
    >
      <HorizontalTwoPartsContainer proportions="ONE_THREE">
        <RequirementsGrid {...props} navigationMode={true} />
        {props.children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
