// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers'
import { type TagsGridProps, TagsGrid } from '../grids/resources/tags'
// React
import * as React from 'react'
// Material UI
import TagIcon from '@mui/icons-material/Tag'

export type TagsScreenProps = TagsGridProps

export function TagsScreen(props: TagsScreenProps) {
  const title = 'теги'
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: title,
        href: '/tags',
        Icon: TagIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer title={title} breadcrumbsItems={breadcrumbsItems}>
      <TagsGrid {...props} />
    </LayoutScreenContainer>
  )
}
