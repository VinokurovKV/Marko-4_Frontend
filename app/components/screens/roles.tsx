// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers/layout-screen-container'
import { type RolesGridProps, RolesGrid } from '../grids/resources/roles'
// React
import * as React from 'react'
// Material UI
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy'

export type RolesScreenProps = RolesGridProps

export function RolesScreen(props: RolesScreenProps) {
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'роли',
        href: '/roles',
        Icon: TheaterComedyIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer title="роли" breadcrumbsItems={breadcrumbsItems}>
      <RolesGrid {...props} />
    </LayoutScreenContainer>
  )
}
