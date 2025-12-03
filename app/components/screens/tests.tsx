// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers/layout-screen-container'
import { type TestsGridProps, TestsGrid } from '../grids/resources/tests'
// React
import * as React from 'react'
// Material UI
import RuleIcon from '@mui/icons-material/Rule'

export type TestsScreenProps = TestsGridProps

export function TestsScreen(props: TestsScreenProps) {
  const title = 'тесты'
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: title,
        href: '/tests',
        Icon: RuleIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer title={title} breadcrumbsItems={breadcrumbsItems}>
      <TestsGrid {...props} />
    </LayoutScreenContainer>
  )
}
