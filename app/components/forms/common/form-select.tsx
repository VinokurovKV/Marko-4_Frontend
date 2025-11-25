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

export interface FormSelectProps
  extends Omit<
    SelectProps<number>,
    'variant' | 'size' | 'name' | 'labelId' | 'label' | 'helperText'
  > {
  name: string
  label: string
  items: {
    value: number
    title: string
  }[]
  helperText?: string
}

export const InputLabelStyled = styled(InputLabel)({
  '&': {
    transform: 'translate(14px, 8.5px) scale(0.85)'
  },
  '&.Mui-focused, &.MuiFormLabel-filled': {
    transform: 'translate(14px, -7px) scale(0.65)'
  },
  '&:not(.Mui-focused):not(.MuiFormLabel-filled)': {
    opacity: 0.55
  }
})

export const SelectStyled = styled(Select<number>)({
  '& .MuiSelect-select': {
    height: '1.4375em !important',
    paddingTop: '7.0px !important',
    paddingBottom: '9.0px !important',
    fontSize: '0.85rem !important'
  },
  '& legend': {
    fontSize: '0.65rem !important'
  }
})

export function FormSelect({
  required,
  helperText,
  items,
  ...props
}: FormSelectProps) {
  const theme = useTheme()
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
