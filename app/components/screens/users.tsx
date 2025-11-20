// Project
import { type UsersGridProps, UsersGrid } from '../grids/users/users-grid'
// Material UI
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

export type UsersScreenProps = UsersGridProps

export function UsersScreen(props: UsersScreenProps) {
  return (
    <Stack spacing={2} p={4} sx={{ height: '100%' }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 'bold'
        }}
      >
        {capitalize('пользователи')}
      </Typography>
      <UsersGrid {...props} />
    </Stack>
  )
}
