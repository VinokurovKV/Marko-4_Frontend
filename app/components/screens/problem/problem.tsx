// Material UI
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import type { SvgIconOwnProps, SvgIconTypeMap } from '@mui/material/SvgIcon'
import Typography from '@mui/material/Typography'
import type { OverridableComponent } from '@mui/material/OverridableComponent'

export interface ProblemScreenProps {
  icon: {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Icon: OverridableComponent<SvgIconTypeMap<{}, 'svg'>> & {
      muiName: string
    }
    color: SvgIconOwnProps['color']
  }
  text: string
  actionButton?: {
    text: string
    onClick?: () => void
  }
}

export function ProblemScreen({
  icon,
  text,
  actionButton
}: ProblemScreenProps) {
  return (
    <Stack
      direction="column"
      justifyContent="center"
      alignItems="center"
      sx={{ height: '100vh' }}
    >
      <Card variant="elevation" raised={true} sx={{ m: 4 }}>
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <icon.Icon fontSize="large" color={icon.color} />
        </Box>
        <Divider variant="middle" />
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ textAlign: 'center' }}>
            {text}
          </Typography>
        </Box>
        <CardActions>
          {actionButton ? (
            <Button size="small" onClick={actionButton.onClick}>
              {actionButton.text}
            </Button>
          ) : null}
        </CardActions>
      </Card>
    </Stack>
  )
}
