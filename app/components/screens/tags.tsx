// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import { type TagsGridProps, TagsGrid } from '../grids/resources/tags'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import TagIcon from '@mui/icons-material/Tag'

export interface TagsScreenProps
  extends Omit<
    TagsGridProps,
    'navigationMode' | 'navigationModeSelectedRowId'
  > {
  children: React.ReactNode
}

export function TagsScreen({ children, ...props }: TagsScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/tags/:tagId?', pathname)
  const withTag = match?.params.tagId !== undefined
  const tagId = React.useMemo(() => {
    const parsed =
      match?.params.tagId !== undefined ? parseInt(match.params.tagId) : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])

  const tagCode = React.useMemo(
    () => props.tags.find((tag) => tag.id === tagId)?.code ?? null,
    [props.tags, tagId]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'теги',
          href: '/tags',
          Icon: TagIcon
        }
      ],
      ...(withTag
        ? [
            {
              title:
                tagCode !== null
                  ? tagCode
                  : tagId !== null
                    ? `[ID:${tagId}]`
                    : '???',
              href: tagId !== null ? `/tags/${tagId}` : undefined
            }
          ]
        : [])
    ],
    [tagId, tagCode]
  )
  return (
    <LayoutScreenContainer title="теги" breadcrumbsItems={breadcrumbsItems}>
      <HorizontalTwoPartsContainer
        proportions={withTag ? 'ONE_TWO' : 'ONE_ZERO'}
      >
        <TagsGrid
          key={`${withTag}`}
          {...props}
          navigationMode={withTag}
          navigationModeSelectedRowId={
            withTag ? (tagId ?? undefined) : undefined
          }
        />
        {children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
