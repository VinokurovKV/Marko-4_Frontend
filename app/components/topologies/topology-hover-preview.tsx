// Project
import { calculateTopologyConfig } from '@common/utilities'
import { useCommonTopology, useTopology } from '~/hooks/resources'
import { TopologyConfigSchema } from './topology-config-schema'
// React
import * as React from 'react'
// Material UI
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

const PREVIEW_WIDTH = 360
const PREVIEW_HEIGHT = 220

interface TopologyHoverPreviewProps {
  topologyId: number
  text?: string
}

export function TopologyHoverPreview({
  topologyId,
  text
}: TopologyHoverPreviewProps) {
  const topology = useTopology('UP_TO_TERTIARY_PROPS', topologyId, false)

  const commonTopology = useCommonTopology(
    'UP_TO_TERTIARY_PROPS',
    topology?.commonTopologyId ?? null,
    false
  )

  const title = React.useMemo(
    () => capitalize(topology?.code ?? text ?? 'схема топологии', true),
    [topology, text]
  )

  const topologyConfig = React.useMemo(() => {
    return topology !== null && commonTopology !== null
      ? calculateTopologyConfig(commonTopology.config, topology.vertexNames)
      : null
  }, [topology, commonTopology])

  return (
    <Box sx={{ width: PREVIEW_WIDTH, p: 1.5 }}>
      <Typography variant="subtitle2" sx={{ px: 0.5, pb: 1, fontWeight: 700 }}>
        {title}
      </Typography>
      {topologyConfig === null ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={1.5}
          sx={{ width: '100%', height: PREVIEW_HEIGHT }}
        >
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ opacity: 0.72 }}>
            Загрузка схемы...
          </Typography>
        </Stack>
      ) : (
        <TopologyConfigSchema
          config={topologyConfig}
          nullConfigTitle="схема топологии"
          height={PREVIEW_HEIGHT}
        />
      )}
    </Box>
  )
}
