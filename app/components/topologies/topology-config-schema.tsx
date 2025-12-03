// Project
import type { CommonTopologyConfigDto } from '@common/dtos'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
// Material UI
import { useTheme } from '@mui/material/styles'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

type CommonTopologyConfig = DtoWithoutEnums<CommonTopologyConfigDto>

export interface TopologyConfigSchemaProps {
  config: CommonTopologyConfig | null
  nullConfigTitle: string
}

export function TopologyConfigSchema({
  config,
  nullConfigTitle
}: TopologyConfigSchemaProps) {
  const theme = useTheme()
  const palette = theme.palette
  const mode = theme.palette.mode

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
        {config !== null ? (
          JSON.stringify(config)
        ) : (
          // <TopologyViewer config={config} />
          <Typography sx={{ opacity: 0.55 }}>
            {capitalize(nullConfigTitle, true)}
          </Typography>
        )}
      </Stack>
    </Container>
  )
}
