// Project
import { allDeviceTypes } from '@common/enums'
import type { ReadTagsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/tags.dto'
import type { CreateDeviceSuccessResultDto } from '@common/dtos/server-api/devices.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { localizationForDeviceType } from '~/localization/device-type'
import {
  type CreateDeviceFormData,
  INITIAL_CREATE_DEVICE_FORM_DATA,
  createDeviceFormValidator
} from '~/data/forms/resources/create-device'
import type { FormSelectProps } from '../common/form-select'
import {
  useForm,
  FormAutocompleteFreeItemsMultipleSelect,
  FormBlock,
  FormDialog,
  FormFileUpload,
  FormMultilineTextField,
  FormSelect,
  FormTextField
} from '../common'
// React
import * as React from 'react'

const EMPTY_TAG_IDS_ARR: number[] = []
const EMPTY_TAG_CODES_ARR: string[] = []

type Tag = DtoWithoutEnums<ReadTagsWithPrimaryPropsSuccessResultItemDto>

const CREATE_DEVICE_FORM_PROPS_JOINED =
  createDeviceFormValidator.getPromptsJoined()

export interface CreateDeviceFormDialogProps {
  tags: Tag[] | null
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessCreateDevice?: (
    createDeviceResult: CreateDeviceSuccessResultDto
  ) => void
  onCancelClick?: () => void
}

export function CreateDeviceFormDialog(props: CreateDeviceFormDialogProps) {
  const notifier = useNotifier()

  const submitAction = React.useCallback(
    async (validatedData: CreateDeviceFormData) => {
      const {
        descriptionText,
        remarkText,
        config,
        clearConfig,
        accessConfig,
        tagIds,
        tagCodesToCreate,
        ...truncatedData
      } = validatedData

      const createdTagIds = (
        await Promise.allSettled(
          (tagCodesToCreate ?? []).map((tagCodeToCreate) =>
            (async () => {
              try {
                return await serverConnector
                  .createTag({
                    code: tagCodeToCreate
                  })
                  .then((result) => result.result.createdResourceId)
              } catch (error) {
                notifier.showError(
                  error,
                  `не удалось создать тег '${tagCodeToCreate}'`
                )
                return null
              }
            })()
          )
        )
      )
        .map((result) => (result.status === 'fulfilled' ? result.value : null))
        .filter((result) => result !== null)

      return await serverConnector.createDevice(
        {
          ...truncatedData,
          type: truncatedData.type!,
          description:
            descriptionText !== undefined
              ? {
                  format: 'PLAIN',
                  text: descriptionText
                }
              : undefined,
          remark:
            remarkText !== undefined
              ? {
                  format: 'PLAIN',
                  text: remarkText
                }
              : undefined,
          tagIds:
            (tagIds ?? []).length + createdTagIds.length > 0
              ? [...(tagIds ?? []), ...createdTagIds]
              : undefined
        },
        config,
        clearConfig,
        accessConfig,
        undefined,
        undefined
      )
    },
    []
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: CreateDeviceFormData,
      createDeviceResult: CreateDeviceSuccessResultDto
    ) => {
      notifier.showSuccess(`устройство '${data.code}' создано`)
      props.onSuccessCreateDevice?.(createDeviceResult)
    },
    [props.onSuccessCreateDevice]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleStrSelectChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange,
    handleFileUploadChange
  } = useForm<CreateDeviceFormData, CreateDeviceSuccessResultDto>({
    INITIAL_FORM_DATA: INITIAL_CREATE_DEVICE_FORM_DATA,
    validator: createDeviceFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const typeSelectItems: FormSelectProps<string>['items'] = React.useMemo(
    () =>
      allDeviceTypes.map((type) => ({
        value: type,
        title: localizationForDeviceType.get(type) ?? type
      })),
    []
  )

  const tagIds = React.useMemo(
    () => props.tags?.map((tag) => tag.id) ?? [],
    [props.tags]
  )

  const tagCodeForId = React.useMemo(
    () => new Map((props.tags ?? []).map((tag) => [tag.id, tag.code])),
    [props.tags]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title="создать устройство"
      submitButtonLabel="создать"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'очистить'
      }}
      createModeIsActive={props.createModeIsActive}
      setCreateModeIsActive={props.setCreateModeIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="code"
          label="код"
          value={data.code}
          helperText={
            errors?.code ?? CREATE_DEVICE_FORM_PROPS_JOINED.code ?? ' '
          }
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormSelect
          required
          name="type"
          label="тип"
          items={typeSelectItems}
          value={data.type ?? ''}
          helperText={
            errors?.type ?? CREATE_DEVICE_FORM_PROPS_JOINED.type ?? ' '
          }
          error={!!errors?.type}
          onChange={handleStrSelectChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? CREATE_DEVICE_FORM_PROPS_JOINED.name ?? ' '
          }
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormFileUpload
          required
          name="config"
          label="основная конфигурация"
          extensions={['zip']}
          value={data.config}
          helperText={
            errors?.config ?? CREATE_DEVICE_FORM_PROPS_JOINED.config ?? ' '
          }
          error={!!errors?.config}
          onChange={handleFileUploadChange}
        />
        <FormFileUpload
          required
          name="accessConfig"
          label="конфигурация доступа"
          extensions={['zip']}
          value={data.accessConfig}
          helperText={
            errors?.accessConfig ??
            CREATE_DEVICE_FORM_PROPS_JOINED.accessConfig ??
            ' '
          }
          error={!!errors?.accessConfig}
          onChange={handleFileUploadChange}
        />
        <FormFileUpload
          required
          name="clearConfig"
          label="конфигурация очищения"
          extensions={['zip']}
          value={data.clearConfig}
          helperText={
            errors?.clearConfig ??
            CREATE_DEVICE_FORM_PROPS_JOINED.clearConfig ??
            ' '
          }
          error={!!errors?.clearConfig}
          onChange={handleFileUploadChange}
        />
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            CREATE_DEVICE_FORM_PROPS_JOINED.descriptionText ??
            ' '
          }
          error={!!errors?.descriptionText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
      <FormBlock title="дополнительная информация">
        <FormAutocompleteFreeItemsMultipleSelect
          name="tagIds"
          freeItemsFieldName="tagCodesToCreate"
          label="теги"
          possibleValues={tagIds}
          titleForValue={tagCodeForId}
          values={data.tagIds ?? EMPTY_TAG_IDS_ARR}
          freeItems={data.tagCodesToCreate ?? EMPTY_TAG_CODES_ARR}
          helperText={(() => {
            const result: string[] = []
            const addMes = (mes: string | undefined) => {
              if (mes) {
                result.push(mes)
              }
            }
            if (errors?.tagIds || errors?.tagCodesToCreate) {
              addMes(errors?.tagIds)
              addMes(errors?.tagCodesToCreate)
            } else {
              addMes(CREATE_DEVICE_FORM_PROPS_JOINED.tagIds)
              addMes(CREATE_DEVICE_FORM_PROPS_JOINED.tagCodesToCreate)
            }
            return result.length > 0 ? result.join(', ') : ' '
          })()}
          error={!!errors?.tagIds || !!errors?.tagCodesToCreate}
          onChange={handleAutocompleteMultipleSelectChange}
          onChangeFreeItems={handleAutocompleteMultipleSelectFreeItemsChange}
        />
        <FormMultilineTextField
          name="remarkText"
          label="комментарии"
          value={data.remarkText ?? ''}
          helperText={
            errors?.remarkText ??
            CREATE_DEVICE_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
