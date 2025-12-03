// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers/layout-screen-container'
import { type DbcsGridProps, DbcsGrid } from '../grids/resources/dbcs'
// React
import * as React from 'react'
// Material UI
import WidgetsIcon from '@mui/icons-material/Widgets'

export type DbcsScreenProps = DbcsGridProps

export function DbcsScreen(props: DbcsScreenProps) {
  const title = 'базовые конфигурации'
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: title,
        href: '/dbcs',
        Icon: WidgetsIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer title={title} breadcrumbsItems={breadcrumbsItems}>
      <DbcsGrid {...props} />
    </LayoutScreenContainer>
  )
}
