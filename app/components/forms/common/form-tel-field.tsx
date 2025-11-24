// Project
import { type FormTextFieldProps, FormTextField } from './form-text-field'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FormTelFieldProps extends FormTextFieldProps {}

export function FormTelField(props: FormTelFieldProps) {
  return <FormTextField {...props} type={'tel'} />
}
