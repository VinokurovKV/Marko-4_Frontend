// Project
import { type FormTextFieldProps, FormTextField } from './form-text-field'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FormNumFieldProps extends FormTextFieldProps {}

export function FormNumField(props: FormNumFieldProps) {
  return <FormTextField {...props} /* type={'number'} */ />
}
