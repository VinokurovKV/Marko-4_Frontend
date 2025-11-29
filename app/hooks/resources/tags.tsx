// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadTagWithPrimaryPropsSuccessResultDto,
  ReadTagWithUpToSecondaryPropsSuccessResultDto,
  ReadTagWithUpToTertiaryPropsSuccessResultDto,
  ReadTagWithAllPropsSuccessResultDto,
  ReadTagsWithPrimaryPropsSuccessResultItemDto,
  ReadTagsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/tags.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneTag<Scope extends ReadOneResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadTagWithPrimaryPropsSuccessResultDto
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? ReadTagWithUpToSecondaryPropsSuccessResultDto
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? ReadTagWithUpToTertiaryPropsSuccessResultDto
        : ReadTagWithAllPropsSuccessResultDto
>

type ReadManyTag<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadTagsWithPrimaryPropsSuccessResultItemDto
    : ReadTagsWithUpToSecondaryPropsSuccessResultItemDto
>

/** Subscribe to tag updates for existing tag state */
export function useTagSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  tagId: number | null,
  setTag:
    | React.Dispatch<React.SetStateAction<ReadOneTag<Scope>>>
    | React.Dispatch<React.SetStateAction<ReadOneTag<Scope> | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      if (tagId === null || active === false) {
        return
      }
      try {
        const tag = (await serverConnector.readTag(
          { id: tagId },
          {
            scope: scope
          }
        )) as ReadOneTag<Scope>
        setTag(tag)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить тег с идентификатором ${tagId}`
          )
        }
      }
    },
    [scope, tagId, setTag, active]
  )

  // Initial load
  React.useEffect(() => {
    if (withInitialLoad === false) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [scope, withInitialLoad, notifyAboutInitialLoadProblems, load])

  // Subscribe
  React.useEffect(() => {
    if (tagId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'TAG',
        resourceConfig: {
          id: tagId
        }
      },
      (data) => {
        ;(() => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope !== 'PRIMARY_PROPS') ||
            (updateScope.tertiaryProps &&
              (scope === 'UP_TO_TERTIARY_PROPS' || scope === 'ALL_PROPS')) ||
            (updateScope.quaternaryProps && scope === 'ALL_PROPS')
          ) {
            void load(true)
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [scope, tagId, load])
}

/** Subscribe to tag updates with initial load */
export function useTag<Scope extends ReadOneResourceScope>(
  scope: Scope,
  tagId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [tag, setTag] = React.useState<ReadOneTag<Scope> | null>(null)
  useTagSubscription(
    scope,
    tagId,
    setTag,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return tag
}

/** Subscribe to tags updates for existing tags state */
export function useTagsSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setTags:
    | React.Dispatch<React.SetStateAction<ReadManyTag<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyTag<Scope>[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        if (active === false) {
          return
        }
        const tags = (await serverConnector.readTags({
          scope: scope
        })) as ReadManyTag<Scope>[]
        setTags(tags)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning('не удалось загрузить актуальный список тегов')
        }
      }
    },
    [scope, setTags, active]
  )

  // Initial load
  React.useEffect(() => {
    if (withInitialLoad === false) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [scope, withInitialLoad, notifyAboutInitialLoadProblems, load])

  // Subscribe
  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToResources(
      {
        type: 'TAG'
      },
      (data) => {
        ;(() => {
          const updateScope = data.updateScope
          if (
            updateScope.primaryProps ||
            (updateScope.secondaryProps && scope === 'UP_TO_SECONDARY_PROPS')
          ) {
            void load(true)
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [scope, load])
}

/** Subscribe to tags updates with initial load */
export function useTags<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [tags, setTags] = React.useState<ReadManyTag<Scope>[] | null>(null)
  useTagsSubscription(
    scope,
    setTags,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return tags
}
