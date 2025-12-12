// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  DocumentPrimary,
  DocumentSecondary,
  DocumentTertiary,
  DocumentAll
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useChangeDetector } from '../change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneDocument<Scope extends ReadOneResourceScope> =
  Scope extends 'PRIMARY_PROPS'
    ? DocumentPrimary
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? DocumentSecondary
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? DocumentTertiary
        : DocumentAll

type ReadManyDocument<Scope extends ReadManyResourceScope> =
  Scope extends 'PRIMARY_PROPS' ? DocumentPrimary : DocumentSecondary

function useDocumentSubscriptionInner<Scope extends ReadOneResourceScope>(
  scope: Scope,
  documentId: number | null,
  setDocumentPair: React.Dispatch<
    React.SetStateAction<{
      documentId: number | null
      document?: ReadOneDocument<Scope> | null
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
      if (documentId === null) {
        setDocumentPair((oldPair) =>
          oldPair.documentId === null ? { ...oldPair, document: null } : oldPair
        )
        return
      }
      try {
        const document = (await serverConnector.readDocument(
          { id: documentId },
          {
            scope: scope
          }
        )) as ReadOneDocument<Scope>
        setDocumentPair((oldPair) =>
          oldPair.documentId === documentId
            ? {
                ...oldPair,
                document: document
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить документ с идентификатором ${documentId}`
          )
        }
      }
    },
    [scope, documentId, setDocumentPair, notifier]
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
    detectedObjects: [documentId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

  // Subscribe
  React.useEffect(() => {
    if (documentId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'DOCUMENT',
        resourceConfig: {
          id: documentId
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
  }, [scope, documentId, load])
}

/** Subscribe to document updates for existing document state */
export function useDocumentSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  documentId: number | null,
  setDocument: React.Dispatch<
    React.SetStateAction<ReadOneDocument<Scope> | null>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [documentPair, setDocumentPair] = React.useState<{
    documentId: number | null
    document?: ReadOneDocument<Scope> | null
  }>({
    documentId: documentId,
    document: undefined
  })
  React.useEffect(() => {
    setDocumentPair((oldPair) => ({
      documentId: documentId,
      document: oldPair.document
    }))
  }, [documentId, setDocumentPair])
  useDocumentSubscriptionInner(
    scope,
    documentPair.documentId,
    setDocumentPair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (documentPair.document !== undefined) {
      setDocument(documentPair.document)
    }
  }, [setDocument, documentPair.document])
}

/** Subscribe to document updates with initial load */
export function useDocument<Scope extends ReadOneResourceScope>(
  scope: Scope,
  documentId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [documentPair, setDocumentPair] = React.useState<{
    documentId: number | null
    document?: ReadOneDocument<Scope> | null
  }>({
    documentId: documentId,
    document: null
  })
  React.useEffect(() => {
    setDocumentPair((oldPair) => ({
      documentId: documentId,
      document: oldPair.document
    }))
  }, [documentId, setDocumentPair])
  useDocumentSubscriptionInner(
    scope,
    documentPair.documentId,
    setDocumentPair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return documentPair.document ?? null
}

/** Subscribe to documents updates for existing documents state */
export function useDocumentsSubscription<Scope extends ReadManyResourceScope>(
  scope: Scope,
  setDocuments:
    | React.Dispatch<React.SetStateAction<ReadManyDocument<Scope>[]>>
    | React.Dispatch<React.SetStateAction<ReadManyDocument<Scope>[] | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        const documents = (await serverConnector.readDocuments({
          scope: scope
        })) as ReadManyDocument<Scope>[]
        setDocuments(documents)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список документов'
          )
        }
      }
    },
    [scope, setDocuments, notifier]
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
        type: 'DOCUMENT'
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

/** Subscribe to documents updates with initial load */
export function useDocuments<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [documents, setDocuments] = React.useState<
    ReadManyDocument<Scope>[] | null
  >(null)
  useDocumentsSubscription(
    scope,
    setDocuments,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return documents
}
