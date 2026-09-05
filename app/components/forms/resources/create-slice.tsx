// Project
import type { CreateSliceSuccessResultDto } from '@common/dtos/server-api/slices.dto'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import {
  type CreateSliceFormData,
  INITIAL_CREATE_SLICE_FORM_DATA,
  createSliceFormValidator
} from '~/data/forms/resources/create-slice'
import {
  useForm,
  FormBlock,
  FormDateTime,
  FormDialog,
  FormMultilineTextField,
  FormTextField
} from '../common'
// React
import * as React from 'react'

const CREATE_SLICE_FORM_PROPS_JOINED =
  createSliceFormValidator.getPromptsJoined()

const sliceDatePickerPaperSx = {
  zoom: 0.78,
  '& .MuiPickersLayout-root': {
    minWidth: 0,
    width: 'fit-content',
    maxWidth: 560
  },
  '& .MuiDateCalendar-root': {
    width: 228,
    height: 230
  },
  '& .MuiPickersCalendarHeader-root': {
    minHeight: 30,
    maxHeight: 30,
    px: 1,
    mt: 0,
    mb: 0
  },
  '& .MuiPickersCalendarHeader-label': {
    fontSize: '0.8rem'
  },
  '& .MuiPickersArrowSwitcher-button': {
    p: 0.25
  },
  '& .MuiDayCalendar-header': {
    px: 1
  },
  '& .MuiDayCalendar-weekDayLabel': {
    width: 26,
    height: 22,
    fontSize: '0.7rem'
  },
  '& .MuiDayCalendar-weekContainer': {
    mx: 1,
    my: 0
  },
  '& .MuiPickersDay-root': {
    width: 26,
    height: 26,
    fontSize: '0.7rem'
  },
  '& .MuiMultiSectionDigitalClock-root': {
    maxHeight: 178
  },
  '& .MuiMultiSectionDigitalClockSection-root': {
    width: 42
  },
  '& .MuiMultiSectionDigitalClockSection-item': {
    minHeight: 24,
    fontSize: '0.7rem'
  },
  '& .MuiDialogActions-root': {
    px: 1,
    py: 0.5
  },
  '& .MuiDialogActions-root .MuiButton-root': {
    minHeight: 28,
    fontSize: '0.75rem'
  }
}

const sliceDatePickerPopperSx = {
  '& .MuiPaper-root': {
    zoom: 0.78,
    width: 'fit-content',
    maxWidth: 560
  }
}

export interface CreateSliceFormDialogProps {
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessCreateSlice?: (
    createSliceResult: CreateSliceSuccessResultDto
  ) => void
  onCancelClick?: () => void
}

export function CreateSliceFormDialog(props: CreateSliceFormDialogProps) {
  const notifier = useNotifier()

  const submitAction = React.useCallback(
    async (validatedData: CreateSliceFormData) => {
      const filter =
        validatedData.minCreateTime !== undefined ||
        validatedData.maxCreateTime !== undefined
          ? {
              minCreateTime: validatedData.minCreateTime ?? null,
              maxCreateTime: validatedData.maxCreateTime ?? null
            }
          : null

      return await serverConnector.createSlice({
        code: validatedData.code,
        name: validatedData.name ?? null,
        filter: filter,
        description:
          validatedData.descriptionText !== undefined
            ? {
                format: 'PLAIN',
                text: validatedData.descriptionText
              }
            : null,
        remark:
          validatedData.remarkText !== undefined
            ? {
                format: 'PLAIN',
                text: validatedData.remarkText
              }
            : null
      })
    },
    []
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: CreateSliceFormData,
      createSliceResult: CreateSliceSuccessResultDto
    ) => {
      notifier.showSuccess(`срез заданий «${data.code}» создан`)
      props.onSuccessCreateSlice?.(createSliceResult)
    },
    [props.onSuccessCreateSlice, notifier]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleDateTimeChange
  } = useForm<CreateSliceFormData, CreateSliceSuccessResultDto>({
    INITIAL_FORM_DATA: INITIAL_CREATE_SLICE_FORM_DATA,
    validator: createSliceFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  return (
    <FormDialog
      formInternal={formInternal}
      title="создать срез заданий"
      submitButtonTitle="создать"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'очистить'
      }}
      isActive={props.createModeIsActive}
      setIsActive={props.setCreateModeIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="code"
          label="код"
          value={data.code}
          helperText={
            errors?.code ?? CREATE_SLICE_FORM_PROPS_JOINED.code ?? ' '
          }
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? CREATE_SLICE_FORM_PROPS_JOINED.name ?? ' '
          }
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
      <FormBlock title="фильтр заданий">
        <FormDateTime
          name="minCreateTime"
          label="с даты создания"
          value={data.minCreateTime ?? null}
          helperText={errors?.minCreateTime ?? ' '}
          error={!!errors?.minCreateTime}
          placeholder="дд.мм.гггг чч:мм:сс"
          formControlSx={{ m: 1, minWidth: 260 }}
          popperSx={sliceDatePickerPopperSx}
          desktopPaperSx={sliceDatePickerPaperSx}
          onChange={handleDateTimeChange}
        />
        <FormDateTime
          name="maxCreateTime"
          label="по дату создания"
          value={data.maxCreateTime ?? null}
          helperText={errors?.maxCreateTime ?? ' '}
          error={!!errors?.maxCreateTime}
          placeholder="дд.мм.гггг чч:мм:сс"
          formControlSx={{ m: 1, minWidth: 260 }}
          popperSx={sliceDatePickerPopperSx}
          desktopPaperSx={sliceDatePickerPaperSx}
          onChange={handleDateTimeChange}
        />
      </FormBlock>
      <FormBlock title="дополнительная информация">
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            CREATE_SLICE_FORM_PROPS_JOINED.descriptionText ??
            ' '
          }
          error={!!errors?.descriptionText}
          onChange={handleTextFieldChange}
        />
        <FormMultilineTextField
          name="remarkText"
          label="примечание"
          value={data.remarkText ?? ''}
          helperText={
            errors?.remarkText ??
            CREATE_SLICE_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
