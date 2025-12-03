// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers/layout-screen-container'
import {
  type RequirementsGridProps,
  RequirementsGrid
} from '../grids/resources/requirements'
// React
import * as React from 'react'
// Material UI
import FormatListNumberedRtlIcon from '@mui/icons-material/FormatListNumberedRtl'

export type RequirementsScreenProps = RequirementsGridProps

export function RequirementsScreen(props: RequirementsScreenProps) {
  const title = 'требования'
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: title,
        href: '/requirements',
        Icon: FormatListNumberedRtlIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer title={title} breadcrumbsItems={breadcrumbsItems}>
      <RequirementsGrid {...props} />
    </LayoutScreenContainer>
  )
}
