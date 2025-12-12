// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type { TagPrimary, TagSecondary, TagTertiary, TagAll } from '~/types'
import { serverConnector } from '~/server-connector'
import { useChangeDetector } from '../change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'
// Other
import { isEqual } from 'lodash'

type ReadOneTag<Scope extends ReadOneResourceScope> =
  Scope extends 'PRIMARY_PROPS'
    ? TagPrimary
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? TagSecondary
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? TagTertiary
        : TagAll

type ReadManyTag<Scope extends ReadManyResourceScope> =
  Scope extends 'PRIMARY_PROPS' ? TagPrimary : TagSecondary

const EMPTY_TAGS_ARR: TagAll[] = []

function useTagSubscriptionInner<Scope extends ReadOneResourceScope>(
  scope: Scope,
  tagId: number | null,
  setTagPair: React.Dispatch<
    React.SetStateAction<{
      tagId: number | null
      tag?: ReadOneTag<Scope> | null
    }>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      if (tagId === null) {
        setTagPair((oldPair) =>
          oldPair.tagId === null ? { ...oldPair, tag: null } : oldPair
        )
        return
      }
      try {
        const tag = (await serverConnector.readTag(
          { id: tagId },
          {
            scope: scope
          }
        )) as ReadOneTag<Scope>
        setTagPair((oldPair) =>
          oldPair.tagId === tagId
            ? {
                ...oldPair,
                tag: tag
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить тег с идентификатором ${tagId}`
          )
        }
      }
    },
    [scope, tagId, setTagPair, notifier]
  )

  // Initial load
  React.useEffect(() => {
    setInitialized(true)
    if (active === false || withInitialLoad === false || initialized) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [
    scope,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active,
    initialized,
    setInitialized,
    load
  ])

  // Process resource id change or active flag change to true
  useChangeDetector({
    detectedObjects: [tagId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

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

/** Subscribe to tag updates for existing tag state */
export function useTagSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  tagId: number | null,
  setTag: React.Dispatch<React.SetStateAction<ReadOneTag<Scope> | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [tagPair, setTagPair] = React.useState<{
    tagId: number | null
    tag?: ReadOneTag<Scope> | null
  }>({
    tagId: tagId,
    tag: undefined
  })
  React.useEffect(() => {
    setTagPair((oldPair) => ({
      tagId: tagId,
      tag: oldPair.tag
    }))
  }, [tagId, setTagPair])
  useTagSubscriptionInner(
    scope,
    tagPair.tagId,
    setTagPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (tagPair.tag !== undefined) {
      setTag(tagPair.tag)
    }
  }, [setTag, tagPair.tag])
}

/** Subscribe to tag updates with initial load */
export function useTag<Scope extends ReadOneResourceScope>(
  scope: Scope,
  tagId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [tagPair, setTagPair] = React.useState<{
    tagId: number | null
    tag?: ReadOneTag<Scope> | null
  }>({
    tagId: tagId,
    tag: null
  })
  React.useEffect(() => {
    setTagPair((oldPair) => ({
      tagId: tagId,
      tag: oldPair.tag
    }))
  }, [tagId, setTagPair])
  useTagSubscriptionInner(
    scope,
    tagPair.tagId,
    setTagPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return tagPair.tag ?? null
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

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
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
    [scope, setTags, notifier]
  )

  // Initial load
  React.useEffect(() => {
    setInitialized(true)
    if (active === false || withInitialLoad === false || initialized) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [
    scope,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active,
    initialized,
    setInitialized,
    load
  ])

  // Process active flag change to true
  useChangeDetector({
    detectedObjects: [active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

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

function useTagsFilteredSubscriptionInner<Scope extends ReadManyResourceScope>(
  scope: Scope,
  tagIds: number[] | null,
  setTagsPair: React.Dispatch<
    React.SetStateAction<{
      tagIds: number[] | null
      tags?: ReadManyTag<Scope>[] | null
    }>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        const tags =
          tagIds !== null
            ? ((await serverConnector.readTags({
                ids: tagIds,
                scope: scope
              })) as ReadManyTag<Scope>[])
            : EMPTY_TAGS_ARR
        setTagsPair((oldPair) =>
          isEqual(oldPair.tagIds, tagIds)
            ? {
                ...oldPair,
                tags: tags
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning('не удалось загрузить актуальный список тегов')
        }
      }
    },
    [scope, tagIds, setTagsPair, notifier]
  )

  // Initial load
  React.useEffect(() => {
    setInitialized(true)
    if (active === false || withInitialLoad === false || initialized) {
      return
    }
    void load(notifyAboutInitialLoadProblems)
  }, [
    scope,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active,
    initialized,
    setInitialized,
    load
  ])

  // Process tag ids change or active flag change to true
  useChangeDetector({
    detectedObjects: [tagIds, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

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
  }, [scope, tagIds, load])
}

/** Subscribe to tags updates for existing tags state */
export function useTagsFilteredSubscription<
  Scope extends ReadManyResourceScope
>(
  scope: Scope,
  tagIds: number[] | null,
  setTags: React.Dispatch<React.SetStateAction<ReadManyTag<Scope>[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [tagsPair, setTagsPair] = React.useState<{
    tagIds: number[] | null
    tags?: ReadManyTag<Scope>[] | null
  }>({
    tagIds: tagIds,
    tags: undefined
  })
  React.useEffect(() => {
    setTagsPair((oldPair) => ({
      tagIds: tagIds,
      tags: oldPair.tags
    }))
  }, [tagIds, setTagsPair])
  useTagsFilteredSubscriptionInner(
    scope,
    tagsPair.tagIds,
    setTagsPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (tagsPair.tags !== undefined) {
      setTags(tagsPair.tags)
    }
  }, [setTags, tagsPair.tags])
}

/** Subscribe to tags updates with initial load */
export function useTagsFiltered<Scope extends ReadManyResourceScope>(
  scope: Scope,
  tagIds: number[] | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [tagsPair, setTagsPair] = React.useState<{
    tagIds: number[] | null
    tags?: ReadManyTag<Scope>[] | null
  }>({
    tagIds: tagIds,
    tags: null
  })
  React.useEffect(() => {
    setTagsPair((oldPair) => ({
      tagIds: tagIds,
      tags: oldPair.tags
    }))
  }, [tagIds, setTagsPair])
  useTagsFilteredSubscriptionInner(
    scope,
    tagsPair.tagIds,
    setTagsPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return tagsPair.tags ?? null
}
