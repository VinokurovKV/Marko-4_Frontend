// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers'
import { type RolesGridProps, RolesGrid } from '../grids/resources/roles'
// React
import * as React from 'react'
// Material UI
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy'

export type RolesScreenProps = RolesGridProps

export function RolesScreen(props: RolesScreenProps) {
  const title = 'роли'
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: title,
        href: '/roles',
        Icon: TheaterComedyIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer title={title} breadcrumbsItems={breadcrumbsItems}>
      <RolesGrid {...props} />
    </LayoutScreenContainer>
  )
}
