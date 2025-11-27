// Project
import { type FormTextFieldProps, FormTextField } from './form-text-field'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FormUrlFieldProps extends FormTextFieldProps {}

export function FormUrlField(props: FormUrlFieldProps) {
  return <FormTextField {...props} type={'url'} />
}
