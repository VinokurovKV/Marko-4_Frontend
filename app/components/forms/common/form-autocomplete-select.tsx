// // Project
// import { FormTextField } from './form-text-field'
// // React
// import * as React from 'react'
// // Material UI
// import { styled, useTheme } from '@mui/material/styles'
// import Autocomplete, {
//   type AutocompleteProps
// } from '@mui/material/Autocomplete'
// import FormHelperText from '@mui/material/FormHelperText'
// import FormControl from '@mui/material/FormControl'
// import InputLabel from '@mui/material/InputLabel'
// import MenuItem from '@mui/material/MenuItem'
// import Select, { type SelectProps } from '@mui/material/Select'
// // Other
// import capitalize from 'capitalize'

// export interface FormAutocompleteSelectProps<
//   Value extends number | string,
//   Multiple extends boolean | undefined,
//   DisableClearable extends boolean | undefined,
//   FreeSolo extends boolean | undefined,
//   ChipComponent extends React.ElementType = 'div'
// > extends AutocompleteProps<
//     Value,
//     Multiple,
//     DisableClearable,
//     FreeSolo,
//     ChipComponent
//   > {
//   name: string
//   label: string
//   titleForValue: Map<Value, string>
//   items: {
//     value: Value
//     title: string
//   }[]
//   value: Value
//   required?: boolean
//   helperText?: string
// }

// export function FormAutocompleteSelect<
//   Value extends number | string,
//   Multiple extends boolean | undefined,
//   DisableClearable extends boolean | undefined,
//   FreeSolo extends boolean | undefined,
//   ChipComponent extends React.ElementType = 'div'
// >(
//   props: FormAutocompleteSelectProps<
//     Value,
//     Multiple,
//     DisableClearable,
//     FreeSolo,
//     ChipComponent
//   >
// ) {
//   const options = React.useMemo(
//     () =>
//       props.items.map((item) => ({
//         label: item.title,
//         id: item.value
//       })),
//     [props.items]
//   )
//   const label = `${props.label}${props.required ? '\u2009*' : ''}`
//   return (
//     <Autocomplete
//       options={options}
//       value={props.value}
//       renderInput={(params) => <FormTextField {...params} label={label} />}
//     />
//   )
// }

// // export const InputLabelStyled = styled(InputLabel)({
// //   '&': {
// //     transform: 'translate(14px, 8.5px) scale(0.85)'
// //   },
// //   '&.Mui-focused, &.MuiFormLabel-filled': {
// //     transform: 'translate(14px, -7px) scale(0.65)'
// //   },
// //   '&:not(.Mui-focused):not(.MuiFormLabel-filled)': {
// //     opacity: 0.55
// //   }
// // })

// // export const SelectStyled = styled(Select<number>)({
// //   '& .MuiSelect-select': {
// //     height: '1.4375em !important',
// //     paddingTop: '8.0px !important',
// //     paddingBottom: '8.0px !important',
// //     fontSize: '0.85rem !important'
// //   },
// //   '& legend': {
// //     fontSize: '0.65rem !important'
// //   }
// // })

// // export const FormHelperTextStyled = styled(FormHelperText)({
// //   '&': {
// //     fontSize: '0.55rem !important',
// //     transform: 'translate(0, -4px) !important'
// //   }
// // })

// // export function FormAutocompleteSelect({
// //   required,
// //   helperText,
// //   items,
// //   ...props
// // }: FormAutocompleteSelectProps) {
// //   const theme = useTheme()
// //   const labelId = React.useMemo(() => Math.random().toString(), [props.name])
// //   const label = `${props.label}${required ? '\u2009*' : ''}`
// //   return (
// //     <FormControl size="small" sx={{ m: 1, minWidth: 120 }}>
// //       <InputLabelStyled
// //         id={labelId}
// //         color={props.error ? 'error' : undefined}
// //         sx={{ color: props.error ? theme.palette.error.main : undefined }}
// //       >
// //         {label}
// //       </InputLabelStyled>
// //       <SelectStyled
// //         {...props}
// //         label={label}
// //         labelId={labelId}
// //         fullWidth
// //         size="small"
// //         variant="outlined"
// //         color={props.error ? 'error' : undefined}
// //       >
// //         {items.map((item) => (
// //           <MenuItem value={item.value}>{capitalize(item.title)}</MenuItem>
// //         ))}
// //       </SelectStyled>
// //       <FormHelperTextStyled
// //         sx={{ color: props.error ? theme.palette.error.main : undefined }}
// //       >
// //         {helperText ?? ' '}
// //       </FormHelperTextStyled>
// //     </FormControl>
// //   )
// // }
