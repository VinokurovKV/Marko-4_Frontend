// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers/layout-screen-container'
import { type TagsGridProps, TagsGrid } from '../grids/resources/tags'
// React
import * as React from 'react'
// Material UI
import TagIcon from '@mui/icons-material/Tag'

export type TagsScreenProps = TagsGridProps

export function TagsScreen(props: TagsScreenProps) {
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'теги',
        href: '/tags',
        Icon: TagIcon
      }
    ],
    []
  )
  return (
    <LayoutScreenContainer title="теги" breadcrumbsItems={breadcrumbsItems}>
      <TagsGrid {...props} />
    </LayoutScreenContainer>
  )
}
