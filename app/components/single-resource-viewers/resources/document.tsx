// Project
import type { TagPrimary, DocumentTertiary, FragmentPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { localizationForDocumentType } from '~/localization'
import { formatDate } from '~/utilities'
import { HorizontalTwoPartsContainer } from '~/components/containers'
import { FormatIcon } from '~/components/grids/cols'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerFile,
  ColumnViewerItem,
  ColumnViewerRef,
  ColumnViewerText
} from '../common'
// React
import * as React from 'react'

export interface DocumentViewerProps {
  tags: TagPrimary[] | null
  document: DocumentTertiary
  fragments: FragmentPrimary[] | null
}

export function DocumentViewer({
  tags,
  document,
  fragments
}: DocumentViewerProps) {
  const notifier = useNotifier()
  const getConfigBlob = React.useCallback(async () => {
    try {
      const data = await serverConnector.readDocumentConfig({
        id: document.id
      })
      return data
    } catch (error) {
      notifier.showError(error)
      return null
    }
  }, [document])

  return (
    <HorizontalTwoPartsContainer
      proportions="EQUAL"
      title={['Документ', `${document.code}`]}
    >
      <ColumnViewer>
        <ColumnViewerBlock title="основная информация">
          <ColumnViewerItem field="код" val={document.code} />
          <ColumnViewerItem field="название" val={document.name} />
          <ColumnViewerItem
            field="тип"
            val={localizationForDocumentType.get(document.type)}
          />
          <ColumnViewerItem
            field="формат"
            Icon={<FormatIcon format={document.format} />}
          />
          <ColumnViewerFile
            id={0}
            field="файл"
            name={document.code}
            size={document.config.size}
            format={document.config.format}
            getFileBlob={getConfigBlob}
          />
          <ColumnViewerItem field="версия" val={document.publicVersion} />
          <ColumnViewerItem
            field="дата публикации"
            val={document.date !== null ? formatDate(document.date) : undefined}
          />
          <ColumnViewerRef
            field="источник"
            text={document.url ?? undefined}
            href={document.url !== null ? document.url : undefined}
            external={true}
          />
        </ColumnViewerBlock>
        <ColumnViewerBlock
          title={`фрагменты${document.fragmentsCount > 0 ? ` (${document.fragmentsCount})` : ''}`}
        >
          <ColumnViewerChipsBlock
            emptyText={fragments !== null ? 'нет' : '???'}
            items={(fragments ?? []).map((fragment) => ({
              text: fragment.innerCode,
              href: `/fragments/${fragment.id}`
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
          <ColumnViewerText text={document.description?.text} emptyText="нет" />
        </ColumnViewerBlock>
      </ColumnViewer>
    </HorizontalTwoPartsContainer>
  )
}
