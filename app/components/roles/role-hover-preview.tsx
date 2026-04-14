// Project
import { useRole } from '~/hooks/resources'
import { localizationForRight } from '~/localization'
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

interface RoleHoverPreviewProps {
  roleId: number
  active: boolean
  text?: string
}

export function RoleHoverPreview({
  roleId,
  active,
  text
}: RoleHoverPreviewProps) {
  const role = useRole('UP_TO_TERTIARY_PROPS', roleId, false, active)

  const title = React.useMemo(
    () => capitalize(role?.name ?? text ?? 'роль', true),
    [role, text]
  )

  return (
    <Box sx={{ width: PREVIEW_WIDTH, p: 1.5 }}>
      <Typography variant="subtitle2" sx={{ px: 0.5, pb: 1, fontWeight: 700 }}>
        {title}
      </Typography>
      {role === null ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={1.5}
          sx={{ width: '100%', minHeight: 120 }}
        >
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ opacity: 0.72 }}>
            Загрузка прав...
          </Typography>
        </Stack>
      ) : (
        <Box sx={{ maxHeight: PREVIEW_MAX_HEIGHT, overflowY: 'auto' }}>
          <ColumnViewerChipsBlock
            emptyText="нет"
            items={role.rights.map((right) => ({
              text: localizationForRight.get(right) ?? right
            }))}
          />
        </Box>
      )}
    </Box>
  )
}
