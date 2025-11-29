// Project
import { useCommonTopology, useTopology } from '~/hooks/resources'
// React
import * as React from 'react'
// Material UI
import Container from '@mui/material/Container'

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
      ...commonTopology.config,
      vertexes: commonTopology.config.vertexes.filter((vertex) =>
        vertexNamesSet.has(vertex.name)
      )
    }
  }, [commonTopology, topology])

  return (
    <Container sx={{ height: '300px' }}>
      {JSON.stringify(topologyConfig)}
    </Container>
  )
}
