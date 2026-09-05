// Project
import type { UpdateSliceSuccessResultDto } from '@common/dtos/server-api/slices.dto'
import type { SliceTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import {
  type UpdateSliceFormData,
  updateSliceFormValidator
} from '~/data/forms/resources/update-slice'
import {
  prepareOptionalFieldForUpdate as prepareOptional,
  prepareRequiredFieldForUpdate as prepareRequired,
  prepareTextFieldForUpdate as prepareText,
  useForm,
  FormBlock,
  FormDateTime,
  FormDialog,
  FormMultilineTextField,
  FormTextField
} from '../common'
// React
import * as React from 'react'

const UPDATE_SLICE_FORM_PROPS_JOINED =
  updateSliceFormValidator.getPromptsJoined()

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

export interface UpdateSliceFormDialogProps {
  sliceId: number | null
  setSliceId: React.Dispatch<React.SetStateAction<number | null>>
  initialSlice: SliceTertiary | null
  onSuccessUpdateSlice?: (
    updateSliceResult: UpdateSliceSuccessResultDto
  ) => void
  onCancelClick?: () => void
}

function prepareSliceFilterForUpdate(
  currentFilter: SliceTertiary['filter'],
  minCreateTime: UpdateSliceFormData['minCreateTime'],
  maxCreateTime: UpdateSliceFormData['maxCreateTime']
) {
  const nextFilter =
    minCreateTime !== undefined || maxCreateTime !== undefined
      ? {
          minCreateTime: minCreateTime ?? null,
          maxCreateTime: maxCreateTime ?? null
        }
      : null

  return currentFilter?.minCreateTime !== nextFilter?.minCreateTime ||
    currentFilter?.maxCreateTime !== nextFilter?.maxCreateTime
    ? nextFilter
    : undefined
}

export function UpdateSliceFormDialog(props: UpdateSliceFormDialogProps) {
  const notifier = useNotifier()
  const [slice, setSlice] = React.useState<SliceTertiary | null>(
    props.initialSlice
  )

  React.useEffect(() => {
    setSlice(props.initialSlice)
  }, [props.initialSlice])

  const submitAction = React.useCallback(
    async (validatedData: UpdateSliceFormData) => {
      if (props.sliceId === null) {
        throw new Error('отсутствует идентификатор среза заданий')
      } else if (slice === null) {
        throw new Error(
          `отсутствует доступ к текущим характеристикам редактируемого среза заданий`
        )
      } else {
        return await serverConnector.updateSlice({
          id: props.sliceId,
          code: prepareRequired(slice.code, validatedData.code),
          name: prepareOptional(slice.name, validatedData.name),
          filter: prepareSliceFilterForUpdate(
            slice.filter,
            validatedData.minCreateTime,
            validatedData.maxCreateTime
          ),
          description: prepareText(
            slice.description,
            validatedData.descriptionText
          ),
          remark: prepareText(slice.remark, validatedData.remarkText)
        })
      }
    },
    [props.sliceId, slice]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: UpdateSliceFormData,
      updateSliceResult: UpdateSliceSuccessResultDto
    ) => {
      notifier.showSuccess(`срез заданий «${data.code}» изменен`)
      props.onSuccessUpdateSlice?.(updateSliceResult)
    },
    [props.onSuccessUpdateSlice, notifier]
  )

  const initialFormData: UpdateSliceFormData = React.useMemo(
    () => ({
      code: slice?.code ?? '',
      name: slice?.name ?? undefined,
      minCreateTime: slice?.filter?.minCreateTime ?? undefined,
      maxCreateTime: slice?.filter?.maxCreateTime ?? undefined,
      descriptionText: slice?.description?.text,
      remarkText: slice?.remark?.text
    }),
    [slice]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleDateTimeChange
  } = useForm<UpdateSliceFormData, UpdateSliceSuccessResultDto>({
    INITIAL_FORM_DATA: initialFormData,
    validator: updateSliceFormValidator,
    clearTrigger: slice?.id,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const setIsActive = React.useCallback(
    (value: boolean | ((prevState: boolean) => boolean)) => {
      if (value === false) {
        props.setSliceId(null)
      } else {
        throw new Error()
      }
    },
    [props.setSliceId]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title={`изменить срез заданий «${slice?.code}»`}
      submitButtonTitle="изменить"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'к текущим значениям'
      }}
      isActive={props.sliceId !== null}
      setIsActive={setIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="code"
          label="код"
          value={data.code}
          helperText={
            errors?.code ?? UPDATE_SLICE_FORM_PROPS_JOINED.code ?? ' '
          }
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? UPDATE_SLICE_FORM_PROPS_JOINED.name ?? ' '
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
            UPDATE_SLICE_FORM_PROPS_JOINED.descriptionText ??
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
            UPDATE_SLICE_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
