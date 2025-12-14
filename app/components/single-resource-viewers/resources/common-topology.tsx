// Project
import type {
  TagPrimary,
  CommonTopologyTertiary,
  TopologyPrimary
} from '~/types'
import {
  HorizontalTwoPartsContainer,
  VerticalTwoPartsContainer
} from '~/components/containers'
import { TopologyConfigSchema } from '~/components/topologies/topology-config-schema'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerItem,
  ColumnViewerText
} from '../common'

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
  return (
    <HorizontalTwoPartsContainer
      proportions="EQUAL"
      title={['Общая топология', `${commonTopology.code}`]}
    >
      <ColumnViewer>
        <ColumnViewerBlock title="основная информация">
          <ColumnViewerItem field="код" val={commonTopology.code} />
          <ColumnViewerItem field="название" val={commonTopology.name} />
          <ColumnViewerItem
            field="номер"
            val={commonTopology.num ?? undefined}
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
  )
}
