// Project
import { calculateTopologyConfig } from '@common/utilities'
import type {
  TagPrimary,
  CommonTopologyPrimary,
  CommonTopologyTertiary,
  TopologyTertiary,
  TestPrimary
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useDialogs } from '~/providers/dialogs'
import { readCommonTopologiesPrimary } from '~/readers'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { usePopupPreviewVisibilitySettings } from '~/hooks/popup-preview-visibility'
import {
  HorizontalTwoPartsContainer,
  VerticalTwoPartsContainer
} from '~/components/containers'
import { CommonTopologyHoverPreview } from '~/components/topologies/common-topology-hover-preview'
import { TopologyConfigSchema } from '~/components/topologies/topology-config-schema'
import { UpdateTopologyFormDialog } from '~/components/forms/resources/update-topology'
import {
  ColumnViewer,
  ColumnViewerActions,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
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

export interface TopologyViewerProps {
  tags: TagPrimary[] | null
  commonTopology: CommonTopologyTertiary | null
  topology: TopologyTertiary
  tests: TestPrimary[] | null
}

export function TopologyViewer({
  tags,
  commonTopology,
  topology,
  tests
}: TopologyViewerProps) {
  const { settings } = usePopupPreviewVisibilitySettings()
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
  const [efCommonTopologies, setEfCommonTopologies] = React.useState<
    CommonTopologyPrimary[]
  >([])
  const [updatedTopologyId, setUpdatedTopologyId] = React.useState<
    number | null
  >(null)

  const handleUpdateClick = React.useCallback(async () => {
    const [commonTopologies] = await Promise.all([
      readCommonTopologiesPrimary()
    ])
    setEfCommonTopologies(commonTopologies ?? [])
    setUpdatedTopologyId(topology.id)
  }, [topology])

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedTopologyId(null)
  }, [setUpdatedTopologyId])

  const handleDeleteClick = React.useCallback(async () => {
    const confirmText = `удалить топологию '${topology.code}'?`
    const confirmed = await dialogs.confirm(capitalize(confirmText, true), {
      severity: 'error',
      okText: 'Удалить',
      cancelText: 'Отменить'
    })
    if (confirmed) {
      try {
        await serverConnector.deleteTopology({
          id: topology.id
        })
        notifier.showSuccess(`топология «${topology.code}» удалена`)
        void navigate('/topologies')
      } catch (error) {
        notifier.showError(error)
      }
    }
  }, [navigate, dialogs, topology])

  const topologyConfig = React.useMemo(() => {
    return commonTopology !== null && topology !== null
      ? calculateTopologyConfig(commonTopology.config, topology.vertexNames)
      : null
  }, [commonTopology, topology])
  return (
    <>
      <HorizontalTwoPartsContainer
        proportions="EQUAL"
        title={['Топология', `${topology.code}`]}
      >
        <ColumnViewer>
          <ColumnViewerBlock title="действия">
            <ColumnViewerActions
              onUpdateClick={
                rightsSet.has('UPDATE_TOPOLOGY') ? handleUpdateClick : undefined
              }
              onDeleteClick={
                rightsSet.has('DELETE_TOPOLOGY') ? handleDeleteClick : undefined
              }
            />
          </ColumnViewerBlock>
          <ColumnViewerBlock title="основная информация">
            <ColumnViewerItem field="код" val={topology.code} />
            <ColumnViewerItem field="название" val={topology.name} />
            <ColumnViewerRef
              field="общая топология"
              text={commonTopology?.code ?? '???'}
              href={`/common-topologies/${topology.commonTopologyId}`}
              hoverPreview={
                settings.commonTopology
                  ? {
                      renderContent: (_active, onReadyChange) => (
                        <CommonTopologyHoverPreview
                          key={topology.commonTopologyId}
                          commonTopologyId={topology.commonTopologyId}
                          text={commonTopology?.code}
                          onReadyChange={onReadyChange}
                        />
                      )
                    }
                  : undefined
              }
            />
            <ColumnViewerItem
              field="номер в общей топологии"
              val={topology.numInCommonTopology ?? undefined}
            />
            <ColumnViewerRef
              field="история"
              text="ПЕРЕЙТИ"
              href={`/history/topologies/${topology.id}`}
            />
          </ColumnViewerBlock>
          <ColumnViewerBlock
            title={`вершины${topology.vertexesCount > 0 ? ` (${topology.vertexesCount})` : ''}`}
          >
            <ColumnViewerChipsBlock
              emptyText="нет"
              items={topology.vertexNames.map((vertexName) => {
                return {
                  text: vertexName
                }
              })}
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
        <VerticalTwoPartsContainer proportions="50_50">
          <TopologyConfigSchema
            config={topologyConfig}
            nullConfigTitle="схема"
          />
          <ColumnViewer>
            <ColumnViewerBlock title="описание">
              <ColumnViewerText
                text={topology.description?.text}
                emptyText="нет"
              />
            </ColumnViewerBlock>
          </ColumnViewer>
        </VerticalTwoPartsContainer>
      </HorizontalTwoPartsContainer>
      <UpdateTopologyFormDialog
        key={updatedTopologyId}
        commonTopologies={efCommonTopologies}
        topologyId={updatedTopologyId}
        setTopologyId={setUpdatedTopologyId}
        initialTopology={topology}
        onSuccessUpdateTopology={cancelUpdateForm}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
