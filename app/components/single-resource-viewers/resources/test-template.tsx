// Project
import type { TagPrimary, TestTemplateTertiary, TestPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { FlagIcon } from '~/components/icons'
import { HorizontalTwoPartsContainer } from '~/components/containers'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerFile,
  ColumnViewerItem,
  ColumnViewerText
} from '../common'
// React
import * as React from 'react'

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
  const notifier = useNotifier()

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
    <HorizontalTwoPartsContainer
      proportions="EQUAL"
      title={['Шаблон', `${testTemplate.code}`]}
    >
      <ColumnViewer>
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
              name={`${testTemplate.code}`}
              size={testTemplate.config.size}
              format={testTemplate.config.format}
              getFileBlob={getConfigBlob}
            />
          ) : (
            <ColumnViewerItem field="конфигурация" />
          )}
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
  )
}
