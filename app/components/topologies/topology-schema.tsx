// Project
import { useCommonTopology, useTopology } from '~/hooks/resources'
import { TopologyConfigSchema } from './topology-config-schema'
// React
import * as React from 'react'

export interface TopologySchemaProps {
  topologyId: number | null
}

export function TopologySchema({ topologyId }: TopologySchemaProps) {
  const topology = useTopology('UP_TO_TERTIARY_PROPS', topologyId, true)

  const commonTopology = useCommonTopology(
    'UP_TO_TERTIARY_PROPS',
    topology?.commonTopologyId ?? null,
    true
  )

  const topologyConfig = React.useMemo(() => {
    if (commonTopology === null || topology === null) {
      return null
    }
    const vertexNamesSet = new Set(topology.vertexNames)
    return {
      vertexes: commonTopology.config.vertexes.filter((vertex) =>
        vertexNamesSet.has(vertex.name)
      ),
      links: commonTopology.config.links.filter(
        (link) =>
          vertexNamesSet.has(link.start.vertexName) &&
          vertexNamesSet.has(link.end.vertexName)
      )
    }
  }, [commonTopology, topology])

  return (
    <TopologyConfigSchema
      config={topologyConfig}
      nullConfigTitle="схема топологии"
    />
  )
}
