// Project
import type { ReadOneResourceScope, ReadManyResourceScope } from '@common/enums'
import type {
  ReadTestTemplateWithPrimaryPropsSuccessResultDto,
  ReadTestTemplateWithUpToSecondaryPropsSuccessResultDto,
  ReadTestTemplateWithUpToTertiaryPropsSuccessResultDto,
  ReadTestTemplateWithAllPropsSuccessResultDto,
  ReadTestTemplatesWithPrimaryPropsSuccessResultItemDto,
  ReadTestTemplatesWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/test-templates.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'

type ReadOneTestTemplate<Scope extends ReadOneResourceScope> = DtoWithoutEnums<
  Scope extends 'PRIMARY_PROPS'
    ? ReadTestTemplateWithPrimaryPropsSuccessResultDto
    : Scope extends 'UP_TO_SECONDARY_PROPS'
      ? ReadTestTemplateWithUpToSecondaryPropsSuccessResultDto
      : Scope extends 'UP_TO_TERTIARY_PROPS'
        ? ReadTestTemplateWithUpToTertiaryPropsSuccessResultDto
        : ReadTestTemplateWithAllPropsSuccessResultDto
>

type ReadManyTestTemplate<Scope extends ReadManyResourceScope> =
  DtoWithoutEnums<
    Scope extends 'PRIMARY_PROPS'
      ? ReadTestTemplatesWithPrimaryPropsSuccessResultItemDto
      : ReadTestTemplatesWithUpToSecondaryPropsSuccessResultItemDto
  >

/** Subscribe to testTemplate updates for existing testTemplate state */
export function useTestTemplateSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  testTemplateId: number | null,
  setTestTemplate:
    | React.Dispatch<React.SetStateAction<ReadOneTestTemplate<Scope>>>
    | React.Dispatch<React.SetStateAction<ReadOneTestTemplate<Scope> | null>>,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const notifier = useNotifier()

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      if (testTemplateId === null || active === false) {
        return
      }
      try {
        const testTemplate = (await serverConnector.readTestTemplate(
          { id: testTemplateId },
          {
            scope: scope
          }
        )) as ReadOneTestTemplate<Scope>
        setTestTemplate(testTemplate)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить шаблон теста с идентификатором ${testTemplateId}`
          )
        }
      }
    },
    [scope, testTemplateId, setTestTemplate, active]
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
    if (testTemplateId === null) {
      return
    }
    const subscriptionId = serverConnector.subscribeToResource(
      {
        type: 'TEST_TEMPLATE',
        resourceConfig: {
          id: testTemplateId
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
  }, [scope, testTemplateId, load])
}

/** Subscribe to testTemplate updates with initial load */
export function useTestTemplate<Scope extends ReadOneResourceScope>(
  scope: Scope,
  testTemplateId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [testTemplate, setTestTemplate] =
    React.useState<ReadOneTestTemplate<Scope> | null>(null)
  useTestTemplateSubscription(
    scope,
    testTemplateId,
    setTestTemplate,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return testTemplate
}

/** Subscribe to testTemplates updates for existing testTemplates state */
export function useTestTemplatesSubscription<
  Scope extends ReadManyResourceScope
>(
  scope: Scope,
  setTestTemplates:
    | React.Dispatch<React.SetStateAction<ReadManyTestTemplate<Scope>[]>>
    | React.Dispatch<
        React.SetStateAction<ReadManyTestTemplate<Scope>[] | null>
      >,
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
        const testTemplates = (await serverConnector.readTestTemplates({
          scope: scope
        })) as ReadManyTestTemplate<Scope>[]
        setTestTemplates(testTemplates)
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            'не удалось загрузить актуальный список шаблонов тестов'
          )
        }
      }
    },
    [scope, setTestTemplates, active]
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
        type: 'TEST_TEMPLATE'
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

/** Subscribe to testTemplates updates with initial load */
export function useTestTemplates<Scope extends ReadManyResourceScope>(
  scope: Scope,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [testTemplates, setTestTemplates] = React.useState<
    ReadManyTestTemplate<Scope>[] | null
  >(null)
  useTestTemplatesSubscription(
    scope,
    setTestTemplates,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return testTemplates
}
