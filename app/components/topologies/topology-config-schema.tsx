// Project
import type { CommonTopologyConfig } from '~/types'
import { TopologyViewer } from './topology-viewer'
// React
import * as React from 'react'
// Material UI
import { useTheme } from '@mui/material/styles'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

const EMPTY_VERTEX_NAME_PROMPT = 'БЕЗЫМЯННАЯ ВЕРШИНА'
const EMPTY_IFACE_NAME_PROMPT = 'БЕЗЫМЯННЫЙ ИНТЕРФЕЙС'

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

  const validatedConfig: CommonTopologyConfig | null = React.useMemo(
    () =>
      config !== null && config.vertexes.length > 0
        ? (() => {
            const vertexIfaceNamesSetForVertexName = new Map(
              config.vertexes.map((vertex) => [
                vertex.name,
                new Set(vertex.ifaces.map((iface) => iface.name))
              ])
            )
            return {
              vertexes: config.vertexes.map((vertex) => ({
                ...vertex,
                name:
                  vertex.name.trim() !== ''
                    ? vertex.name
                    : EMPTY_VERTEX_NAME_PROMPT,
                ifaces: vertex.ifaces.map((iface) => ({
                  ...iface,
                  name:
                    iface.name.trim() !== ''
                      ? iface.name
                      : EMPTY_IFACE_NAME_PROMPT
                }))
              })),
              links: config.links.filter((link) => {
                const startVertexName = link.start.vertexName
                const endVertexName = link.end.vertexName
                const startIfaceName = link.start.ifaceName
                const endIfaceName = link.end.ifaceName
                if (
                  startVertexName.trim() === '' ||
                  endVertexName.trim() === '' ||
                  startIfaceName.trim() === '' ||
                  endIfaceName.trim() === ''
                ) {
                  return false
                }
                const startVertexIfaceNamesSet =
                  vertexIfaceNamesSetForVertexName.get(link.start.vertexName)
                const endVertexIfaceNamesSet =
                  vertexIfaceNamesSetForVertexName.get(link.end.vertexName)
                return (
                  startVertexIfaceNamesSet !== undefined &&
                  endVertexIfaceNamesSet !== undefined &&
                  startVertexIfaceNamesSet.has(startIfaceName) &&
                  endVertexIfaceNamesSet.has(endIfaceName)
                )
              })
            }
          })()
        : null,
    [config]
  )

  return (
    <Container sx={{ maxHeight: '100%', height: '400px', p: '0 !important' }}>
      <Stack
        height="100%"
        alignItems="center"
        justifyContent="center"
        sx={{
          border: `1.5px dashed ${mode === 'light' ? palette.grey['A400'] : palette.grey['600']}`,
          p: 1
        }}
      >
        {validatedConfig !== null ? (
          <TopologyViewer config={validatedConfig} showButtons={false} />
        ) : (
          //JSON.stringify(config)
          // <TopologyViewer config={config} />
          <Typography sx={{ opacity: 0.55 }}>
            {capitalize(nullConfigTitle, true)}
          </Typography>
        )}
      </Stack>
    </Container>
  )
}
