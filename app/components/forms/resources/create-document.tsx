// Project
import { allDocumentTypes } from '@common/enums'
import type { ReadTagsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/tags.dto'
import type { CreateDocumentSuccessResultDto } from '@common/dtos/server-api/documents.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { localizationForDocumentType } from '~/localization'
import {
  type CreateDocumentFormData,
  INITIAL_CREATE_DOCUMENT_FORM_DATA,
  createDocumentFormValidator
} from '~/data/forms/resources/create-document'
import type { FormSelectProps } from '../common/form-select'
import {
  useForm,
  FormAutocompleteFreeItemsMultipleSelect,
  FormBlock,
  FormDate,
  FormDialog,
  FormFileUpload,
  FormMultilineTextField,
  FormSelect,
  FormTextField,
  FormUrlField
} from '../common'
// React
import * as React from 'react'

const EMPTY_TAG_IDS_ARR: number[] = []
const EMPTY_TAG_CODES_ARR: string[] = []

type Tag = DtoWithoutEnums<ReadTagsWithPrimaryPropsSuccessResultItemDto>

const CREATE_DOCUMENT_FORM_PROPS_JOINED =
  createDocumentFormValidator.getPromptsJoined()

export interface CreateDocumentFormDialogProps {
  tags: Tag[] | null
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessCreateDocument?: (
    createDocumentResult: CreateDocumentSuccessResultDto
  ) => void
  onCancelClick?: () => void
}

export function CreateDocumentFormDialog(props: CreateDocumentFormDialogProps) {
  const notifier = useNotifier()

  const submitAction = React.useCallback(
    async (validatedData: CreateDocumentFormData) => {
      const {
        descriptionText,
        remarkText,
        config,
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

      return await serverConnector.createDocument(
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
        config!
      )
    },
    []
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: CreateDocumentFormData,
      createDocumentResult: CreateDocumentSuccessResultDto
    ) => {
      notifier.showSuccess(`документ '${data.code}' создан`)
      props.onSuccessCreateDocument?.(createDocumentResult)
    },
    [props.onSuccessCreateDocument]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleStrSelectChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange,
    handleDateChange,
    handleFileUploadChange
  } = useForm<CreateDocumentFormData, CreateDocumentSuccessResultDto>({
    INITIAL_FORM_DATA: INITIAL_CREATE_DOCUMENT_FORM_DATA,
    validator: createDocumentFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const typeSelectItems: FormSelectProps<string>['items'] = React.useMemo(
    () =>
      allDocumentTypes.map((type) => ({
        value: type,
        title: localizationForDocumentType.get(type) ?? type
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
      title="создать документ"
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
            errors?.code ?? CREATE_DOCUMENT_FORM_PROPS_JOINED.code ?? ' '
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
            errors?.type ?? CREATE_DOCUMENT_FORM_PROPS_JOINED.type ?? ' '
          }
          error={!!errors?.type}
          onChange={handleStrSelectChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? CREATE_DOCUMENT_FORM_PROPS_JOINED.name ?? ' '
          }
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormFileUpload
          required
          name="config"
          label="файл"
          extensions={['pdf']}
          value={data.config}
          helperText={
            errors?.config ?? CREATE_DOCUMENT_FORM_PROPS_JOINED.config ?? ' '
          }
          error={!!errors?.config}
          onChange={handleFileUploadChange}
        />
        <FormTextField
          name="publicVersion"
          label="версия"
          value={data.publicVersion ?? ''}
          helperText={
            errors?.publicVersion ??
            CREATE_DOCUMENT_FORM_PROPS_JOINED.publicVersion ??
            ' '
          }
          error={!!errors?.publicVersion}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
      <FormBlock title="дополнительная информация">
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            CREATE_DOCUMENT_FORM_PROPS_JOINED.descriptionText ??
            ' '
          }
          error={!!errors?.descriptionText}
          onChange={handleTextFieldChange}
        />
        <FormDate
          name="date"
          label="дата публикации"
          value={data.date ?? null}
          helperText={
            errors?.date ?? CREATE_DOCUMENT_FORM_PROPS_JOINED.date ?? ' '
          }
          error={!!errors?.date}
          onChange={handleDateChange}
        />
        <FormUrlField
          name="url"
          label="ссылка на источник"
          value={data.url ?? ''}
          helperText={
            errors?.url ?? CREATE_DOCUMENT_FORM_PROPS_JOINED.url ?? ' '
          }
          error={!!errors?.url}
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
              addMes(CREATE_DOCUMENT_FORM_PROPS_JOINED.tagIds)
              addMes(CREATE_DOCUMENT_FORM_PROPS_JOINED.tagCodesToCreate)
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
            CREATE_DOCUMENT_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
