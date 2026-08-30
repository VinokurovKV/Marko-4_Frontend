// Project
import type { TagPrimary, DocumentTertiary, FragmentPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useLocationHash } from '~/hooks/use-location-hash'
import { useDialogs } from '~/providers/dialogs'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
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
import { UpdateDocumentFormDialog } from '~/components/forms/resources/update-document'
import {
  ColumnViewer,
  ColumnViewerActions,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerFile,
  ColumnViewerItem,
  ColumnViewerLinksBlock,
  ColumnViewerRef,
  ColumnViewerText
} from '../common'
// React router
import { useLocation, useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import Tab from '@mui/material/Tab'
// Other
import capitalize from 'capitalize'

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
  browseFragmentId?: number | null
}

export function DocumentViewer({
  tags,
  document,
  fragments,
  browseFragmentId = null
}: DocumentViewerProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const meta = useMeta()
  const rightsSet = React.useMemo(
    () =>
      meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet,
    [meta]
  )
  const dialogs = useDialogs()

  // Edit form states
  const [updatedDocumentId, setUpdatedDocumentId] = React.useState<
    number | null
  >(null)

  const handleUpdateClick = React.useCallback(() => {
    setUpdatedDocumentId(document.id)
    return Promise.resolve()
  }, [document])

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedDocumentId(null)
  }, [setUpdatedDocumentId])

  const handleDeleteClick = React.useCallback(async () => {
    const confirmText = `удалить документ '${document.code}'?`
    const confirmed = await dialogs.confirm(capitalize(confirmText, true), {
      severity: 'error',
      okText: 'Удалить',
      cancelText: 'Отменить'
    })
    if (confirmed) {
      try {
        await serverConnector.deleteDocument({
          id: document.id
        })
        notifier.showSuccess(`документ «${document.code}» удален`)
        void navigate('/documents')
      } catch (error) {
        notifier.showError(error)
      }
    }
  }, [navigate, dialogs, document])

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
  const [activeFragmentId, setActiveFragmentId] = React.useState<number | null>(
    null
  )
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
  }, [document.id, notifier])

  const getConfigPDFBlob = React.useCallback(async () => {
    try {
      const data = await serverConnector.readDocumentConfigPDF({
        id: document.id
      })
      return data
    } catch (error) {
      notifier.showError(error)
      return null
    }
  }, [document.id, notifier])

  const requestBrowseArea = React.useCallback((areaId: number) => {
    browseAreaRequestSeqRef.current += 1
    setActiveFragmentId(areaId)
    setBrowseAreaRequest({
      areaId,
      seq: browseAreaRequestSeqRef.current
    })
  }, [])
  const handledInitialBrowseRequestKeyRef = React.useRef<string | null>(null)

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

  React.useEffect(() => {
    if (browseFragmentId === null) return
    if (
      !(fragments ?? []).some((fragment) => fragment.id === browseFragmentId)
    ) {
      return
    }

    setTabValue('document')
    if (tabValue !== 'document') return

    const pagesForFragment = fragmentPagesForId[browseFragmentId] ?? []
    if (pagesForFragment.length === 0) return

    const requestKey = `${location.key}:${browseFragmentId}`
    if (handledInitialBrowseRequestKeyRef.current === requestKey) return

    handledInitialBrowseRequestKeyRef.current = requestKey
    requestBrowseArea(browseFragmentId)
  }, [
    browseFragmentId,
    fragmentPagesForId,
    fragments,
    location.key,
    requestBrowseArea,
    setTabValue,
    tabValue
  ])

  return (
    <>
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
              onActiveAreaChange={setActiveFragmentId}
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
            <ColumnViewerBlock title="действия">
              <ColumnViewerActions
                onUpdateClick={
                  rightsSet.has('UPDATE_DOCUMENT')
                    ? handleUpdateClick
                    : undefined
                }
                onDeleteClick={
                  rightsSet.has('DELETE_DOCUMENT')
                    ? handleDeleteClick
                    : undefined
                }
              />
            </ColumnViewerBlock>
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
                getBrowseFileBlob={getConfigPDFBlob}
                browseFormat="PDF"
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
                    isActive: activeFragmentId === fragment.id,
                    disableCapitalize: true
                  }))}
                />
              </ColumnViewerBlock>
            </ColumnViewer>
          ) : null}
        </VerticalTwoPartsContainer>
      </HorizontalTwoPartsContainer>
      <UpdateDocumentFormDialog
        key={updatedDocumentId}
        documentId={updatedDocumentId}
        setDocumentId={setUpdatedDocumentId}
        initialDocument={document}
        onSuccessUpdateDocument={cancelUpdateForm}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
