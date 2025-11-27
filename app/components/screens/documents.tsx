// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers/layout-screen-container'
import {
  type DocumentsGridProps,
  DocumentsGrid
} from '../grids/resources/documents'
// React
import * as React from 'react'
// Material UI
import DescriptionIcon from '@mui/icons-material/Description'

export type DocumentsScreenProps = DocumentsGridProps

export function DocumentsScreen(props: DocumentsScreenProps) {
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'документы',
        href: '/documents',
        Icon: DescriptionIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer
      title="документы"
      breadcrumbsItems={breadcrumbsItems}
    >
      <DocumentsGrid {...props} />
    </LayoutScreenContainer>
  )
}
