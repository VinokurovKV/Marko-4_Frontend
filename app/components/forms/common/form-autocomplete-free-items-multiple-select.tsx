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

export interface FormAutocompleteFreeItemsMultipleSelectProps<
  Value extends number | string
> {
  name: string
  freeItemsFieldName: string
  label: string
  possibleValues: Value[]
  titleForValue?: Map<Value, string>
  values: Value[]
  freeItems: string[]
  onChange: (event: { name: string; values: Value[] | undefined }) => void
  onChangeFreeItems: (event: {
    name: string
    items: string[] | undefined
  }) => void
  required?: boolean
  helperText?: string
  localizationForTitle?: Map<string, string>
  error?: boolean
}

export function FormAutocompleteFreeItemsMultipleSelect<
  Value extends number | string
>(props: FormAutocompleteFreeItemsMultipleSelectProps<Value>) {
  const theme = useTheme()

  const AutocompleteStyled = React.useMemo(
    () =>
      styled(Autocomplete<Value, true, false, true>)({
        '&.MuiAutocomplete-hasClearIcon > .MuiFormControl-root > label': {
          transform: 'translate(14px, -7px) scale(0.65)'
        }
      }),
    []
  )

  const possibleValuesSet = React.useMemo(
    () => new Set(props.possibleValues),
    [props.possibleValues]
  )

  const valueForTitle = React.useMemo(() => {
    if (props.titleForValue === undefined) {
      return undefined
    }
    const result = new Map<string, Value>()
    for (const [value, title] of props.titleForValue) {
      result.set(title, value)
    }
    return result
  }, [props.titleForValue])

  const handleChange = React.useCallback(
    (event: React.SyntheticEvent, values: (string | Value)[] | null) => {
      if (values === null) {
        props.onChange({
          name: props.name,
          values: undefined
        })
        props.onChangeFreeItems({
          name: props.freeItemsFieldName,
          items: undefined
        })
        return
      }
      const newValues: Value[] = []
      const newValuesSet = new Set<Value>()
      const newItems: string[] = []
      for (const value of values) {
        if (
          typeof value !== 'string' ||
          possibleValuesSet.has(value as Value)
        ) {
          if (newValuesSet.has(value as Value) === false) {
            newValues.push(value as Value)
            newValuesSet.add(value as Value)
          }
        } else {
          const valueForTitleCandidate = valueForTitle?.get(value)
          if (
            valueForTitleCandidate !== undefined &&
            possibleValuesSet.has(valueForTitleCandidate)
          ) {
            if (newValuesSet.has(valueForTitleCandidate) === false) {
              newValues.push(valueForTitleCandidate)
              newValuesSet.add(valueForTitleCandidate)
            }
          } else {
            newItems.push(value)
          }
        }
      }
      props.onChange({
        name: props.name,
        values: newValues.length > 0 ? newValues : undefined
      })
      props.onChangeFreeItems({
        name: props.freeItemsFieldName,
        items: newItems.length > 0 ? newItems : undefined
      })
    },
    [
      props.name,
      props.freeItemsFieldName,
      props.possibleValues,
      props.onChange,
      props.onChangeFreeItems,
      possibleValuesSet,
      valueForTitle
    ]
  )

  const valuesWithFreeItems = React.useMemo(
    () => [...props.values, ...props.freeItems],
    [props.values, props.freeItems]
  )

  const preparedLabel = `${props.label}${props.required ? '\u2009*' : ''}`

  return (
    <FormControl size="small" sx={{ m: 1, minWidth: 120 }}>
      <AutocompleteStyled
        multiple
        freeSolo
        autoSelect
        options={props.possibleValues}
        getOptionLabel={(value) => {
          const title =
            props.titleForValue?.get(value as Value) ?? value.toString()
          const localizedTitle = props.localizationForTitle?.get(title) ?? title
          return capitalize(localizedTitle, true)
        }}
        value={valuesWithFreeItems}
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
