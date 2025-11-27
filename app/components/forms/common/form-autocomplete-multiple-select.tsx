// Project
import { FormHelperTextStyled } from './form-helper-text'
import { FormTextField } from './form-text-field'
// React
import * as React from 'react'
// Material UI
import { styled, useTheme } from '@mui/material/styles'
import Autocomplete from '@mui/material/Autocomplete'
import FormControl from '@mui/material/FormControl'
// Other
import capitalize from 'capitalize'

export interface FormAutocompleteMultipleSelectProps<
  Value extends number | string
> {
  name: string
  label: string
  possibleValues: Value[]
  titleForValue?: Map<Value, string>
  values: Value[]
  onChange: (event: { name: string; values: Value[] | undefined }) => void
  required?: boolean
  helperText?: string
  localizationForTitle?: Map<string, string>
  error?: boolean
}

export function FormAutocompleteMultipleSelect<Value extends number | string>(
  props: FormAutocompleteMultipleSelectProps<Value>
) {
  const theme = useTheme()

  const AutocompleteStyled = React.useMemo(
    () =>
      styled(Autocomplete<Value, true, false, false>)({
        '&.MuiAutocomplete-hasClearIcon > .MuiFormControl-root > label': {
          transform: 'translate(14px, -7px) scale(0.65)'
        }
        // '& .MuiInputBase-root': {
        //   height: '36px'
        // }
      }),
    []
  )

  const handleChange = React.useCallback(
    (event: React.SyntheticEvent, values: Value[] | null) => {
      props.onChange({
        name: props.name,
        values: values === null ? undefined : values
      })
    },
    [props.name, props.onChange]
  )

  const preparedLabel = `${props.label}${props.required ? '\u2009*' : ''}`

  return (
    <FormControl size="small" sx={{ m: 1, minWidth: 120 }}>
      <AutocompleteStyled
        multiple
        options={props.possibleValues}
        getOptionLabel={(value) => {
          const title = props.titleForValue?.get(value) ?? value.toString()
          const localizedTitle = props.localizationForTitle?.get(title) ?? title
          return capitalize(localizedTitle, true)
        }}
        value={props.values}
        onChange={handleChange}
        renderInput={(params) => (
          <FormTextField
            {...params}
            error={props.error}
            label={preparedLabel}
          />
        )}
      />
      <FormHelperTextStyled
        sx={{ color: props.error ? theme.palette.error.main : undefined }}
      >
        {props.helperText ?? ' '}
      </FormHelperTextStyled>
    </FormControl>
  )
}
