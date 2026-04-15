// Project
import { useTestTemplate } from '~/hooks/resources'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { ColumnViewerFile } from '~/components/single-resource-viewers/common'
// React
import * as React from 'react'
// Material UI
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

const PREVIEW_WIDTH = 120

interface TestTemplateHoverPreviewProps {
  testTemplateId: number
  active: boolean
  text?: string
}

export function TestTemplateHoverPreview({
  testTemplateId,
  active
}: TestTemplateHoverPreviewProps) {
  const notifier = useNotifier()

  const testTemplate = useTestTemplate(
    'UP_TO_TERTIARY_PROPS',
    testTemplateId,
    false,
    active
  )

  const getConfigBlob = React.useCallback(
    async (id: number) => {
      try {
        const data = await serverConnector.readTestTemplateConfig({
          id: id
        })
        return data
      } catch (error) {
        notifier.showError(error)
        return null
      }
    },
    [notifier]
  )

  return (
    <Box sx={{ width: PREVIEW_WIDTH, p: 1 }}>
      {testTemplate === null ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={1.5}
          sx={{ width: '100%', minHeight: 100 }}
        >
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ opacity: 0.72 }}>
            Загрузка шаблона...
          </Typography>
        </Stack>
      ) : testTemplate.config !== null ? (
        <ColumnViewerFile
          id={testTemplate.id}
          field="конфигурация"
          name={testTemplate.code}
          size={testTemplate.config.size}
          format={testTemplate.config.format}
          getFileBlob={getConfigBlob}
        />
      ) : (
        <Typography variant="body2" sx={{ px: 0.5, pb: 0.5, opacity: 0.72 }}>
          Конфигурация не загружена.
        </Typography>
      )}
    </Box>
  )
}
