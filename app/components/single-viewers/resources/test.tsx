// Project
import { calculateTopologyConfig } from '@common/utilities'
import type {
  TagPrimary,
  DocumentPrimary,
  FragmentPrimary,
  RequirementPrimary,
  CommonTopologyTertiary,
  TopologyPrimary,
  TopologyTertiary,
  DbcPrimary,
  TestTemplatePrimary,
  TestTertiary,
  SubgroupPrimary,
  GroupPrimary,
  TaskPrimary
} from '~/types'
import { usePopupPreviewVisibilitySettings } from '~/hooks/popup-preview-visibility'
import { serverConnector } from '~/server-connector'
import { useLocationHash } from '~/hooks/use-location-hash'
import { useDialogs } from '~/providers/dialogs'
import {
  readTopologiesPrimary,
  readDbcsPrimary,
  readTestTemplatesPrimary,
  readSubgroupsPrimary
} from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { FlagIcon } from '~/components/icons'
import { MarkdownView } from '~/components/markdown-view'
import {
  ContainerWithTitle,
  HorizontalTwoPartsContainer,
  VerticalTwoPartsContainer
} from '~/components/containers'
import type { TabViewerProps } from '~/components/tab-viewer'
import { TabViewer } from '~/components/tab-viewer'
import { CommonTopologyHoverPreview } from '~/components/topologies/common-topology-hover-preview'
import { TopologyHoverPreview } from '~/components/topologies/topology-hover-preview'
import { TopologyConfigSchema } from '~/components/topologies/topology-config-schema'
import { type FormSelectProps, FormSelect } from '~/components/forms/common'
import { UpdateTestFormDialog } from '~/components/forms/resources/update-test'
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
import { useLocation, useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import type { SelectChangeEvent } from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

const FRAGMENT_SCREENSHOT_LOADER_DELAY_MS = 250

type TabVal = 'all' | 'description'
type Tab = TabViewerProps<TabVal>['tabs'][0]

export interface TestViewerProps {
  tags: TagPrimary[] | null
  documents: DocumentPrimary[] | null
  fragments: FragmentPrimary[] | null
  requirements: RequirementPrimary[] | null
  commonTopology: CommonTopologyTertiary | null
  topology: TopologyTertiary | null
  dbcs: DbcPrimary[] | null
  testTemplate: TestTemplatePrimary | null
  test: TestTertiary
  subgroup: SubgroupPrimary | null
  group: GroupPrimary | null
  tasks: TaskPrimary[] | null
}

export function TestViewer({
  tags,
  documents,
  fragments,
  requirements,
  commonTopology,
  topology,
  dbcs,
  testTemplate,
  test,
  subgroup,
  group,
  tasks
}: TestViewerProps) {
  const location = useLocation()
  const isHierarchyPath = location.pathname.startsWith('/hierarchy')
  const { settings } = usePopupPreviewVisibilitySettings()
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useLocationHash<TabVal>('all')
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet = React.useMemo(
    () =>
      meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet,
    [meta]
  )
  const dialogs = useDialogs()

  const [requirementId, setRequirementId] = React.useState<number | null>(null)
  const [selectedFragmentId, setSelectedFragmentId] = React.useState<
    number | null
  >(null)
  const [selectedFragmentScreenshotUrl, setSelectedFragmentScreenshotUrl] =
    React.useState<string | null>(null)
  const [isFragmentScreenshotLoading, setIsFragmentScreenshotLoading] =
    React.useState(false)
  const [showFragmentScreenshotLoader, setShowFragmentScreenshotLoader] =
    React.useState(false)
  const [fragmentScreenshotLoadError, setFragmentScreenshotLoadError] =
    React.useState(false)
  const screenshotRequestSeqRef = React.useRef(0)

  // Edit form states
  const [efTopologies, setEfTopologies] = React.useState<TopologyPrimary[]>([])
  const [efDbcs, setEfDbcs] = React.useState<DbcPrimary[]>([])
  const [efTestTemplates, setEfTestTemplates] = React.useState<
    TestTemplatePrimary[]
  >([])
  const [efSubgroups, setEfSubgroups] = React.useState<SubgroupPrimary[]>([])
  const [updatedTestId, setUpdatedTestId] = React.useState<number | null>(null)

  const handleTabChange = React.useCallback(
    (event: React.SyntheticEvent, value: TabVal) => {
      setTabValue(value)
    },
    [setTabValue]
  )

  const tabs: Tab[] = React.useMemo(
    () => [
      {
        label: 'Общее',
        value: 'all'
      },
      {
        label: 'Описание',
        value: 'description'
      }
    ],
    []
  )

  const documentCodeForId = React.useMemo(
    () =>
      new Map(
        (documents ?? []).map((document) => [document.id, document.code])
      ),
    [documents]
  )

  const fragmentForId = React.useMemo(
    () => new Map((fragments ?? []).map((fragment) => [fragment.id, fragment])),
    [fragments]
  )

  const requirementCodeForId = React.useMemo(
    () =>
      new Map(
        (requirements ?? []).map((requirement) => [
          requirement.id,
          requirement.code
        ])
      ),
    [requirements]
  )

  const dbcCodeForId = React.useMemo(
    () => new Map((dbcs ?? []).map((dbc) => [dbc.id, dbc.code])),
    [dbcs]
  )

  const getConfigBlob = React.useCallback(async () => {
    try {
      const data = await serverConnector.readTestConfig({
        id: test.id
      })
      return data
    } catch (error) {
      notifier.showError(error)
      return null
    }
  }, [test])

  const getDeltaBlob = React.useCallback(
    async (vertexIndex: number) => {
      try {
        const data = await serverConnector.readTestDelta({
          id: test.id,
          vertexName: test.vertexes[vertexIndex].vertexName
        })
        return data
      } catch (error) {
        notifier.showError(error)
        return null
      }
    },
    [test]
  )

  const getDbcConfigBlob = React.useCallback(
    async (dbcId: number) => {
      try {
        const data = await serverConnector.readDbcConfig({
          id: dbcId
        })
        return data
      } catch (error) {
        notifier.showError(error)
        return null
      }
    },
    [test]
  )

  const filteredDescriptionText = React.useMemo(() => {
    if (test.description?.text === undefined || test.description.text === '') {
      return null
    } else if (requirementId === null) {
      return test.description.text
      // .replaceAll('<ТР', '[ТР')
      // .replaceAll('ТР>', 'ТР]')
    }
    const requirementCode =
      requirementId !== null
        ? (requirementCodeForId.get(requirementId) ?? null)
        : null
    const text = test.description.text
    let preparedText = ''
    let currentPosition = 0
    while (true) {
      const startMarkerPosition = text.indexOf('<ТР', currentPosition)
      if (startMarkerPosition === -1) {
        preparedText += text.substring(currentPosition)
        return preparedText
      }
      preparedText += text.substring(currentPosition, startMarkerPosition)
      const newLinePosition = text.indexOf('\n', startMarkerPosition + 3)
      if (newLinePosition === -1) {
        return preparedText
      }
      const requirementsBlockWithColon = text
        .substring(newLinePosition, startMarkerPosition + 3)
        .trim()
      const requirementsBlock = requirementsBlockWithColon.substring(
        0,
        requirementsBlockWithColon.length - 1
      )
      const requirementCodes = requirementsBlock
        .split(',')
        .map((requirementCode) => requirementCode.trim())
      const endMarkerPosition = text.indexOf('ТР>', startMarkerPosition + 3)
      if (
        requirementCode !== null &&
        requirementCodes.includes(requirementCode)
      ) {
        if (endMarkerPosition === -1) {
          preparedText += text.substring(newLinePosition + 1)
          return preparedText
        }
        preparedText += text.substring(newLinePosition + 1, endMarkerPosition)
      }
      currentPosition = endMarkerPosition + 4
    }
  }, [test.description, requirementId, requirementCodeForId])

  // const handleRequirementChange = React.useCallback(
  //   (event: { name: string; value: number | undefined }) => {
  //     setRequirementId(event.value ?? null)
  //   },
  //   [setRequirementId]
  // )

  const handleRequirementChange = React.useCallback(
    (event: SelectChangeEvent<number | string>) => {
      setRequirementId(
        (event.target.value === '' ? null : (event.target.value ?? null)) as
          | number
          | null
      )
    },
    [setRequirementId]
  )

  const requirementSelectItemsWithEmpty: FormSelectProps<
    number | string
  >['items'] = React.useMemo(
    () => [
      { value: '', title: '— не выбрано —' },
      ...(requirements ?? []).map((requirement) => ({
        value: requirement.id,
        title: requirement.code
      }))
    ],
    [requirements]
  )

  const topologyConfig = React.useMemo(() => {
    return commonTopology !== null && topology !== null
      ? calculateTopologyConfig(commonTopology.config, topology.vertexNames)
      : null
  }, [commonTopology, topology])

  React.useEffect(() => {
    if (!isFragmentScreenshotLoading) {
      setShowFragmentScreenshotLoader(false)
      return
    }
    const timer = setTimeout(() => {
      setShowFragmentScreenshotLoader(true)
    }, FRAGMENT_SCREENSHOT_LOADER_DELAY_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [isFragmentScreenshotLoading])

  React.useEffect(() => {
    return () => {
      if (selectedFragmentScreenshotUrl !== null) {
        URL.revokeObjectURL(selectedFragmentScreenshotUrl)
      }
    }
  }, [selectedFragmentScreenshotUrl])

  const handleFragmentClick = React.useCallback(
    (fragmentId: number) => {
      if (selectedFragmentId === fragmentId) {
        screenshotRequestSeqRef.current += 1
        setSelectedFragmentId(null)
        setIsFragmentScreenshotLoading(false)
        setSelectedFragmentScreenshotUrl((oldUrl) => {
          if (oldUrl !== null) {
            URL.revokeObjectURL(oldUrl)
          }
          return null
        })
        return
      }

      const fragment = fragmentForId.get(fragmentId)
      if (fragment === undefined) {
        return
      }
      screenshotRequestSeqRef.current += 1
      const requestSeq = screenshotRequestSeqRef.current

      setSelectedFragmentId(fragmentId)
      setIsFragmentScreenshotLoading(true)
      setFragmentScreenshotLoadError(false)

      void (async () => {
        try {
          const blob = await serverConnector.readFragmentConfig({
            id: fragmentId
          })
          const screenshotUrl = URL.createObjectURL(blob)
          if (screenshotRequestSeqRef.current !== requestSeq) {
            URL.revokeObjectURL(screenshotUrl)
            return
          }

          setSelectedFragmentScreenshotUrl((oldUrl) => {
            if (oldUrl !== null) {
              URL.revokeObjectURL(oldUrl)
            }
            return screenshotUrl
          })
        } catch (error) {
          if (screenshotRequestSeqRef.current !== requestSeq) {
            return
          }
          notifier.showError(
            error,
            `не удалось загрузить скриншот фрагмента «${fragment.innerCode}»`
          )
          setSelectedFragmentScreenshotUrl((oldUrl) => {
            if (oldUrl !== null) {
              URL.revokeObjectURL(oldUrl)
            }
            return null
          })
        } finally {
          if (screenshotRequestSeqRef.current === requestSeq) {
            setIsFragmentScreenshotLoading(false)
          }
        }
      })()
    },
    [fragmentForId, notifier, selectedFragmentId]
  )

  const selectedFragment =
    selectedFragmentId !== null
      ? (fragmentForId.get(selectedFragmentId) ?? null)
      : null

  const handleUpdateClick = React.useCallback(async () => {
    const [topologies, dbcs, testTemplates, subgroups] = await Promise.all([
      readTopologiesPrimary(),
      readDbcsPrimary(),
      readTestTemplatesPrimary(),
      readSubgroupsPrimary()
    ])
    setEfTopologies(topologies ?? [])
    setEfDbcs(dbcs ?? [])
    setEfTestTemplates(testTemplates ?? [])
    setEfSubgroups(subgroups ?? [])
    setUpdatedTestId(test.id)
  }, [test])

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedTestId(null)
  }, [setUpdatedTestId])

  const handleDeleteClick = React.useCallback(async () => {
    const confirmText = `удалить тест '${test.code}'?`
    const confirmed = await dialogs.confirm(capitalize(confirmText, true), {
      severity: 'error',
      okText: 'Удалить',
      cancelText: 'Отменить'
    })
    if (confirmed) {
      try {
        await serverConnector.deleteTest({
          id: test.id
        })
        notifier.showSuccess(`тест «${test.code}» удален`)
        void navigate('/tests')
      } catch (error) {
        notifier.showError(error)
      }
    }
  }, [navigate, dialogs, test])

  return (
    <>
      <ContainerWithTitle title={['Тест', `${test.code}`]}>
        <TabViewer tabs={tabs} onChange={handleTabChange} value={tabValue} />
        {tabValue === 'all' ? (
          <HorizontalTwoPartsContainer proportions="EQUAL">
            <VerticalTwoPartsContainer proportions="50_50">
              <ColumnViewer>
                <ColumnViewerBlock title="вид навигации">
                  <ColumnViewerChipsBlock
                    items={[
                      {
                        text: 'таблица',
                        href: `/tests/${test.id}`
                      },
                      {
                        text: 'иерархия',
                        href: `/hierarchy/tests/${test.id}`
                      }
                    ]}
                  />
                </ColumnViewerBlock>
                <ColumnViewerBlock title="действия">
                  <ColumnViewerActions
                    onUpdateClick={
                      rightsSet.has('UPDATE_TEST')
                        ? handleUpdateClick
                        : undefined
                    }
                    onDeleteClick={
                      rightsSet.has('DELETE_TEST')
                        ? handleDeleteClick
                        : undefined
                    }
                  />
                </ColumnViewerBlock>
                <ColumnViewerBlock title="основная информация">
                  <ColumnViewerItem field="код" val={test.code} />
                  <ColumnViewerItem field="название" val={test.name ?? ''} />
                  <ColumnViewerItem
                    field="готовность"
                    Icon={
                      <FlagIcon
                        flag={test.prepared}
                        truePrompt="все необходимые конфигурации загружены"
                        falsePrompt="не все необходимые конфигурации загружены"
                      />
                    }
                  />
                  <ColumnViewerRef
                    field="группа"
                    text={group?.code}
                    href={
                      group !== null
                        ? `${isHierarchyPath ? '/hierarchy' : ''}/groups/${group.id}`
                        : undefined
                    }
                  />
                  <ColumnViewerRef
                    field="подгруппа"
                    text={subgroup?.code}
                    href={
                      test.subgroupId !== null
                        ? `${isHierarchyPath ? '/hierarchy' : ''}/subgroups/${test.subgroupId}`
                        : undefined
                    }
                  />
                  <ColumnViewerItem
                    field="номер в подгруппе"
                    val={test.numInSubgroup ?? undefined}
                  />
                  <ColumnViewerRef
                    field="общая топология"
                    text={commonTopology?.code ?? '???'}
                    href={
                      commonTopology !== null
                        ? `/common-topologies/${commonTopology?.id}`
                        : undefined
                    }
                    hoverPreview={
                      settings.commonTopology && commonTopology !== null
                        ? {
                            renderContent: (_active, onReadyChange) => (
                              <CommonTopologyHoverPreview
                                key={commonTopology.id}
                                commonTopologyId={commonTopology.id}
                                text={commonTopology.code}
                                onReadyChange={onReadyChange}
                              />
                            )
                          }
                        : undefined
                    }
                  />
                  <ColumnViewerRef
                    field="топология"
                    text={topology?.code ?? '???'}
                    href={`/topologies/${test.topologyId}`}
                    hoverPreview={
                      settings.topology && topology !== null
                        ? {
                            renderContent: (_active, onReadyChange) => (
                              <TopologyHoverPreview
                                key={topology.id}
                                topologyId={topology.id}
                                text={topology.code}
                                onReadyChange={onReadyChange}
                              />
                            )
                          }
                        : undefined
                    }
                  />
                  <ColumnViewerRef
                    field="шаблон"
                    text={testTemplate?.code}
                    href={
                      test.testTemplateId !== null
                        ? `/test-templates/${test.testTemplateId}`
                        : undefined
                    }
                  />
                  {test.config !== null ? (
                    <ColumnViewerFile
                      id={test.id}
                      field="конфигурация"
                      fieldFull={`конфигурация теста «${test.code}»`}
                      name={`${test.code}-config`}
                      size={test.config.size}
                      format={test.config.format}
                      getFileBlob={getConfigBlob}
                      withBrowse
                    />
                  ) : (
                    <ColumnViewerItem field="конфигурация" />
                  )}
                  <ColumnViewerRef
                    field="история"
                    text="ПЕРЕЙТИ"
                    href={`/history/tests/${test.id}`}
                  />
                </ColumnViewerBlock>
                {test.vertexes.map((vertex, vertexIndex) => (
                  <ColumnViewerBlock
                    key={vertex.vertexName}
                    title={`вершина ${vertex.vertexName}`}
                  >
                    <>
                      {vertex.dbcId !== null ? (
                        <>
                          <ColumnViewerRef
                            field="базовая конфигурация"
                            text={dbcCodeForId.get(vertex.dbcId) ?? '???'}
                            href={`/dbcs/${test.topologyId}`}
                          />
                          <ColumnViewerFile
                            id={vertexIndex}
                            fieldFull={`базовая конфигурация «${dbcCodeForId.get(vertex.dbcId) ?? '???'}»`}
                            name={`${dbcCodeForId.get(vertex.dbcId) ?? '???'}`}
                            format="ZIP"
                            getFileBlob={getDbcConfigBlob}
                            hideTitle
                            withBrowse
                          />
                        </>
                      ) : (
                        <ColumnViewerItem
                          field="базовая конфигурация"
                          val="нет"
                        />
                      )}
                      {vertex.delta !== null ? (
                        <ColumnViewerFile
                          id={vertexIndex}
                          field="delta-конфигурация"
                          fieldFull={`delta-конфигурация теста «${test.code}»`}
                          name={`${test.code}-${vertex.vertexName}-delta`}
                          size={vertex.delta.size}
                          format={vertex.delta.format}
                          getFileBlob={getDeltaBlob}
                          withBrowse
                        />
                      ) : (
                        <ColumnViewerItem
                          field="delta-конфигурация"
                          val="нет"
                        />
                      )}
                    </>
                  </ColumnViewerBlock>
                ))}
                <ColumnViewerBlock title="теги">
                  <ColumnViewerChipsBlock
                    emptyText={tags !== null ? 'нет' : '???'}
                    items={(tags ?? []).map((tag) => ({
                      text: tag.code,
                      href: `/tags/${tag.id}`
                    }))}
                  />
                </ColumnViewerBlock>
                <ColumnViewerBlock title="задания">
                  <ColumnViewerChipsBlock
                    emptyText={tasks !== null ? 'нет' : '???'}
                    items={(tasks ?? []).map((task) => ({
                      text: task.code,
                      href: `/tasks/${task.id}`
                    }))}
                  />
                </ColumnViewerBlock>
              </ColumnViewer>
              <TopologyConfigSchema
                config={topologyConfig}
                nullConfigTitle="схема топологии"
              />
            </VerticalTwoPartsContainer>
            <VerticalTwoPartsContainer proportions="45_55">
              <ColumnViewer>
                <Stack spacing={-2}>
                  <FormSelect
                    name="requirementId"
                    label="отображаемое в описании требование"
                    items={requirementSelectItemsWithEmpty}
                    value={requirementId ?? ''}
                    onChange={handleRequirementChange}
                  />
                </Stack>
                <ColumnViewerBlock title="покрываемые требования">
                  <ColumnViewerChipsBlock
                    emptyText="нет"
                    items={(requirements ?? []).map((requirement) => ({
                      text: requirement.code,
                      href: `/requirements/${requirement.id}`,
                      disableCapitalize: true
                    }))}
                  />
                </ColumnViewerBlock>
                <ColumnViewerBlock
                  title={`фрагменты документов${(fragments ?? []).length > 0 ? ` (${(fragments ?? []).length})` : ''}`}
                >
                  <ColumnViewerChipsBlock
                    emptyText="нет"
                    items={(fragments ?? []).map((fragment) => {
                      const documentCode =
                        documentCodeForId.get(fragment.documentId) ?? null
                      return {
                        text: `${documentCode ?? '???'} - ${fragment.innerCode}`,
                        onClick: () => handleFragmentClick(fragment.id),
                        isActive: selectedFragmentId === fragment.id,
                        disableCapitalize: true
                      }
                    })}
                  />
                </ColumnViewerBlock>
              </ColumnViewer>
              <ColumnViewer>
                {selectedFragmentId !== null ? (
                  <ColumnViewerBlock title="фрагмент">
                    <Box
                      flexDirection="column"
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        p: 1
                      }}
                    >
                      {selectedFragment !== null ? (
                        <ColumnViewerRef
                          field="документ"
                          text={
                            documentCodeForId.get(
                              selectedFragment.documentId
                            ) ?? '???'
                          }
                          href={
                            selectedFragment.documentId !== null
                              ? `/documents/${selectedFragment.documentId}?fragmentId=${selectedFragment.id}`
                              : undefined
                          }
                        />
                      ) : null}
                      {selectedFragmentScreenshotUrl !== null &&
                      fragmentScreenshotLoadError === false ? (
                        <Box
                          component="img"
                          src={selectedFragmentScreenshotUrl}
                          alt={
                            selectedFragment !== null
                              ? `Скриншот фрагмента ${selectedFragment.innerCode}`
                              : 'Скриншот фрагмента'
                          }
                          sx={{
                            width: '100%',
                            height: 'auto',
                            objectFit: 'contain',
                            borderRadius: 1
                          }}
                        />
                      ) : fragmentScreenshotLoadError ? (
                        <Typography textAlign="center" variant="body2">
                          файл фрагмента не удалось отобразить как изображение
                        </Typography>
                      ) : (
                        <Typography textAlign="center" variant="body2">
                          загрузка скриншота...
                        </Typography>
                      )}
                      {isFragmentScreenshotLoading &&
                      showFragmentScreenshotLoader ? (
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <CircularProgress size={24} />
                        </Box>
                      ) : null}
                    </Box>
                  </ColumnViewerBlock>
                ) : (
                  <ColumnViewerBlock title="описание">
                    {filteredDescriptionText !== null ? (
                      <MarkdownView text={filteredDescriptionText} />
                    ) : (
                      <ColumnViewerText emptyText="нет" />
                    )}
                  </ColumnViewerBlock>
                )}
              </ColumnViewer>
            </VerticalTwoPartsContainer>
          </HorizontalTwoPartsContainer>
        ) : (
          <ColumnViewer>
            <ColumnViewerBlock title="описание">
              {filteredDescriptionText !== null ? (
                <MarkdownView text={filteredDescriptionText} />
              ) : (
                <ColumnViewerText emptyText="нет" />
              )}
            </ColumnViewerBlock>
          </ColumnViewer>
        )}
      </ContainerWithTitle>
      <UpdateTestFormDialog
        key={updatedTestId}
        topologies={efTopologies}
        dbcs={efDbcs}
        testTemplates={efTestTemplates}
        subgroups={efSubgroups}
        testId={updatedTestId}
        setTestId={setUpdatedTestId}
        initialTest={test}
        onSuccessUpdateTest={cancelUpdateForm}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
