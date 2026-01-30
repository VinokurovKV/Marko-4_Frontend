// Project
import { type FileFormat, convertFileFormatToExtension } from '@common/formats'
import { allDeviceTypes } from '@common/enums'
import type { UpdateDeviceSuccessResultDto } from '@common/dtos/server-api/devices.dto'
import { convertNumberOfBytesToStr } from '@common/utilities'
import type { DeviceTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useDeviceSubscription } from '~/hooks/resources'
import { useTags } from '~/hooks/resources'
import { localizationForDeviceType } from '~/localization'
import {
  type UpdateDeviceFormData,
  updateDeviceFormValidator
} from '~/data/forms/resources/update-device'
import type { FormSelectProps } from '../common/form-select'
import {
  createTagsAndGetIds,
  prepareArrFieldForUpdate as prepareArr,
  prepareFileExtraFieldForUpdate as prepareFileExtra,
  prepareOptionalFieldForUpdate as prepareOptional,
  prepareRequiredFieldForUpdate as prepareRequired,
  prepareTextFieldForUpdate as prepareText,
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

const UPDATE_DEVICE_FORM_PROPS_JOINED =
  updateDeviceFormValidator.getPromptsJoined()

const FICT_FILE_TYPE = 'fict'

export interface UpdateDeviceFormDialogProps {
  deviceId: number | null
  setDeviceId: React.Dispatch<React.SetStateAction<number | null>>
  initialDevice: DeviceTertiary | null
  onSuccessUpdateDevice?: (
    updateDeviceResult: UpdateDeviceSuccessResultDto
  ) => void
  onCancelClick?: () => void
}

export function UpdateDeviceFormDialog(props: UpdateDeviceFormDialogProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const selfId = React.useMemo(
    () => (meta.status !== 'AUTHENTICATED' ? null : meta.selfMeta.id),
    [meta]
  )

  const [device, setDevice] = React.useState<DeviceTertiary | null>(
    props.initialDevice
  )
  useDeviceSubscription('UP_TO_TERTIARY_PROPS', props.deviceId, setDevice)

  const tags = useTags('PRIMARY_PROPS', false, props.deviceId !== null)

  const tagIds = React.useMemo(() => tags?.map((tag) => tag.id) ?? [], [tags])

  const tagCodeForId = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.id, tag.code])),
    [tags]
  )

  const tagIdForCode = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.code, tag.id])),
    [tags]
  )

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToEvents(
      {
        filter: {
          types: ['UPDATE_DEVICE', 'DELETE_DEVICE', 'DELETE_DEVICES']
        }
      },
      (data) => {
        ;(() => {
          if (props.deviceId !== null) {
            for (const event of data) {
              if (selfId !== null && event.initiatorId !== selfId) {
                if (
                  event.type === 'UPDATE_DEVICE' &&
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  (event as any).config?.resource?.id === props.deviceId
                ) {
                  notifier.showWarning(
                    `редактируемое устройство изменено другим пользователем`
                  )
                } else if (
                  (event.type === 'DELETE_DEVICE' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resource?.id === props.deviceId) ||
                  (event.type === 'DELETE_DEVICES' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resources?.some?.(
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      (resource: any) => resource?.id === props.deviceId
                    ))
                ) {
                  notifier.showWarning(
                    `редактируемое устройство удалено другим пользователем`
                  )
                }
              }
            }
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [props.deviceId, notifier, selfId])

  const submitAction = React.useCallback(
    async (validatedData: UpdateDeviceFormData) => {
      if (props.deviceId === null) {
        throw new Error('отсутствует идентификатор устройства')
      } else if (device === null) {
        throw new Error(
          `отсутствует доступ к текущим характеристикам редактируемого устройства`
        )
      } else {
        const {
          descriptionText,
          remarkText,
          config,
          clearConfig,
          accessConfig,
          tagIds,
          tagCodesToCreate
        } = validatedData

        const recentlyCreatedTagIds = (tagCodesToCreate ?? [])
          .map((tagCodeToCreate) => tagIdForCode.get(tagCodeToCreate))
          .filter((tagId) => tagId !== undefined)

        const newCreatedTagIds = await createTagsAndGetIds(
          tagIdForCode,
          tagCodesToCreate,
          notifier
        )

        return await serverConnector.updateDevice(
          {
            id: props.deviceId,
            code: prepareRequired(device.code, validatedData.code),
            name: prepareOptional(device.name, validatedData.name),
            type: prepareRequired(device.type, validatedData.type),
            config: prepareFileExtra(device.config, validatedData.config),
            clearConfig: prepareFileExtra(
              device.clearConfig,
              validatedData.clearConfig
            ),
            accessConfig: prepareFileExtra(
              device.accessConfig,
              validatedData.accessConfig
            ),
            description: prepareText(device.description, descriptionText),
            remark: prepareText(device.remark, remarkText),
            tagIds: prepareArr(device.tagIds, [
              ...(tagIds ?? []),
              ...recentlyCreatedTagIds,
              ...newCreatedTagIds
            ])
          },
          config?.type !== FICT_FILE_TYPE ? config : undefined,
          clearConfig?.type !== FICT_FILE_TYPE ? clearConfig : undefined,
          accessConfig?.type !== FICT_FILE_TYPE ? accessConfig : undefined,
          undefined,
          undefined
        )
      }
    },
    [props.deviceId, notifier, device, tagIdForCode]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: UpdateDeviceFormData,
      updateDeviceResult: UpdateDeviceSuccessResultDto
    ) => {
      notifier.showSuccess(`устройство «${device?.code}» изменено`)
      props.onSuccessUpdateDevice?.(updateDeviceResult)
    },
    [props.onSuccessUpdateDevice, notifier, device]
  )

  const initialFormData: UpdateDeviceFormData = React.useMemo(() => {
    function prepareFile(
      file: { format: FileFormat; size: number } | undefined | null
    ) {
      return file
        ? new File(
            [],
            `${convertNumberOfBytesToStr(file.size)}.${convertFileFormatToExtension(file.format)}`,
            {
              type: FICT_FILE_TYPE
            }
          )
        : undefined
    }
    return {
      code: device?.code ?? '',
      name: device?.name ?? undefined,
      type: device?.type,
      config: prepareFile(device?.config),
      clearConfig: prepareFile(device?.clearConfig),
      accessConfig: prepareFile(device?.accessConfig),
      descriptionText: device?.description?.text,
      remarkText: device?.remark?.text,
      tagIds: device?.tagIds
    }
  }, [device])

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleStrSelectChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange,
    handleFileUploadChange
  } = useForm<UpdateDeviceFormData, UpdateDeviceSuccessResultDto>({
    INITIAL_FORM_DATA: initialFormData,
    validator: updateDeviceFormValidator,
    clearTrigger: device?.id,
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

  const setIsActive = React.useCallback(
    (value: boolean | ((prevState: boolean) => boolean)) => {
      if (value === false) {
        props.setDeviceId(null)
      } else {
        throw new Error()
      }
    },
    [props.setDeviceId]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title={`изменить устройство «${device?.code}»`}
      submitButtonTitle="изменить"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'к текущим значениям'
      }}
      isActive={props.deviceId !== null}
      setIsActive={setIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="code"
          label="код"
          value={data.code}
          helperText={
            errors?.code ?? UPDATE_DEVICE_FORM_PROPS_JOINED.code ?? ' '
          }
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? UPDATE_DEVICE_FORM_PROPS_JOINED.name ?? ' '
          }
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormSelect
          required
          name="type"
          label="тип"
          items={typeSelectItems}
          value={data.type ?? ''}
          helperText={
            errors?.type ?? UPDATE_DEVICE_FORM_PROPS_JOINED.type ?? ' '
          }
          error={!!errors?.type}
          onChange={handleStrSelectChange}
        />
        <FormFileUpload
          name="config"
          label="параметры устройства"
          extensions={['txt']}
          value={data.config}
          helperText={
            errors?.config ?? UPDATE_DEVICE_FORM_PROPS_JOINED.config ?? ' '
          }
          error={!!errors?.config}
          onChange={handleFileUploadChange}
        />
        <FormFileUpload
          name="accessConfig"
          label="конфигурация доступа"
          extensions={['zip']}
          value={data.accessConfig}
          helperText={
            errors?.accessConfig ??
            UPDATE_DEVICE_FORM_PROPS_JOINED.accessConfig ??
            ' '
          }
          error={!!errors?.accessConfig}
          onChange={handleFileUploadChange}
        />
        <FormFileUpload
          name="clearConfig"
          label="конфигурация очищения"
          extensions={['zip']}
          value={data.clearConfig}
          helperText={
            errors?.clearConfig ??
            UPDATE_DEVICE_FORM_PROPS_JOINED.clearConfig ??
            ' '
          }
          error={!!errors?.clearConfig}
          onChange={handleFileUploadChange}
        />
      </FormBlock>
      <FormBlock title="дополнительная информация">
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            UPDATE_DEVICE_FORM_PROPS_JOINED.descriptionText ??
            ' '
          }
          error={!!errors?.descriptionText}
          onChange={handleTextFieldChange}
        />
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
              addMes(UPDATE_DEVICE_FORM_PROPS_JOINED.tagIds)
              addMes(UPDATE_DEVICE_FORM_PROPS_JOINED.tagCodesToCreate)
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
            UPDATE_DEVICE_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
