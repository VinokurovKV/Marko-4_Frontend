// Project
import {
  ServerConnectorBadRequestError,
  ServerConnectorConflictError,
  ServerConnectorForbiddenError,
  ServerConnectorIseError,
  ServerConnectorNotFoundError,
  ServerConnectorUnauthorizedError,
  ServerConnectorError
} from '~/server-connector/error'
import type {
  FormData,
  FormKey,
  FormVal,
  FormValidatorErrorsJoined,
  FormValidator
} from '~/validation/form-validator'
import { ProjButton } from '~/components/buttons/button'
// React
import * as React from 'react'
// Material UI
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

type Field<Data extends FormData> = FormKey<Data>
type Val<Data extends FormData> = FormVal<Data>
type Errors<Data extends FormData> = FormValidatorErrorsJoined<Data>
type State<Data extends FormData> = {
  data: Data
  errors: Errors<Data> | null
}

export interface UseFormProps<Data extends FormData, SubmitActionResult> {
  INITIAL_FORM_DATA: Data
  validator: FormValidator<Data>
  // Method must throws if action is unsuccessful
  submitAction: (validatedData: Data) => Promise<SubmitActionResult>
  onSuccessSubmit?: (submitActionResult: SubmitActionResult) => void
}

export function useForm<Data extends FormData, SubmitActionResult>(
  props: UseFormProps<Data, SubmitActionResult>
) {
  const [state, setState] = React.useState<State<Data>>({
    data: props.INITIAL_FORM_DATA,
    errors: {}
  })
  const [withSubmitAttempts, setWithSubmitAttempts] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitActionError, setSubmitActionError] = React.useState<
    string | null
  >(null)

  const { data, errors } = state

  const updateErrors = React.useCallback(
    (errors: Errors<Data>) => {
      setState((oldState) => {
        return {
          data: oldState.data,
          errors: errors
        }
      })
    },
    [setState]
  )

  const handleFieldChange = React.useCallback(
    (field: Field<Data>, newValue: Val<Data>) => {
      const newData = {
        ...data,
        [field]: newValue
      }
      const revalidateResult = withSubmitAttempts
        ? props.validator.revalidateJoined(newData, errors, [field])
        : null
      setState({
        data: newData,
        errors: revalidateResult?.errorsChanged
          ? revalidateResult.newErrorsJoined
          : errors
      })
    },
    [data, errors, withSubmitAttempts, setState]
  )

  const handleTextFieldChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target
      handleFieldChange(name as Field<Data>, value as Val<Data>)
    },
    [handleFieldChange]
  )

  const prepareTextForSubmitActionError = React.useCallback(
    (error: any): string | null => {
      if (error instanceof ServerConnectorBadRequestError) {
        return 'некорректный запрос, проверьте вводимые данные'
      } else if (error instanceof ServerConnectorConflictError) {
        return 'возник конфликт на сервере при выполнении действия'
      } else if (error instanceof ServerConnectorForbiddenError) {
        return 'недостаточно прав для выполнения действия'
      } else if (error instanceof ServerConnectorIseError) {
        return 'произошла внутренняя ошибка сервера при выполнении действия'
      } else if (error instanceof ServerConnectorNotFoundError) {
        return 'обращение к несуществующему ресурсу при выполнении действия'
      } else if (error instanceof ServerConnectorUnauthorizedError) {
        return 'не удалось авторизоваться, проверьте вводимые данные'
      } else if (error instanceof ServerConnectorError) {
        return 'произошла ошибка при выполнении действия'
      } else {
        return null
      }
    },
    []
  )

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setWithSubmitAttempts(true)
      const errors = props.validator.getErrorsJoined(data)
      if (errors !== null) {
        updateErrors(errors)
      } else {
        try {
          setIsSubmitting(true)
          setSubmitActionError(null)
          const submitActionResult = await props.submitAction(data)
          props.onSuccessSubmit?.(submitActionResult)
        } catch (error) {
          const errorText = prepareTextForSubmitActionError(error)
          if (errorText !== null) {
            setSubmitActionError(capitalize(errorText))
          } else {
            // TODO: unsuccessful request
            throw error
          }
        } finally {
          setIsSubmitting(false)
        }
      }
    },
    [
      props.submitAction,
      props.onSuccessSubmit,
      data,
      setState,
      setIsSubmitting,
      setWithSubmitAttempts,
      updateErrors,
      prepareTextForSubmitActionError
    ]
  )

  return {
    formInternal: {
      isSubmitting,
      submitActionError,
      handleSubmit
    },
    data,
    errors,
    handleTextFieldChange
  }
}

export interface FormProps {
  formInternal: {
    isSubmitting?: boolean
    submitActionError: string | null
    handleSubmit?: React.FormEventHandler<HTMLFormElement>
  }
  title?: string
  children: React.ReactNode
  submitButtonLabel: string
}

export function Form(props: FormProps) {
  return (
    <Box
      component="form"
      onSubmit={props.formInternal.handleSubmit}
      noValidate
      autoComplete="off"
      sx={{ width: '100%' }}
    >
      <Stack spacing={2}>
        {props.title !== undefined ? (
          <Typography
            variant="h6"
            color="primary"
            sx={{ textAlign: 'center', textTransform: 'capitalize' }}
          >
            {props.title}
          </Typography>
        ) : null}
        {props.children}
        <Stack spacing={-2}>
          <Typography
            color="error"
            align="center"
            sx={{
              fontSize: '0.85rem',
              minHeight: '1.2rem',
              transform: 'translate(0, -16px)'
            }}
          >
            {props.formInternal.submitActionError ?? ' '}
          </Typography>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="space-around"
            sx={{ pt: 2 }}
          >
            <ProjButton
              type="submit"
              variant="contained"
              loading={props.formInternal.isSubmitting}
            >
              {props.submitButtonLabel}
            </ProjButton>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}
