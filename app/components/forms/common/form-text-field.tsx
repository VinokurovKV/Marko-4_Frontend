// Material UI
import { styled } from '@mui/material/styles'
import TextField, { type TextFieldProps } from '@mui/material/TextField'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FormTextFieldProps extends Omit<
  TextFieldProps<'outlined'>,
  'variant' | 'size'
> {}

function FormTextFieldUnstyled(props: FormTextFieldProps) {
  return <TextField {...props} fullWidth size="small" variant="outlined" />
}

export const FormTextField = styled(FormTextFieldUnstyled)({
  // '& .MuiInputBase-root': {
  //   height: '32px' // '36px'
  // },
  '& label': {
    fontSize: '0.85rem',
    transform: 'translate(13px, 6.5px)'
  },
  '& label.Mui-focused, & label.MuiFormLabel-filled': {
    transform: 'translate(14px, -6.5px) scale(0.65)'
  },
  '& label:not(.Mui-focused):not(.MuiFormLabel-filled)': {
    opacity: 0.55
  },
  '& .MuiFormHelperText-root': {
    fontSize: '0.54rem',
    transform: 'translate(0, -4px)'
  },
  '& .MuiInputBase-root legend': {
    fontSize: '0.54rem' // '0.65rem'
  },
  '& .MuiInputBase-input': {
    height: '15px',
    paddingTop: '8.0px',
    paddingBottom: '8.0px',
    fontSize: '0.85rem'
  }
})
