// Material UI
import { styled } from '@mui/material/styles'
import Select, { type SelectProps } from '@mui/material/Select'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FormSelectProps
  extends Omit<SelectProps<'outlined'>, 'variant' | 'size'> {}

function FormSelectUnstyled(props: FormSelectProps) {
  return <Select {...props} fullWidth size="small" variant="outlined" />
}

export const FormSelect = styled(FormSelectUnstyled)({})
