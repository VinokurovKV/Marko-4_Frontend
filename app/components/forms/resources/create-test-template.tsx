// Project
import type { ReadTagsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/tags.dto'
import type { CreateTestTemplateSuccessResultDto } from '@common/dtos/server-api/test-templates.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import {
  type CreateTestTemplateFormData,
  INITIAL_CREATE_TEST_TEMPLATE_FORM_DATA,
  createTestTemplateFormValidator
} from '~/data/forms/resources/create-test-template'
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

type Tag = DtoWithoutEnums<ReadTagsWithPrimaryPropsSuccessResultItemDto>

const CREATE_TEST_TEMPLATE_FORM_PROPS_JOINED =
  createTestTemplateFormValidator.getPromptsJoined()

export interface CreateTestTemplateFormDialogProps {
  tags: Tag[] | null
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessCreateTestTemplate?: (
    createTestTemplateResult: CreateTestTemplateSuccessResultDto
  ) => void
  onCancelClick?: () => void
}

export function CreateTestTemplateFormDialog(
  props: CreateTestTemplateFormDialogProps
) {
  const notifier = useNotifier()

  const submitAction = React.useCallback(
    async (validatedData: CreateTestTemplateFormData) => {
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

      return await serverConnector.createTestTemplate(
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
            (tagIds ?? []).length + createdTagIds.length > 0
              ? [...(tagIds ?? []), ...createdTagIds]
              : undefined
        },
        config
      )
    },
    []
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: CreateTestTemplateFormData,
      createTestTemplateResult: CreateTestTemplateSuccessResultDto
    ) => {
      notifier.showSuccess(`шаблон теста '${data.code}' создан`)
      props.onSuccessCreateTestTemplate?.(createTestTemplateResult)
    },
    [props.onSuccessCreateTestTemplate]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange,
    handleFileUploadChange
  } = useForm<CreateTestTemplateFormData, CreateTestTemplateSuccessResultDto>({
    INITIAL_FORM_DATA: INITIAL_CREATE_TEST_TEMPLATE_FORM_DATA,
    validator: createTestTemplateFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

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
      title="создать шаблон теста"
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
            errors?.code ?? CREATE_TEST_TEMPLATE_FORM_PROPS_JOINED.code ?? ' '
          }
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? CREATE_TEST_TEMPLATE_FORM_PROPS_JOINED.name ?? ' '
          }
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormFileUpload
          required
          name="config"
          label="файл"
          extensions={['zip']}
          value={data.config}
          helperText={
            errors?.config ??
            CREATE_TEST_TEMPLATE_FORM_PROPS_JOINED.config ??
            ' '
          }
          error={!!errors?.config}
          onChange={handleFileUploadChange}
        />
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            CREATE_TEST_TEMPLATE_FORM_PROPS_JOINED.descriptionText ??
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
              addMes(CREATE_TEST_TEMPLATE_FORM_PROPS_JOINED.tagIds)
              addMes(CREATE_TEST_TEMPLATE_FORM_PROPS_JOINED.tagCodesToCreate)
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
            CREATE_TEST_TEMPLATE_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
