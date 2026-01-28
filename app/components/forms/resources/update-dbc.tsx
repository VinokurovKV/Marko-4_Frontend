// Project
import { convertFileFormatToExtension } from '@common/formats'
import type { UpdateDbcSuccessResultDto } from '@common/dtos/server-api/dbcs.dto'
import { convertNumberOfBytesToStr } from '@common/utilities'
import type { DbcTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useDbcSubscription } from '~/hooks/resources'
import { useTags } from '~/hooks/resources'
import {
  type UpdateDbcFormData,
  updateDbcFormValidator
} from '~/data/forms/resources/update-dbc'
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
  FormTextField
} from '../common'
// React
import * as React from 'react'

const EMPTY_TAG_IDS_ARR: number[] = []
const EMPTY_TAG_CODES_ARR: string[] = []

const UPDATE_DBC_FORM_PROPS_JOINED = updateDbcFormValidator.getPromptsJoined()

const FICT_FILE_TYPE = 'fict'

export interface UpdateDbcFormDialogProps {
  dbcId: number | null
  setDbcId: React.Dispatch<React.SetStateAction<number | null>>
  initialDbc: DbcTertiary | null
  onSuccessUpdateDbc?: (updateDbcResult: UpdateDbcSuccessResultDto) => void
  onCancelClick?: () => void
}

export function UpdateDbcFormDialog(props: UpdateDbcFormDialogProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const selfId = React.useMemo(
    () => (meta.status !== 'AUTHENTICATED' ? null : meta.selfMeta.id),
    [meta]
  )

  const [dbc, setDbc] = React.useState<DbcTertiary | null>(props.initialDbc)
  useDbcSubscription('UP_TO_TERTIARY_PROPS', props.dbcId, setDbc)

  const tags = useTags('PRIMARY_PROPS', false, props.dbcId !== null)

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
          types: ['UPDATE_DBC', 'DELETE_DBC', 'DELETE_DBC']
        }
      },
      (data) => {
        ;(() => {
          if (props.dbcId !== null) {
            for (const event of data) {
              if (selfId !== null && event.initiatorId !== selfId) {
                if (
                  event.type === 'UPDATE_DBC' &&
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  (event as any).config?.resource?.id === props.dbcId
                ) {
                  notifier.showWarning(
                    `редактируемая базовая конфигурация изменена другим пользователем`
                  )
                } else if (
                  (event.type === 'DELETE_DBC' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resource?.id === props.dbcId) ||
                  (event.type === 'DELETE_DBC' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resources?.some?.(
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      (resource: any) => resource?.id === props.dbcId
                    ))
                ) {
                  notifier.showWarning(
                    `редактируемая базовая конфигурация удалена другим пользователем`
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
  }, [props.dbcId, notifier, selfId])

  const submitAction = React.useCallback(
    async (validatedData: UpdateDbcFormData) => {
      if (props.dbcId === null) {
        throw new Error('отсутствует идентификатор базовой конфигурации')
      } else if (dbc === null) {
        throw new Error(
          `отсутствует доступ к текущим характеристикам редактируемой базовой конфигурации`
        )
      } else {
        const {
          descriptionText,
          remarkText,
          config,
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

        return await serverConnector.updateDbc(
          {
            id: props.dbcId,
            code: prepareRequired(dbc.code, validatedData.code),
            name: prepareOptional(dbc.name, validatedData.name),
            config: prepareFileExtra(dbc.config, validatedData.config),
            description: prepareText(dbc.description, descriptionText),
            remark: prepareText(dbc.remark, remarkText),
            tagIds: prepareArr(dbc.tagIds, [
              ...(tagIds ?? []),
              ...recentlyCreatedTagIds,
              ...newCreatedTagIds
            ])
          },
          config?.type !== FICT_FILE_TYPE ? config : undefined,
          undefined
        )
      }
    },
    [props.dbcId, notifier, dbc, tagIdForCode]
  )

  const onSuccessSubmit = React.useCallback(
    (data: UpdateDbcFormData, updateDbcResult: UpdateDbcSuccessResultDto) => {
      notifier.showSuccess(`базовая конфигурация «${dbc?.code}» изменена`)
      props.onSuccessUpdateDbc?.(updateDbcResult)
    },
    [props.onSuccessUpdateDbc, notifier]
  )

  const initialFormData: UpdateDbcFormData = React.useMemo(
    () => ({
      code: dbc?.code ?? '',
      name: dbc?.name ?? undefined,
      config: dbc?.config
        ? new File(
            [],
            `${convertNumberOfBytesToStr(dbc.config.size)}.${convertFileFormatToExtension(dbc.config.format)}`,
            {
              type: FICT_FILE_TYPE
            }
          )
        : undefined,
      descriptionText: dbc?.description?.text,
      remarkText: dbc?.remark?.text,
      tagIds: dbc?.tagIds
    }),
    [dbc]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange,
    handleFileUploadChange
  } = useForm<UpdateDbcFormData, UpdateDbcSuccessResultDto>({
    INITIAL_FORM_DATA: initialFormData,
    validator: updateDbcFormValidator,
    clearTrigger: dbc?.id,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const setIsActive = React.useCallback(
    (value: boolean | ((prevState: boolean) => boolean)) => {
      if (value === false) {
        props.setDbcId(null)
      } else {
        throw new Error()
      }
    },
    [props.setDbcId]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title={`изменить базовую конфигурацию «${dbc?.code}»`}
      submitButtonTitle="изменить"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'к текущим значениям'
      }}
      isActive={props.dbcId !== null}
      setIsActive={setIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="code"
          label="код"
          value={data.code}
          helperText={errors?.code ?? UPDATE_DBC_FORM_PROPS_JOINED.code ?? ' '}
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={errors?.name ?? UPDATE_DBC_FORM_PROPS_JOINED.name ?? ' '}
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormFileUpload
          name="config"
          label="конфигурация"
          extensions={['zip']}
          value={data.config}
          helperText={
            errors?.config ?? UPDATE_DBC_FORM_PROPS_JOINED.config ?? ' '
          }
          error={!!errors?.config}
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
            UPDATE_DBC_FORM_PROPS_JOINED.descriptionText ??
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
              addMes(UPDATE_DBC_FORM_PROPS_JOINED.tagIds)
              addMes(UPDATE_DBC_FORM_PROPS_JOINED.tagCodesToCreate)
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
            errors?.remarkText ?? UPDATE_DBC_FORM_PROPS_JOINED.remarkText ?? ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
