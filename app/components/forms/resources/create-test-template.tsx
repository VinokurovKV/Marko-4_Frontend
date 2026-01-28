// Project
import type { CreateTestTemplateSuccessResultDto } from '@common/dtos/server-api/test-templates.dto'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useTags } from '~/hooks/resources'
import {
  type CreateTestTemplateFormData,
  INITIAL_CREATE_TEST_TEMPLATE_FORM_DATA,
  createTestTemplateFormValidator
} from '~/data/forms/resources/create-test-template'
import {
  useForm,
  createTagsAndGetIds,
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

const CREATE_TEST_TEMPLATE_FORM_PROPS_JOINED =
  createTestTemplateFormValidator.getPromptsJoined()

export interface CreateTestTemplateFormDialogProps {
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
    async (validatedData: CreateTestTemplateFormData) => {
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

      const newCreatedTagIds = await createTagsAndGetIds(
        tagIdForCode,
        tagCodesToCreate,
        notifier
      )

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
        config
      )
    },
    [notifier, tagIdForCode]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: CreateTestTemplateFormData,
      createTestTemplateResult: CreateTestTemplateSuccessResultDto
    ) => {
      notifier.showSuccess(`шаблон теста «${data.code}» создан`)
      props.onSuccessCreateTestTemplate?.(createTestTemplateResult)
    },
    [props.onSuccessCreateTestTemplate, notifier]
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

  return (
    <FormDialog
      formInternal={formInternal}
      title="создать шаблон теста"
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
          name="config"
          label="конфигурация"
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
