// Project
import { FormHelperTextStyled } from './form-helper-text'
// React
import * as React from 'react'
// Material UI
import { styled, useTheme } from '@mui/material/styles'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectProps } from '@mui/material/Select'
// Other
import capitalize from 'capitalize'

export interface FormSelectProps<Value extends number | string>
  extends Omit<
    SelectProps<Value>,
    'variant' | 'size' | 'name' | 'labelId' | 'label' | 'helperText'
  > {
  name: string
  label: string
  items: {
    value: Value
    title: string
  }[]
  helperText?: string
}

const InputLabelStyled = styled(InputLabel)({
  '&': {
    height: '32px', // '36px'
    fontSize: '0.85rem',
    transform: 'translate(13px, 6.5px)'
  },
  '&.Mui-focused, &.MuiFormLabel-filled': {
    transform: 'translate(14px, -6.5px) scale(0.65)'
  },
  '&:not(.Mui-focused):not(.MuiFormLabel-filled)': {
    opacity: 0.55
  }
})

export function FormSelect<Value extends number | string>({
  required,
  helperText,
  items,
  ...props
}: FormSelectProps<Value>) {
  const theme = useTheme()

  const SelectStyled = React.useMemo(
    () =>
      styled(Select<Value>)({
        '&': {
          height: '32px'
        },
        '& .MuiSelect-select': {
          // height: '2.4375em !important',
          paddingTop: '7.0px !important',
          paddingBottom: '9.0px !important',
          fontSize: '0.85rem !important'
        },
        '& legend': {
          fontSize: '0.54rem !important' // '0.65rem !important'
        }
      }),
    []
  )

  const labelId = React.useMemo(() => Math.random().toString(), [props.name])

  const label = `${props.label}${required ? '\u2009*' : ''}`

  return (
    <FormControl size="small" sx={{ m: 1, minWidth: 120 }}>
      <InputLabelStyled
        id={labelId}
        color={props.error ? 'error' : undefined}
        sx={{ color: props.error ? theme.palette.error.main : undefined }}
      >
        {label}
      </InputLabelStyled>
      <SelectStyled
        {...props}
        label={label}
        labelId={labelId}
        fullWidth
        size="small"
        variant="outlined"
        color={props.error ? 'error' : undefined}
      >
        {items.map((item) => (
          <MenuItem value={item.value}>{capitalize(item.title, true)}</MenuItem>
        ))}
      </SelectStyled>
      <FormHelperTextStyled
        sx={{ color: props.error ? theme.palette.error.main : undefined }}
      >
        {helperText ?? ' '}
      </FormHelperTextStyled>
    </FormControl>
  )
}
