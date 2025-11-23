// Project
import { type FormTextFieldProps, FormTextField } from './form-text-field'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FormEmailFieldProps extends FormTextFieldProps {}

export function FormEmailField(props: FormEmailFieldProps) {
  return <FormTextField {...props} type={'email'} />
}
