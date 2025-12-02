// Project
import { useCommonTopology, useTopology } from '~/hooks/resources'
import { TopologyViewer } from './topology-viewer'
// React
import * as React from 'react'
// Material UI
import { useTheme } from '@mui/material/styles'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'

export interface TopologySchemaProps {
  topologyId: number | null
}

export function TopologySchema({ topologyId }: TopologySchemaProps) {
  const theme = useTheme()
  const palette = theme.palette
  const mode = theme.palette.mode

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

  //JSON.stringify(topologyConfig)

  return (
    <Container sx={{ height: '300px', p: '0 !important' }}>
      <Stack
        height="100%"
        alignItems="center"
        justifyContent="center"
        sx={{
          border: `1.5px dashed ${mode === 'light' ? palette.grey['A400'] : palette.grey['600']}`,
          p: 1
        }}
      >
        {topologyConfig !== null ? (
          <TopologyViewer config={topologyConfig} />
        ) : (
          'Схема топологии'
        )}
      </Stack>
    </Container>
  )
}
