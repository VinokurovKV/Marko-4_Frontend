// Project
import { type FormTextFieldProps, FormTextField } from './form-text-field'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FormMultilineTextFieldProps
  extends Omit<FormTextFieldProps, 'multiline'> {}

export function FormMultilineTextField(props: FormMultilineTextFieldProps) {
  return <FormTextField {...props} multiline />
}
