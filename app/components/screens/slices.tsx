// Project
import type { SliceSecondary } from '~/types'
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import { SlicesGrid } from '../grids/resources/slices'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import ViewStreamIcon from '@mui/icons-material/ViewStream'

export interface SlicesScreenProps {
  slices: SliceSecondary[]
  onSlicesChange?: () => void
  children: React.ReactNode
}

export function SlicesScreen(props: SlicesScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/slices/:sliceId?', pathname)
  const withSlice = match?.params.sliceId !== undefined
  const sliceId = React.useMemo(() => {
    const parsed =
      match?.params.sliceId !== undefined
        ? parseInt(match.params.sliceId)
        : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])

  const sliceCode = React.useMemo(
    () => props.slices.find((slice) => slice.id === sliceId)?.code ?? null,
    [props.slices, sliceId]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'срезы заданий',
        href: '/slices',
        Icon: ViewStreamIcon
      },
      ...(withSlice
        ? [
            {
              title:
                sliceCode !== null
                  ? sliceCode
                  : sliceId !== null
                    ? `[ID:${sliceId}]`
                    : '???',
              href: sliceId !== null ? `/slices/${sliceId}` : undefined
            }
          ]
        : [])
    ],
    [withSlice, sliceId, sliceCode]
  )

  return (
    <LayoutScreenContainer
      title="срезы заданий"
      breadcrumbsItems={breadcrumbsItems}
    >
      <HorizontalTwoPartsContainer
        proportions={withSlice ? 'ONE_THREE' : 'ONE_ZERO'}
      >
        <SlicesGrid
          key={`${withSlice}`}
          navigationMode={withSlice}
          slices={props.slices}
          navigationModeSelectedRowId={
            withSlice ? (sliceId ?? undefined) : undefined
          }
          onSlicesChange={props.onSlicesChange}
        />
        {props.children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
