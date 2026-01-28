// Project
import type { CreateGroupSuccessResultDto } from '@common/dtos/server-api/groups.dto'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useTags, useSubgroups } from '~/hooks/resources'
import {
  type CreateGroupFormData,
  INITIAL_CREATE_GROUP_FORM_DATA,
  createGroupFormValidator
} from '~/data/forms/resources/create-group'
import {
  createTagsAndGetIds,
  useForm,
  FormAutocompleteFreeItemsMultipleSelect,
  FormAutocompleteMultipleSelect,
  FormBlock,
  FormDialog,
  FormMultilineTextField,
  FormNumField,
  FormTextField
} from '../common'
// React
import * as React from 'react'

const EMPTY_TAG_IDS_ARR: number[] = []
const EMPTY_TAG_CODES_ARR: string[] = []
const EMPTY_SUBGROUP_IDS_ARR: number[] = []

const CREATE_GROUP_FORM_PROPS_JOINED =
  createGroupFormValidator.getPromptsJoined()

export interface CreateGroupFormDialogProps {
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessCreateGroup?: (
    createGroupResult: CreateGroupSuccessResultDto
  ) => void
  onCancelClick?: () => void
}

export function CreateGroupFormDialog(props: CreateGroupFormDialogProps) {
  const notifier = useNotifier()

  const tags = useTags('PRIMARY_PROPS', false, props.createModeIsActive)
  const subgroups = useSubgroups(
    'PRIMARY_PROPS',
    false,
    props.createModeIsActive
  )

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
    async (validatedData: CreateGroupFormData) => {
      const {
        descriptionText,
        remarkText,
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

      return await serverConnector.createGroup({
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
            ? [...(tagIds ?? []), ...recentlyCreatedTagIds, ...newCreatedTagIds]
            : undefined
      })
    },
    [notifier, tagIdForCode]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: CreateGroupFormData,
      createGroupResult: CreateGroupSuccessResultDto
    ) => {
      notifier.showSuccess(`группа тестов «${data.code}» создана`)
      props.onSuccessCreateGroup?.(createGroupResult)
    },
    [props.onSuccessCreateGroup, notifier]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange
  } = useForm<CreateGroupFormData, CreateGroupSuccessResultDto>({
    INITIAL_FORM_DATA: INITIAL_CREATE_GROUP_FORM_DATA,
    validator: createGroupFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const subgroupIds = React.useMemo(
    () => subgroups?.map((subgroup) => subgroup.id) ?? [],
    [subgroups]
  )

  const subgroupCodeForId = React.useMemo(
    () =>
      new Map(
        (subgroups ?? []).map((subgroup) => [subgroup.id, subgroup.code])
      ),
    [subgroups]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title="создать группу тестов"
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
            errors?.code ?? CREATE_GROUP_FORM_PROPS_JOINED.code ?? ' '
          }
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? CREATE_GROUP_FORM_PROPS_JOINED.name ?? ' '
          }
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormAutocompleteMultipleSelect
          name="subgroupIds"
          label="подгруппы"
          possibleValues={subgroupIds}
          titleForValue={subgroupCodeForId}
          values={data.subgroupIds ?? EMPTY_SUBGROUP_IDS_ARR}
          helperText={
            errors?.subgroupIds ??
            CREATE_GROUP_FORM_PROPS_JOINED.subgroupIds ??
            ' '
          }
          error={!!errors?.subgroupIds}
          onChange={handleAutocompleteMultipleSelectChange}
        />
        <FormNumField
          name="num"
          label="номер"
          value={data.num ?? ''}
          helperText={errors?.num ?? CREATE_GROUP_FORM_PROPS_JOINED.num ?? ' '}
          error={!!errors?.num}
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
            CREATE_GROUP_FORM_PROPS_JOINED.descriptionText ??
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
              addMes(CREATE_GROUP_FORM_PROPS_JOINED.tagIds)
              addMes(CREATE_GROUP_FORM_PROPS_JOINED.tagCodesToCreate)
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
            CREATE_GROUP_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
