// Material UI
import { styled } from '@mui/material/styles'
import Button, { type ButtonProps } from '@mui/material/Button'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PrButtonProps extends Omit<ButtonProps, 'size'> {}

function PrButtonUnstyled(props: PrButtonProps) {
  return <Button {...props} size="small" />
}

export const PrButton = styled(PrButtonUnstyled)({
  '&.MuiButton-root': {
    textTransform: 'capitalize'
  }
})
