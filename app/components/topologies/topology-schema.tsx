// Project
import { calculateTopologyConfig } from '@common/utilities'
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
    return commonTopology !== null && topology !== null
      ? calculateTopologyConfig(commonTopology.config, topology.vertexNames)
      : null
  }, [commonTopology, topology])

  return (
    <TopologyConfigSchema
      config={topologyConfig}
      nullConfigTitle="схема топологии"
    />
  )
}
