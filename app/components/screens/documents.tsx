// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import {
  type DocumentsGridProps,
  DocumentsGrid
} from '../grids/resources/documents'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import DescriptionIcon from '@mui/icons-material/Description'

export interface DocumentsScreenProps
  extends Omit<
    DocumentsGridProps,
    'navigationMode' | 'navigationModeSelectedRowId'
  > {
  children: React.ReactNode
}

export function DocumentsScreen({ children, ...props }: DocumentsScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/documents/:documentId?', pathname)
  const withDocument = match?.params.documentId !== undefined
  const documentId = React.useMemo(() => {
    const parsed =
      match?.params.documentId !== undefined
        ? parseInt(match.params.documentId)
        : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])

  const documentCode = React.useMemo(
    () =>
      props.documents.find((document) => document.id === documentId)?.code ??
      null,
    [props.documents, documentId]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'документы',
          href: '/documents',
          Icon: DescriptionIcon
        }
      ],
      ...(withDocument
        ? [
            {
              title:
                documentCode !== null
                  ? documentCode
                  : documentId !== null
                    ? `[ID:${documentId}]`
                    : '???',
              href: documentId !== null ? `/documents/${documentId}` : undefined
            }
          ]
        : [])
    ],
    [withDocument, documentId, documentCode]
  )
  return (
    <LayoutScreenContainer
      title="документы"
      breadcrumbsItems={breadcrumbsItems}
    >
      <HorizontalTwoPartsContainer
        proportions={withDocument ? 'ONE_TWO' : 'ONE_ZERO'}
      >
        <DocumentsGrid
          key={`${withDocument}`}
          {...props}
          navigationMode={withDocument}
          navigationModeSelectedRowId={
            withDocument ? (documentId ?? undefined) : undefined
          }
        />
        {children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
