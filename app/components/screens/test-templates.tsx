// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers/layout-screen-container'
import {
  type TestTemplatesGridProps,
  TestTemplatesGrid
} from '../grids/resources/test-templates'
// React
import * as React from 'react'
// Material UI
import FoundationIcon from '@mui/icons-material/Foundation'

export type TestTemplatesScreenProps = TestTemplatesGridProps

export function TestTemplatesScreen(props: TestTemplatesScreenProps) {
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'шаблоны тестов',
        href: '/testTemplates',
        Icon: FoundationIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer
      title="шаблоны тестов"
      breadcrumbsItems={breadcrumbsItems}
    >
      <TestTemplatesGrid {...props} />
    </LayoutScreenContainer>
  )
}
