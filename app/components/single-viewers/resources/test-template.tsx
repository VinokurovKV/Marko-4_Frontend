// Project
import type { TagPrimary, TestTemplateTertiary, TestPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useDialogs } from '~/providers/dialogs'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { FlagIcon } from '~/components/icons'
import { HorizontalTwoPartsContainer } from '~/components/containers'
import { UpdateTestTemplateFormDialog } from '~/components/forms/resources/update-test-template'
import {
  ColumnViewer,
  ColumnViewerActions,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerFile,
  ColumnViewerItem,
  ColumnViewerRef,
  ColumnViewerText
} from '../common'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Other
import capitalize from 'capitalize'

export interface TestTemplateViewerProps {
  tags: TagPrimary[] | null
  testTemplate: TestTemplateTertiary
  tests: TestPrimary[] | null
}

export function TestTemplateViewer({
  tags,
  testTemplate,
  tests
}: TestTemplateViewerProps) {
  const navigate = useNavigate()
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet = React.useMemo(
    () =>
      meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet,
    [meta]
  )
  const dialogs = useDialogs()

  // Edit form states
  const [updatedTestTemplateId, setUpdatedTestTemplateId] = React.useState<
    number | null
  >(null)

  const handleUpdateClick = React.useCallback(() => {
    setUpdatedTestTemplateId(testTemplate.id)
    return Promise.resolve()
  }, [testTemplate])

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedTestTemplateId(null)
  }, [setUpdatedTestTemplateId])

  const handleDeleteClick = React.useCallback(async () => {
    const confirmText = `удалить шаблон '${testTemplate.code}'?`
    const confirmed = await dialogs.confirm(capitalize(confirmText, true), {
      severity: 'error',
      okText: 'Удалить',
      cancelText: 'Отменить'
    })
    if (confirmed) {
      try {
        await serverConnector.deleteTestTemplate({
          id: testTemplate.id
        })
        notifier.showSuccess(`шаблон «${testTemplate.code}» удален`)
        void navigate('/test-templates')
      } catch (error) {
        notifier.showError(error)
      }
    }
  }, [navigate, dialogs, testTemplate])

  const getConfigBlob = React.useCallback(async () => {
    try {
      const data = await serverConnector.readTestTemplateConfig({
        id: testTemplate.id
      })
      return data
    } catch (error) {
      notifier.showError(error)
      return null
    }
  }, [testTemplate])

  return (
    <>
      <HorizontalTwoPartsContainer
        proportions="EQUAL"
        title={['Шаблон', `${testTemplate.code}`]}
      >
        <ColumnViewer>
          <ColumnViewerBlock title="действия">
            <ColumnViewerActions
              onUpdateClick={
                rightsSet.has('UPDATE_TEST_TEMPLATE')
                  ? handleUpdateClick
                  : undefined
              }
              onDeleteClick={
                rightsSet.has('DELETE_TEST_TEMPLATE')
                  ? handleDeleteClick
                  : undefined
              }
            />
          </ColumnViewerBlock>
          <ColumnViewerBlock title="основная информация">
            <ColumnViewerItem field="код" val={testTemplate.code} />
            <ColumnViewerItem field="название" val={testTemplate.name} />
            <ColumnViewerItem
              field="готовность"
              Icon={
                <FlagIcon
                  flag={testTemplate.prepared}
                  truePrompt="конфигурация загружена"
                  falsePrompt="конфигурация не загружена"
                />
              }
            />
            {testTemplate.config !== null ? (
              <ColumnViewerFile
                id={testTemplate.id}
                field="конфигурация"
                fieldFull={`конфигурация шаблона «${testTemplate.code}»`}
                name={`${testTemplate.code}`}
                size={testTemplate.config.size}
                format={testTemplate.config.format}
                getFileBlob={getConfigBlob}
                withBrowse
              />
            ) : (
              <ColumnViewerItem field="конфигурация" />
            )}
            <ColumnViewerRef
              field="история"
              text="ПЕРЕЙТИ"
              href={`/history/test-templates/${testTemplate.id}`}
            />
          </ColumnViewerBlock>
          <ColumnViewerBlock
            title={`тесты${tests !== null && tests.length > 0 ? ` (${tests.length})` : ''}`}
          >
            <ColumnViewerChipsBlock
              emptyText={tests !== null ? 'нет' : '???'}
              items={(tests ?? []).map((test) => ({
                text: test.code,
                href: `/hierarchy/tests/${test.id}`
              }))}
            />
          </ColumnViewerBlock>
          <ColumnViewerBlock title="теги">
            <ColumnViewerChipsBlock
              emptyText={tags !== null ? 'нет' : '???'}
              items={(tags ?? []).map((tag) => ({
                text: tag.code,
                href: `/tags/${tag.id}`
              }))}
            />
          </ColumnViewerBlock>
        </ColumnViewer>
        <ColumnViewer>
          <ColumnViewerBlock title="описание">
            <ColumnViewerText
              text={testTemplate.description?.text}
              emptyText="нет"
            />
          </ColumnViewerBlock>
        </ColumnViewer>
      </HorizontalTwoPartsContainer>
      <UpdateTestTemplateFormDialog
        key={updatedTestTemplateId}
        testTemplateId={updatedTestTemplateId}
        setTestTemplateId={setUpdatedTestTemplateId}
        initialTestTemplate={testTemplate}
        onSuccessUpdateTestTemplate={cancelUpdateForm}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
