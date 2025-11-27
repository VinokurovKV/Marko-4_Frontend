// Project
import { FormHelperTextStyled } from './form-helper-text'
// React
import * as React from 'react'
// Material UI
import { styled, useTheme } from '@mui/material/styles'
import type { PickerValidDate } from '@mui/x-date-pickers/models'
import type {} from '@mui/x-date-pickers/AdapterDayjs'
import {
  type DatePickerProps,
  DatePicker
} from '@mui/x-date-pickers/DatePicker'
import FormControl from '@mui/material/FormControl'
// Other
import dayjs from 'dayjs'

export interface FormDateProps
  extends Omit<DatePickerProps, 'name' | 'label' | 'value' | 'onChange'> {
  name: string
  label: string
  value: Date | null
  onChange: (event: { name: string; value: Date | undefined }) => void
  required?: boolean
  helperText?: string
  error?: boolean
}

export const DatePickerStyled = styled(DatePicker)(({ theme }) => ({
  '& > .MuiFormLabel-root': {
    transform: 'translate(14px, 8.5px) scale(0.85)'
  },
  '& > .MuiFormLabel-root.Mui-focused, & > .MuiFormLabel-root.MuiFormLabel-filled':
    {
      transform: 'translate(14px, -7px) scale(0.65)'
    },
  '& > .MuiFormLabel-root:not(.Mui-focused):not(.MuiFormLabel-filled)': {
    opacity: 0.55
  },
  '&.error > .MuiFormLabel-root': {
    color: theme.palette.error.main
  },
  '&.error > .MuiPickersInputBase-root > .MuiPickersOutlinedInput-notchedOutline':
    {
      borderColor: `${theme.palette.error.main} !important`
    },
  '& .MuiPickersInputBase-root': {
    height: '36px'
  },
  '& legend': {
    fontSize: '0.65rem !important'
  }
}))

export function FormDate({
  value,
  onChange,
  required,
  helperText,
  error,
  ...props
}: FormDateProps) {
  const theme = useTheme()

  const handleChange = React.useCallback(
    (value: PickerValidDate | null) => {
      onChange({
        name: props.name,
        value: value === null ? undefined : value.toDate()
      })
    },
    [props.name, onChange]
  )

  const preparedLabel = `${props.label}${required ? '\u2009*' : ''}`

  return (
    <FormControl size="small" sx={{ m: 1, minWidth: 120 }}>
      <DatePickerStyled
        {...props}
        className={error ? 'error' : undefined}
        label={preparedLabel}
        value={value !== null ? dayjs(value) : null}
        onChange={handleChange}
        slotProps={{ field: { clearable: true } }}
      />
      <FormHelperTextStyled
        sx={{ color: error ? theme.palette.error.main : undefined }}
      >
        {helperText ?? ' '}
      </FormHelperTextStyled>
    </FormControl>
  )
}
