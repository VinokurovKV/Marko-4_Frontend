// Project
import { type FormTextFieldProps, FormTextField } from './form-text-field'
// Material UI
import { styled } from '@mui/material/styles'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FormMultilineTextFieldProps
  extends Omit<FormTextFieldProps, 'multiline'> {}

export const FormTextFieldStyled = styled(FormTextField)({
  '& .MuiInputBase-root': {
    height: 'unset'
  }
})

export function FormMultilineTextField(props: FormMultilineTextFieldProps) {
  return <FormTextFieldStyled {...props} multiline maxRows={10} />
}
