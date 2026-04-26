// Project
import { useSubgroup, useTestsFiltered } from '~/hooks/resources'
import { ColumnViewerChipsBlock } from '~/components/single-resource-viewers/common'
// React
import * as React from 'react'
// Material UI
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

const PREVIEW_WIDTH = 420
const PREVIEW_MAX_HEIGHT = 260

interface SubgroupHoverPreviewProps {
  subgroupId: number
  active: boolean
  text?: string
  onReadyChange?: (ready: boolean) => void
}

export function SubgroupHoverPreview({
  subgroupId,
  active,
  text,
  onReadyChange
}: SubgroupHoverPreviewProps) {
  const subgroup = useSubgroup(
    'UP_TO_TERTIARY_PROPS',
    subgroupId,
    false,
    active
  )

  const tests = useTestsFiltered(
    'PRIMARY_PROPS',
    subgroup?.testIds ?? null,
    null,
    false,
    active && subgroup !== null
  )

  const title = React.useMemo(
    () => capitalize(subgroup?.code ?? text ?? 'подгруппа', true),
    [subgroup, text]
  )
  const ready = subgroup !== null && tests !== null

  React.useEffect(() => {
    onReadyChange?.(ready)
  }, [onReadyChange, ready])

  return (
    <Box sx={{ width: PREVIEW_WIDTH, p: 1.5 }}>
      <Typography variant="subtitle2" sx={{ px: 0.5, pb: 1, fontWeight: 700 }}>
        {title}
      </Typography>
      {subgroup === null || tests === null ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={1.5}
          sx={{ width: '100%', minHeight: 120 }}
        >
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ opacity: 0.72 }}>
            Загрузка тестов...
          </Typography>
        </Stack>
      ) : (
        <Box sx={{ maxHeight: PREVIEW_MAX_HEIGHT, overflowY: 'auto' }}>
          <ColumnViewerChipsBlock
            emptyText="нет"
            items={tests.map((test) => ({
              text: test.code,
              href: `/hierarchy/tests/${test.id}`
            }))}
          />
        </Box>
      )}
    </Box>
  )
}
