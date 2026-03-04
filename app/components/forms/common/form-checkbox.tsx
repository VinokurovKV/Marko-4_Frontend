// Material UI
import { styled } from '@mui/material/styles'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox, { type CheckboxProps } from '@mui/material/Checkbox'
import Container from '@mui/material/Container'

export interface FormCheckboxProps extends Omit<
  CheckboxProps,
  'variant' | 'size'
> {
  label: string
}

export const FormControlLabelStyled = styled(FormControlLabel)({
  '&.MuiFormControlLabel-root': {
    userSelect: 'none'
  },
  '& > .MuiFormControlLabel-label': {
    opacity: 0.55
  }
})

export function FormCheckbox(props: FormCheckboxProps) {
  return (
    <Container
      sx={{
        height: '25px',
        paddingLeft: '0px !important',
        transform: 'translateY(-10px)'
      }}
    >
      <FormControlLabelStyled
        control={<Checkbox {...props} />}
        label={props.label}
      />
    </Container>
  )
}
