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
import { useChangeDetector } from '~/hooks/change-detector'
import { ProjButton } from '~/components/buttons/button'
import { FormContainer } from '~/components/containers/form-container'
import type { FormAutocompleteSingleSelectProps } from './form-autocomplete-single-select'
import type { FormAutocompleteMultipleSelectProps } from './form-autocomplete-multiple-select'
import type { FormAutocompleteFreeItemsMultipleSelectProps } from './form-autocomplete-free-items-multiple-select'
import type { FormDateTimeProps } from './form-date-time'
import type { FormDateProps } from './form-date'
import type { FormFileUploadProps } from './form-file-upload'
// React
import * as React from 'react'
// Material UI
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import type { SelectChangeEvent, SelectProps } from '@mui/material/Select'
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
  onSuccessSubmit?: (data: Data, submitActionResult: SubmitActionResult) => void
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

  const clear = React.useCallback(() => {
    setState({
      data: props.INITIAL_FORM_DATA,
      errors: {}
    })
  }, [props.INITIAL_FORM_DATA, setState])

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
      setState((oldState) => {
        const newData = {
          ...oldState.data,
          [field]: newValue
        }
        const revalidateResult = withSubmitAttempts
          ? props.validator.revalidateJoined(newData, errors, [field])
          : null
        return {
          data: newData,
          errors: revalidateResult?.errorsChanged
            ? revalidateResult.newErrorsJoined
            : errors
        }
      })
    },
    [errors, withSubmitAttempts, setState]
  )

  const handleTextFieldChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target
      handleFieldChange(name as Field<Data>, value as Val<Data>)
    },
    [handleFieldChange]
  )

  const handleNumSelectChange: SelectProps<number>['onChange'] =
    React.useCallback(
      (event: SelectChangeEvent<number | string>) => {
        handleFieldChange(
          event.target.name as Field<Data>,
          Number(event.target.value) as Val<Data>
        )
      },
      [handleFieldChange]
    )

  const handleStrSelectChange: SelectProps<string>['onChange'] =
    React.useCallback(
      (event: SelectChangeEvent<string>) => {
        handleFieldChange(
          event.target.name as Field<Data>,
          event.target.value as Val<Data>
        )
      },
      [handleFieldChange]
    )

  const handleAutocompleteSingleSelectChange: FormAutocompleteSingleSelectProps<
    number | string
  >['onChange'] = React.useCallback(
    ({ name, value }) => {
      handleFieldChange(name, value as Val<Data>)
    },
    [handleFieldChange]
  )

  const handleAutocompleteMultipleSelectChange: FormAutocompleteMultipleSelectProps<
    number | string
  >['onChange'] = React.useCallback(
    ({ name, values }) => {
      handleFieldChange(name, values as Val<Data>)
    },
    [handleFieldChange]
  )

  const handleAutocompleteMultipleSelectFreeItemsChange: FormAutocompleteFreeItemsMultipleSelectProps<
    number | string
  >['onChangeFreeItems'] = React.useCallback(
    ({ name, items }) => {
      handleFieldChange(name, items as Val<Data>)
    },
    [handleFieldChange]
  )

  const handleDateTimeChange: FormDateTimeProps['onChange'] = React.useCallback(
    ({ name, value }) => {
      handleFieldChange(name, value as Val<Data>)
    },
    [handleFieldChange]
  )

  const handleDateChange: FormDateProps['onChange'] = React.useCallback(
    ({ name, value }) => {
      handleFieldChange(name, value as Val<Data>)
    },
    [handleFieldChange]
  )

  const handleFileUploadChange: FormFileUploadProps['onChange'] =
    React.useCallback(
      ({ name, value }) => {
        handleFieldChange(name, value as Val<Data>)
      },
      [handleFieldChange]
    )

  const prepareTextForSubmitActionError = React.useCallback(
    (error: any): string | null => {
      if (error instanceof ServerConnectorBadRequestError) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const errorReasons = (error.object as any)?.errorReasons
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const message = (error.object as any)?.message
        const items: string[] = []
        if (
          errorReasons instanceof Array &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          errorReasons.every((reason) => typeof reason?.type === 'string')
        ) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
          items.push(...errorReasons.map((reason) => reason.type))
        }
        if (
          message instanceof Array &&
          message.every((item) => typeof item === 'string')
        ) {
          items.push(...message)
        } else if (typeof message === 'string') {
          items.push(message)
        }
        if (items.length > 0) {
          return (
            'некорректный запрос: ' +
            items
              .map((item) => {
                return (
                  {
                    NON_UNIQUE_LOGIN: 'указанный логин занят',
                    NON_UNIQUE_NAME: 'указанное название занято',
                    NON_UNIQUE_CODE: 'указанный код занят'
                  }[item] ?? item
                )
              })
              .join(', ')
          )
        }
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
    async (event: React.FormEvent<HTMLFormElement> | undefined) => {
      event?.preventDefault()
      setWithSubmitAttempts(true)
      const errors = props.validator.getErrorsJoined(data)
      if (errors !== null) {
        updateErrors(errors)
      } else {
        try {
          setIsSubmitting(true)
          setSubmitActionError(null)
          const transformedData = props.validator.getTransformed(data)
          const submitActionResult = await props.submitAction(transformedData)
          props.onSuccessSubmit?.(transformedData, submitActionResult)
        } catch (error) {
          const errorText = prepareTextForSubmitActionError(error)
          if (errorText !== null) {
            setSubmitActionError(capitalize(errorText, true))
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
      props.validator,
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
      handleSubmit,
      clear
    },
    data,
    errors,
    handleTextFieldChange,
    handleNumSelectChange,
    handleStrSelectChange,
    handleAutocompleteSingleSelectChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange,
    handleDateTimeChange,
    handleDateChange,
    handleFileUploadChange
  }
}

export interface FormProps {
  formInternal: {
    isSubmitting?: boolean
    submitActionError: string | null
    handleSubmit?: (
      event: React.FormEvent<HTMLFormElement> | undefined
    ) => Promise<void>
    clear: () => void
  }
  title?: string
  children: React.ReactNode
  submitButtonLabel: string
  cancelButton?: {
    title: string
    onClick?: () => void
  }
  clearButton?: {
    title: string
  }
}

export function Form(props: FormProps) {
  return (
    <Box
      component="form"
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onSubmit={props.formInternal.handleSubmit}
      noValidate
      autoComplete="off"
      sx={{ width: '100%' }}
    >
      <Stack spacing={2}>
        {props.title !== undefined ? (
          <Typography
            color="primary"
            sx={{
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          >
            {capitalize(props.title, true)}
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
            justifyContent="center"
            sx={{ pt: 2 }}
          >
            {props.clearButton ? (
              <ProjButton
                variant="contained"
                loading={props.formInternal.isSubmitting}
                onClick={props.formInternal.clear}
              >
                {props.clearButton.title}
              </ProjButton>
            ) : null}
            {props.cancelButton ? (
              <ProjButton
                variant="contained"
                loading={props.formInternal.isSubmitting}
                onClick={props.cancelButton.onClick}
              >
                {props.cancelButton.title}
              </ProjButton>
            ) : null}
            {props.clearButton || props.cancelButton ? (
              <Divider orientation="vertical" flexItem />
            ) : null}
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

export type FormDialogProps = FormProps & {
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
}

function useFormSeparated(props: FormProps) {
  const TitleElem =
    props.title !== undefined ? (
      <Typography
        color="primary"
        sx={{
          fontSize: '1.2rem',
          fontWeight: 'bold',
          textAlign: 'center'
        }}
      >
        {capitalize(props.title, true)}
      </Typography>
    ) : null
  const ContentElem = (
    <Box
      component="form"
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onSubmit={props.formInternal.handleSubmit}
      noValidate
      autoComplete="off"
      sx={{ width: '100%' }}
    >
      <Stack spacing={2}>{props.children}</Stack>
      <ProjButton type="submit" sx={{ display: 'none', height: 0, width: 0 }} />
    </Box>
  )
  const ActionsElem = (
    <Stack p={0.5} spacing={1} sx={{ width: '100%' }}>
      <Typography
        color="error"
        align="center"
        sx={{
          fontSize: '0.85rem',
          minHeight: '1.2rem'
        }}
      >
        {props.formInternal.submitActionError ?? ' '}
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center">
        {props.clearButton ? (
          <ProjButton
            variant="contained"
            loading={props.formInternal.isSubmitting}
            onClick={props.formInternal.clear}
          >
            {props.clearButton.title}
          </ProjButton>
        ) : null}
        {props.cancelButton ? (
          <ProjButton
            variant="contained"
            loading={props.formInternal.isSubmitting}
            onClick={props.cancelButton.onClick}
          >
            {props.cancelButton.title}
          </ProjButton>
        ) : null}
        {props.clearButton || props.cancelButton ? (
          <Divider orientation="vertical" flexItem />
        ) : null}
        <ProjButton
          variant="contained"
          loading={props.formInternal.isSubmitting}
          onClick={() => {
            void props.formInternal?.handleSubmit?.(undefined)
          }}
        >
          {props.submitButtonLabel}
        </ProjButton>
      </Stack>
    </Stack>
  )
  return {
    TitleElem,
    ContentElem,
    ActionsElem
  }
}

export function FormDialog({
  createModeIsActive,
  setCreateModeIsActive,
  ...props
}: FormDialogProps) {
  const { TitleElem, ContentElem, ActionsElem } = useFormSeparated(props)

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  useChangeDetector({
    detectedObjects: [createModeIsActive],
    otherDependencies: [props.formInternal.clear],
    onChange: ([oldCreateModeIsActive]) => {
      if (oldCreateModeIsActive === false) {
        props.formInternal.clear()
      }
    }
  })

  return (
    <Dialog scroll="paper" onClose={cancelCreateForm} open={createModeIsActive}>
      {TitleElem !== null ? <DialogTitle>{TitleElem}</DialogTitle> : null}
      <DialogContent dividers={true}>
        <FormContainer>{ContentElem}</FormContainer>
      </DialogContent>
      <DialogActions>{ActionsElem}</DialogActions>
    </Dialog>
  )
}
