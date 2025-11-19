// Material UI
import Typography from '@mui/material/Typography'

export function BrandLabel() {
  return (
    <Typography
      variant="h5"
      color="primary"
      sx={{
        fontWeight: 'bold',
        textAlign: 'center',
        transform: 'translate(0, 1px)'
      }}
    >
      {'марко-4'.toUpperCase()}
    </Typography>
  )
}
