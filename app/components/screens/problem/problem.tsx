// Project
import { ScreenCard } from '../../cards/screen-card'
import { IsolatedScreenContainer } from '../../containers/isolated-screen-container'
// Material UI
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CardActions from '@mui/material/CardActions'
import Divider from '@mui/material/Divider'
import type { OverridableComponent } from '@mui/material/OverridableComponent'
import type { SvgIconOwnProps, SvgIconTypeMap } from '@mui/material/SvgIcon'
import Typography from '@mui/material/Typography'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type Icon = OverridableComponent<SvgIconTypeMap<{}, 'svg'>> & {
  muiName: string
}

export interface ProblemScreenProps {
  icon: {
    Icon: Icon
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
    <IsolatedScreenContainer>
      <ScreenCard>
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
      </ScreenCard>
    </IsolatedScreenContainer>
  )
}

// export function ProblemScreen({
//   icon,
//   text,
//   actionButton
// }: ProblemScreenProps) {
//   return (
//     <Stack
//       direction="column"
//       justifyContent="center"
//       alignItems="center"
//       sx={{ height: '100vh' }}
//     >
//       <Card variant="elevation" raised={true} sx={{ m: 4 }}>
//         <Box sx={{ p: 2, textAlign: 'center' }}>
//           <icon.Icon fontSize="large" color={icon.color} />
//         </Box>
//         <Divider variant="middle" />
//         <Box sx={{ p: 2 }}>
//           <Typography variant="h6" sx={{ textAlign: 'center' }}>
//             {text}
//           </Typography>
//         </Box>
//         <CardActions>
//           {actionButton ? (
//             <Button size="small" onClick={actionButton.onClick}>
//               {actionButton.text}
//             </Button>
//           ) : null}
//         </CardActions>
//       </Card>
//     </Stack>
//   )
// }
