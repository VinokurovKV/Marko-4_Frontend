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
import { useChangeDetector } from '../change-detector'
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

function useTestTemplateSubscriptionInner<Scope extends ReadOneResourceScope>(
  scope: Scope,
  testTemplateId: number | null,
  setTestTemplatePair: React.Dispatch<
    React.SetStateAction<{
      testTemplateId: number | null
      testTemplate?: ReadOneTestTemplate<Scope> | null
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
      if (testTemplateId === null) {
        setTestTemplatePair((oldPair) =>
          oldPair.testTemplateId === null
            ? { ...oldPair, testTemplate: null }
            : oldPair
        )
        return
      }
      try {
        const testTemplate = (await serverConnector.readTestTemplate(
          { id: testTemplateId },
          {
            scope: scope
          }
        )) as ReadOneTestTemplate<Scope>
        setTestTemplatePair((oldPair) =>
          oldPair.testTemplateId === testTemplateId
            ? {
                ...oldPair,
                testTemplate: testTemplate
              }
            : oldPair
        )
      } catch {
        if (notifyAboutProblems) {
          notifier.showWarning(
            `не удалось загрузить шаблон теста с идентификатором ${testTemplateId}`
          )
        }
      }
    },
    [scope, testTemplateId, setTestTemplatePair, notifier]
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
    detectedObjects: [testTemplateId, active],
    otherDependencies: [notifyAboutInitialLoadProblems, load],
    onChange: () => {
      if (active) {
        void load(notifyAboutInitialLoadProblems)
      }
    }
  })

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

/** Subscribe to testTemplate updates for existing testTemplate state */
export function useTestTemplateSubscription<Scope extends ReadOneResourceScope>(
  scope: Scope,
  testTemplateId: number | null,
  setTestTemplate: React.Dispatch<
    React.SetStateAction<ReadOneTestTemplate<Scope> | null>
  >,
  withInitialLoad: boolean = false,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [testTemplatePair, setTestTemplatePair] = React.useState<{
    testTemplateId: number | null
    testTemplate?: ReadOneTestTemplate<Scope> | null
  }>({
    testTemplateId: testTemplateId,
    testTemplate: undefined
  })
  React.useEffect(() => {
    setTestTemplatePair((oldPair) => ({
      testTemplateId: testTemplateId,
      testTemplate: oldPair.testTemplate
    }))
  }, [testTemplateId, setTestTemplatePair])
  useTestTemplateSubscriptionInner(
    scope,
    testTemplatePair.testTemplateId,
    setTestTemplatePair,
    withInitialLoad,
    notifyAboutInitialLoadProblems,
    active
  )
  React.useEffect(() => {
    if (testTemplatePair.testTemplate !== undefined) {
      setTestTemplate(testTemplatePair.testTemplate)
    }
  }, [setTestTemplate, testTemplatePair.testTemplate])
}

/** Subscribe to testTemplate updates with initial load */
export function useTestTemplate<Scope extends ReadOneResourceScope>(
  scope: Scope,
  testTemplateId: number | null,
  notifyAboutInitialLoadProblems: boolean = false,
  active: boolean = true
) {
  const [testTemplatePair, setTestTemplatePair] = React.useState<{
    testTemplateId: number | null
    testTemplate?: ReadOneTestTemplate<Scope> | null
  }>({
    testTemplateId: testTemplateId,
    testTemplate: null
  })
  React.useEffect(() => {
    setTestTemplatePair((oldPair) => ({
      testTemplateId: testTemplateId,
      testTemplate: oldPair.testTemplate
    }))
  }, [testTemplateId, setTestTemplatePair])
  useTestTemplateSubscriptionInner(
    scope,
    testTemplatePair.testTemplateId,
    setTestTemplatePair,
    true,
    notifyAboutInitialLoadProblems,
    active
  )
  return testTemplatePair.testTemplate ?? null
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

  const [initialized, setInitialized] = React.useState(false)

  const load = React.useCallback(
    async (notifyAboutProblems: boolean) => {
      try {
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
    [scope, setTestTemplates, notifier]
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
