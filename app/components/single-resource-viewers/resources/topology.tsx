// Project
import { calculateTopologyConfig } from '@common/utilities'
import type {
  TagPrimary,
  CommonTopologyTertiary,
  TopologyTertiary,
  TestPrimary
} from '~/types'
import {
  HorizontalTwoPartsContainer,
  VerticalTwoPartsContainer
} from '~/components/containers'
import { CommonTopologyHoverPreview } from '~/components/topologies/common-topology-hover-preview'
import { TopologyConfigSchema } from '~/components/topologies/topology-config-schema'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerItem,
  ColumnViewerRef,
  ColumnViewerText
} from '../common'
// React
import * as React from 'react'

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
  const topologyConfig = React.useMemo(() => {
    return commonTopology !== null && topology !== null
      ? calculateTopologyConfig(commonTopology.config, topology.vertexNames)
      : null
  }, [commonTopology, topology])
  return (
    <HorizontalTwoPartsContainer
      proportions="EQUAL"
      title={['Топология', `${topology.code}`]}
    >
      <ColumnViewer>
        <ColumnViewerBlock title="основная информация">
          <ColumnViewerItem field="код" val={topology.code} />
          <ColumnViewerItem field="название" val={topology.name} />
          <ColumnViewerRef
            field="общая топология"
            text={commonTopology?.code ?? '???'}
            href={`/common-topologies/${topology.commonTopologyId}`}
            hoverPreview={{
              renderContent: () => (
                <CommonTopologyHoverPreview
                  commonTopologyId={topology.commonTopologyId}
                  text={commonTopology?.code}
                />
              )
            }}
          />
          <ColumnViewerItem
            field="номер в общей топологии"
            val={topology.numInCommonTopology ?? undefined}
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
        <TopologyConfigSchema config={topologyConfig} nullConfigTitle="схема" />
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
  )
}
