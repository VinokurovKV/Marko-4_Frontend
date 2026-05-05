// Project
import type { VersionedResourceTypePlural } from '@common/enums'
import {
  allVersionedResourceTypePlurals,
  versionResourceTypeFromPlural
} from '@common/enums'
import { localizationForVersionedResourceType } from '~/localization'
import { HorizontalTwoPartsContainer } from '../containers'
import {
  type TransitionsGridProps,
  TransitionsGrid
} from '../grids/transitions'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Other
import * as changeCase from 'change-case'

export interface HistoryVersionScreenProps extends Omit<
  TransitionsGridProps,
  'navigationMode' | 'navigationModeSelectedRowId'
> {
  children: React.ReactNode
}

export function HistoryVersionScreen({
  children,
  ...props
}: HistoryVersionScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath(
    '/history/:resourceType?/:resourceId?/:transitionNum?',
    pathname
  )
  const resourceType = (() => {
    const resourceTypeConstant = changeCase.constantCase(
      match?.params.resourceType ?? ''
    ) as VersionedResourceTypePlural
    return allVersionedResourceTypePlurals.includes(resourceTypeConstant)
      ? resourceTypeConstant
      : undefined
  })()
  const withResourceType = resourceType !== undefined
  const resourceId = React.useMemo(() => {
    const parsed =
      match?.params.resourceId !== undefined
        ? parseInt(match.params.resourceId)
        : undefined
    return parsed === undefined || isNaN(parsed) ? undefined : parsed
  }, [match])
  const withResourceId = withResourceType && resourceId !== undefined
  const transitionNum = React.useMemo(() => {
    const parsed =
      match?.params.transitionNum !== undefined
        ? parseInt(match.params.transitionNum)
        : undefined
    return parsed === undefined || isNaN(parsed) ? undefined : parsed
  }, [match])
  const withTransitionNum = withResourceId && transitionNum !== undefined

  return (
    <HorizontalTwoPartsContainer
      title={
        resourceType !== undefined
          ? [
              localizationForVersionedResourceType.get(
                versionResourceTypeFromPlural[resourceType]
              ) ?? '',
              `[ID:${resourceId}]`
            ]
          : ''
      }
      proportions={withTransitionNum ? 'ONE_THREE' : 'ONE_ZERO'}
    >
      <TransitionsGrid
        key={`${withTransitionNum}`}
        {...props}
        navigationMode={withTransitionNum}
        navigationModeSelectedTransitionNum={
          withTransitionNum ? (transitionNum ?? undefined) : undefined
        }
      />
      {children}
    </HorizontalTwoPartsContainer>
  )
}
