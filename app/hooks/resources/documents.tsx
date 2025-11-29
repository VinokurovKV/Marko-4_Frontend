// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadDocumentWithPrimaryPropsSuccessResultDto,
  ReadDocumentWithUpToSecondaryPropsSuccessResultDto,
  ReadDocumentWithUpToTertiaryPropsSuccessResultDto,
  ReadDocumentWithAllPropsSuccessResultDto,
  ReadDocumentsWithPrimaryPropsSuccessResultItemDto,
  ReadDocumentsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/documents.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneDocument<Scope extends ReadOneResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadDocumentWithPrimaryPropsSuccessResultDto
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? ReadDocumentWithUpToSecondaryPropsSuccessResultDto
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? ReadDocumentWithUpToTertiaryPropsSuccessResultDto
        : ReadDocumentWithAllPropsSuccessResultDto
>

type ReadManyDocument<Scope extends ReadManyResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadDocumentsWithPrimaryPropsSuccessResultItemDto
    : ReadDocumentsWithUpToSecondaryPropsSuccessResultItemDto
>

/** Subscribe to document updates for existing document state */
export function useDocumentSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  documentId: number | null,
  setDocument:
    | React.Dispatch<React.SetStateAction<ReadOneDocument<Scope>>>
    | React.Dispatch<React.SetStateAction<ReadOneDocument<Scope> | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      if (documentId === null || active === false) {
        return
      }
      try {
        const document = (await serverConnector.readDocument(
          { id: documentId },
          {
            scope: scope
          }
        )) as ReadOneDocument<Scope>
        setDocument(document)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить документ с идентификатором ${documentId}`
          )
        }
      }
    },
    [scope, documentId, setDocument, active]
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

/** Subscribe to document updates with initial load */
export function useDocument<Scope extends ReadOneResourceScope>(
  scope: Scope,
  documentId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [document, setDocument] = React.useState<ReadOneDocument<Scope> | null>(
    null
  )
  useDocumentSubscription(
    scope,
    documentId,
    setDocument,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return document
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

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
        if (active === false) {
          return
        }
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
    [scope, setDocuments, active]
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
