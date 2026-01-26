// Project
import type { CreateDbcSuccessResultDto } from '@common/dtos/server-api/dbcs.dto'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useTags } from '~/hooks/resources'
import {
  type CreateDbcFormData,
  INITIAL_CREATE_DBC_FORM_DATA,
  createDbcFormValidator
} from '~/data/forms/resources/create-dbc'
import {
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

const CREATE_DBC_FORM_PROPS_JOINED = createDbcFormValidator.getPromptsJoined()

export interface CreateDbcFormDialogProps {
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessCreateDbc?: (createDbcResult: CreateDbcSuccessResultDto) => void
  onCancelClick?: () => void
}

export function CreateDbcFormDialog(props: CreateDbcFormDialogProps) {
  const notifier = useNotifier()

  const tags = useTags('PRIMARY_PROPS', false, props.createModeIsActive)

  const tagIds = React.useMemo(() => tags?.map((tag) => tag.id) ?? [], [tags])

  const tagCodeForId = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.id, tag.code])),
    [tags]
  )

  const tagIdForCode = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.code, tag.id])),
    [tags]
  )

  const submitAction = React.useCallback(
    async (validatedData: CreateDbcFormData) => {
      const {
        descriptionText,
        remarkText,
        config,
        tagIds,
        tagCodesToCreate,
        ...truncatedData
      } = validatedData

      const recentlyCreatedTagIds = (tagCodesToCreate ?? [])
        .map((tagCodeToCreate) => tagIdForCode.get(tagCodeToCreate))
        .filter((tagId) => tagId !== undefined)

      const newCreatedTagIds = (
        await Promise.allSettled(
          (tagCodesToCreate ?? [])
            .filter(
              (tagCodeToCreate) => tagIdForCode.has(tagCodeToCreate) === false
            )
            .map((tagCodeToCreate) =>
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
                    `не удалось создать тег «${tagCodeToCreate}»`
                  )
                  return null
                }
              })()
            )
        )
      )
        .map((result) => (result.status === 'fulfilled' ? result.value : null))
        .filter((result) => result !== null)

      return await serverConnector.createDbc(
        {
          ...truncatedData,
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
            (tagIds ?? []).length +
              recentlyCreatedTagIds.length +
              newCreatedTagIds.length >
            0
              ? [
                  ...(tagIds ?? []),
                  ...recentlyCreatedTagIds,
                  ...newCreatedTagIds
                ]
              : undefined
        },
        config,
        undefined
      )
    },
    [notifier, tagIdForCode]
  )

  const onSuccessSubmit = React.useCallback(
    (data: CreateDbcFormData, createDbcResult: CreateDbcSuccessResultDto) => {
      notifier.showSuccess(`базованя конфигурация «${data.code}» создана`)
      props.onSuccessCreateDbc?.(createDbcResult)
    },
    [props.onSuccessCreateDbc, notifier]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange,
    handleFileUploadChange
  } = useForm<CreateDbcFormData, CreateDbcSuccessResultDto>({
    INITIAL_FORM_DATA: INITIAL_CREATE_DBC_FORM_DATA,
    validator: createDbcFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  return (
    <FormDialog
      formInternal={formInternal}
      title="создать базовую конфигурацию"
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
          helperText={errors?.code ?? CREATE_DBC_FORM_PROPS_JOINED.code ?? ' '}
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={errors?.name ?? CREATE_DBC_FORM_PROPS_JOINED.name ?? ' '}
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormFileUpload
          name="config"
          label="конфигурация"
          extensions={['zip']}
          value={data.config}
          helperText={
            errors?.config ?? CREATE_DBC_FORM_PROPS_JOINED.config ?? ' '
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
            CREATE_DBC_FORM_PROPS_JOINED.descriptionText ??
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
              addMes(CREATE_DBC_FORM_PROPS_JOINED.tagIds)
              addMes(CREATE_DBC_FORM_PROPS_JOINED.tagCodesToCreate)
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
            errors?.remarkText ?? CREATE_DBC_FORM_PROPS_JOINED.remarkText ?? ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
