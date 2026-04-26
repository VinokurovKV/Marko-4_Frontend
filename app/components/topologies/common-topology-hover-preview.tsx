// Project
import { useCommonTopology } from '~/hooks/resources'
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

interface CommonTopologyHoverPreviewProps {
  commonTopologyId: number
  text?: string
  onReadyChange?: (ready: boolean) => void
}

export function CommonTopologyHoverPreview({
  commonTopologyId,
  text,
  onReadyChange
}: CommonTopologyHoverPreviewProps) {
  const commonTopology = useCommonTopology(
    'UP_TO_TERTIARY_PROPS',
    commonTopologyId,
    false
  )

  const title = React.useMemo(
    () =>
      capitalize(commonTopology?.code ?? text ?? 'схема общей топологии', true),
    [commonTopology, text]
  )
  const ready = commonTopology !== null

  React.useEffect(() => {
    onReadyChange?.(ready)
  }, [onReadyChange, ready])

  return (
    <Box sx={{ width: PREVIEW_WIDTH, p: 1.5 }}>
      <Typography variant="subtitle2" sx={{ px: 0.5, pb: 1, fontWeight: 700 }}>
        {title}
      </Typography>
      {commonTopology === null ? (
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
          config={commonTopology.config}
          nullConfigTitle="схема общей топологии"
          height={PREVIEW_HEIGHT}
        />
      )}
    </Box>
  )
}
