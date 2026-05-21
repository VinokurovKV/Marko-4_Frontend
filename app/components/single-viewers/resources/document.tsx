// Project
import type { TagPrimary, DocumentTertiary, FragmentPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useLocationHash } from '~/hooks/use-location-hash'
import { useNotifier } from '~/providers/notifier'
import { localizationForDocumentType } from '~/localization'
import { formatDate } from '~/utilities'
import {
  HorizontalTwoPartsContainer,
  VerticalTwoPartsContainer
} from '~/components/containers'
import type { TabViewerProps } from '~/components/tab-viewer'
import { TabViewer } from '~/components/tab-viewer'
import { FormatIcon } from '~/components/grids/cols'
import { DocumentRequirementsGrid } from '~/components/grids/resources/document-requirements'
import { DocumentContentViewer } from '~/components/document-content/document-content-viewer'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerFile,
  ColumnViewerItem,
  ColumnViewerLinksBlock,
  ColumnViewerRef,
  ColumnViewerText
} from '../common'
// React
import * as React from 'react'
// Material UI
import Tab from '@mui/material/Tab'

function getFragmentDisplayName(fragment: FragmentPrimary) {
  return fragment.innerCode
}

function formatPageNumbers(pageNumbers: number[]) {
  if (pageNumbers.length === 0) return null

  const sorted = [...new Set(pageNumbers)].sort((a, b) => a - b)
  const ranges: string[] = []
  let rangeStart = sorted[0]
  let prev = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]

    if (current === prev + 1) {
      prev = current
      continue
    }

    ranges.push(rangeStart === prev ? `${rangeStart}` : `${rangeStart}-${prev}`)
    rangeStart = current
    prev = current
  }

  ranges.push(rangeStart === prev ? `${rangeStart}` : `${rangeStart}-${prev}`)

  return ranges.join(', ')
}

type TabVal = 'document' | 'coverage'
type Tab = TabViewerProps<TabVal>['tabs'][0]

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
  const [tabValue, setTabValue] = useLocationHash<TabVal>('document')
  const notifier = useNotifier()
  const [fragmentPagesForId, setFragmentPagesForId] = React.useState<
    Record<number, number[]>
  >({})
  const [browseAreaRequest, setBrowseAreaRequest] = React.useState<{
    areaId: number
    seq: number
  } | null>(null)
  const [previewAreaRequest, setPreviewAreaRequest] = React.useState<{
    areaId: number
    seq: number
  } | null>(null)
  const browseAreaRequestSeqRef = React.useRef(0)
  const previewAreaRequestSeqRef = React.useRef(0)
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

  const requestBrowseArea = React.useCallback((areaId: number) => {
    browseAreaRequestSeqRef.current += 1
    setBrowseAreaRequest({
      areaId,
      seq: browseAreaRequestSeqRef.current
    })
  }, [])

  const requestPreviewArea = React.useCallback((areaId: number) => {
    previewAreaRequestSeqRef.current += 1
    setPreviewAreaRequest({
      areaId,
      seq: previewAreaRequestSeqRef.current
    })
  }, [])

  const handleTabChange = React.useCallback(
    (event: React.SyntheticEvent, value: TabVal) => {
      setTabValue(value)
    },
    [setTabValue]
  )

  const tabs: Tab[] = React.useMemo(
    () => [
      {
        label: 'Текст',
        value: 'document'
      },
      {
        label: 'Покрытие',
        value: 'coverage'
      }
    ],
    []
  )

  return (
    <HorizontalTwoPartsContainer
      proportions="THREE_ONE"
      title={['Документ', `${document.code}`]}
    >
      <>
        <TabViewer tabs={tabs} onChange={handleTabChange} value={tabValue} />
        {tabValue === 'document' ? (
          <DocumentContentViewer
            document={document}
            onFragmentPagesChange={setFragmentPagesForId}
            previewAreaRequest={previewAreaRequest}
            browseAreaRequest={browseAreaRequest}
          />
        ) : (
          <DocumentRequirementsGrid document={document} />
        )}
      </>
      <VerticalTwoPartsContainer
        proportions={tabValue === 'document' ? '50_50' : '100_0'}
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
              fieldFull={`файл документа «${document.code}»`}
              name={document.code}
              size={document.config.size}
              format={document.config.format}
              getFileBlob={getConfigBlob}
              withBrowse
            />
            <ColumnViewerItem field="версия" val={document.publicVersion} />
            <ColumnViewerItem
              field="дата публикации"
              val={
                document.date !== null ? formatDate(document.date) : undefined
              }
            />
            <ColumnViewerRef
              field="источник"
              text={document.url ?? undefined}
              href={document.url !== null ? document.url : undefined}
              external={true}
            />
            <ColumnViewerRef
              field="история"
              text="ПЕРЕЙТИ"
              href={`/history/documents/${document.id}`}
            />
          </ColumnViewerBlock>
          <ColumnViewerBlock title="описание">
            <ColumnViewerText
              text={document.description?.text}
              emptyText="нет"
            />
          </ColumnViewerBlock>
          <ColumnViewerBlock
            title={`фрагменты${document.fragmentsCount > 0 ? ` (${document.fragmentsCount})` : ''}`}
          >
            <ColumnViewerChipsBlock
              emptyText={fragments !== null ? 'нет' : '???'}
              items={(fragments ?? []).map((fragment) => ({
                text: fragment.innerCode,
                onClick: () => requestPreviewArea(fragment.id),
                disableCapitalize: true
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
        {tabValue === 'document' ? (
          <ColumnViewer>
            <ColumnViewerBlock title="фрагменты">
              <ColumnViewerLinksBlock
                emptyText={fragments !== null ? 'нет' : '???'}
                items={(fragments ?? []).map((fragment) => ({
                  text: getFragmentDisplayName(fragment),
                  secondaryText: (() => {
                    const pagesText = formatPageNumbers(
                      fragmentPagesForId[fragment.id] ?? []
                    )

                    return pagesText !== null
                      ? `Страницы: ${pagesText}`
                      : undefined
                  })(),
                  onClick: () => requestBrowseArea(fragment.id),
                  disableCapitalize: true
                }))}
              />
            </ColumnViewerBlock>
          </ColumnViewer>
        ) : null}
      </VerticalTwoPartsContainer>
    </HorizontalTwoPartsContainer>
  )
}
