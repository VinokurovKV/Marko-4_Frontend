// Project
import type {
  TagPrimary,
  CommonTopologyTertiary,
  TopologyPrimary
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useDialogs } from '~/providers/dialogs'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  HorizontalTwoPartsContainer,
  VerticalTwoPartsContainer
} from '~/components/containers'
import { TopologyConfigSchema } from '~/components/topologies/topology-config-schema'
import { UpdateCommonTopologyFormDialog } from '~/components/forms/resources/update-common-topology'
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

export interface CommonTopologyViewerProps {
  tags: TagPrimary[] | null
  commonTopology: CommonTopologyTertiary
  topologies: TopologyPrimary[] | null
}

export function CommonTopologyViewer({
  tags,
  commonTopology,
  topologies
}: CommonTopologyViewerProps) {
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
  const [updatedCommonTopologyId, setUpdatedCommonTopologyId] = React.useState<
    number | null
  >(null)

  const handleUpdateClick = React.useCallback(() => {
    setUpdatedCommonTopologyId(commonTopology.id)
    return Promise.resolve()
  }, [commonTopology])

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedCommonTopologyId(null)
  }, [setUpdatedCommonTopologyId])

  const handleDeleteClick = React.useCallback(async () => {
    const confirmText = `удалить общую топологию '${commonTopology.code}'?`
    const confirmed = await dialogs.confirm(capitalize(confirmText, true), {
      severity: 'error',
      okText: 'Удалить',
      cancelText: 'Отменить'
    })
    if (confirmed) {
      try {
        await serverConnector.deleteCommonTopology({
          id: commonTopology.id
        })
        notifier.showSuccess(`общая топология «${commonTopology.code}» удалена`)
        void navigate('/common-topologies')
      } catch (error) {
        notifier.showError(error)
      }
    }
  }, [navigate, dialogs, commonTopology])

  return (
    <>
      <HorizontalTwoPartsContainer
        proportions="EQUAL"
        title={['Общая топология', `${commonTopology.code}`]}
      >
        <ColumnViewer>
          <ColumnViewerBlock title="действия">
            <ColumnViewerActions
              onUpdateClick={
                rightsSet.has('UPDATE_COMMON_TOPOLOGY')
                  ? handleUpdateClick
                  : undefined
              }
              onDeleteClick={
                rightsSet.has('DELETE_COMMON_TOPOLOGY')
                  ? handleDeleteClick
                  : undefined
              }
            />
          </ColumnViewerBlock>
          <ColumnViewerBlock title="основная информация">
            <ColumnViewerItem field="код" val={commonTopology.code} />
            <ColumnViewerItem field="название" val={commonTopology.name} />
            <ColumnViewerItem
              field="номер"
              val={commonTopology.num ?? undefined}
            />
            <ColumnViewerRef
              field="история"
              text="ПЕРЕЙТИ"
              href={`/history/common-topologies/${commonTopology.id}`}
            />
          </ColumnViewerBlock>
          <ColumnViewerBlock
            title={`вершины${commonTopology.vertexesCount > 0 ? ` (${commonTopology.vertexesCount})` : ''}`}
          >
            <ColumnViewerChipsBlock
              emptyText="нет"
              items={commonTopology.vertexNames.map((vertexName) => {
                return {
                  text: vertexName
                }
              })}
            />
          </ColumnViewerBlock>
          <ColumnViewerBlock
            title={`топологии${commonTopology.topologiesCount > 0 ? ` (${commonTopology.topologiesCount})` : ''}`}
          >
            <ColumnViewerChipsBlock
              emptyText={topologies !== null ? 'нет' : '???'}
              items={(topologies ?? []).map((topology) => ({
                text: topology.code,
                href: `/topologies/${topology.id}`
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
            config={commonTopology.config}
            nullConfigTitle="схема"
          />
          <ColumnViewer>
            <ColumnViewerBlock title="описание">
              <ColumnViewerText
                text={commonTopology.description?.text}
                emptyText="нет"
              />
            </ColumnViewerBlock>
          </ColumnViewer>
        </VerticalTwoPartsContainer>
      </HorizontalTwoPartsContainer>
      <UpdateCommonTopologyFormDialog
        key={updatedCommonTopologyId}
        commonTopologyId={updatedCommonTopologyId}
        setCommonTopologyId={setUpdatedCommonTopologyId}
        initialCommonTopology={commonTopology}
        onSuccessUpdateCommonTopology={cancelUpdateForm}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
