// Project
import type { TagPrimary, DbcTertiary, TestPrimary } from '~/types'
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

export interface DbcViewerProps {
  tags: TagPrimary[] | null
  dbc: DbcTertiary
  tests: TestPrimary[] | null
}

export function DbcViewer({ tags, dbc, tests }: DbcViewerProps) {
  const notifier = useNotifier()

  const getConfigBlob = React.useCallback(async () => {
    try {
      const data = await serverConnector.readDbcConfig({
        id: dbc.id
      })
      return data
    } catch (error) {
      notifier.showError(error)
      return null
    }
  }, [dbc])

  return (
    <HorizontalTwoPartsContainer
      proportions="EQUAL"
      title={['Базовая конфигурация', `${dbc.code}`]}
    >
      <ColumnViewer>
        <ColumnViewerBlock title="основная информация">
          <ColumnViewerItem field="код" val={dbc.code} />
          <ColumnViewerItem field="название" val={dbc.name} />
          <ColumnViewerItem
            field="готовность"
            Icon={
              <FlagIcon
                flag={dbc.prepared}
                truePrompt="конфигурация загружена"
                falsePrompt="конфигурация не загружена"
              />
            }
          />
          {dbc.config !== null ? (
            <ColumnViewerFile
              id={dbc.id}
              field="конфигурация"
              name={`${dbc.code}`}
              size={dbc.config.size}
              format={dbc.config.format}
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
              href: `/tests/${test.id}`
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
          <ColumnViewerText text={dbc.description?.text} emptyText="нет" />
        </ColumnViewerBlock>
      </ColumnViewer>
    </HorizontalTwoPartsContainer>
  )
}
