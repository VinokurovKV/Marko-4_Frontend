// Material UI
import { styled } from '@mui/material/styles'
import Button, { type ButtonProps } from '@mui/material/Button'
// Other
import capitalize from 'capitalize'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ProjButtonProps extends Omit<ButtonProps, 'size'> {}

function ProjButtonUnstyled(props: ProjButtonProps) {
  return (
    <Button
      {...props}
      children={
        typeof props.children === 'string'
          ? capitalize(props.children, true)
          : props.children
      }
      size="small"
    />
  )
}

export const ProjButton = styled(ProjButtonUnstyled)({
  '&.MuiButton-root': {
    textTransform: 'none'
  }
})
