// Project
import type { CreateSubgroupSuccessResultDto } from '@common/dtos/server-api/subgroups.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import type { GroupPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useTags, useTests } from '~/hooks/resources'
import {
  type CreateSubgroupFormData,
  INITIAL_CREATE_SUBGROUP_FORM_DATA,
  createSubgroupFormValidator
} from '~/data/forms/resources/create-subgroup'
import {
  createTagsAndGetIds,
  useForm,
  FormAutocompleteFreeItemsMultipleSelect,
  FormAutocompleteMultipleSelect,
  FormAutocompleteSingleSelect,
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
const EMPTY_TEST_IDS_ARR: number[] = []

const CREATE_SUBGROUP_FORM_PROPS_JOINED =
  createSubgroupFormValidator.getPromptsJoined()

export interface CreateSubgroupFormDialogProps {
  groups: GroupPrimary[] | null
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessCreateSubgroup?: (
    createSubgroupResult: DtoWithoutEnums<CreateSubgroupSuccessResultDto>
  ) => void
  onCancelClick?: () => void
}

export function CreateSubgroupFormDialog(props: CreateSubgroupFormDialogProps) {
  const notifier = useNotifier()

  const tags = useTags('PRIMARY_PROPS', false, props.createModeIsActive)
  const tests = useTests('PRIMARY_PROPS', false, props.createModeIsActive)

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
    async (validatedData: CreateSubgroupFormData) => {
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

      return await serverConnector.createSubgroup({
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
      data: CreateSubgroupFormData,
      createSubgroupResult: DtoWithoutEnums<CreateSubgroupSuccessResultDto>
    ) => {
      notifier.showSuccess(`подгруппа тестов «${data.code}» создана`)
      props.onSuccessCreateSubgroup?.(createSubgroupResult)
    },
    [props.onSuccessCreateSubgroup, notifier]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleAutocompleteSingleSelectChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange
  } = useForm<
    CreateSubgroupFormData,
    DtoWithoutEnums<CreateSubgroupSuccessResultDto>
  >({
    INITIAL_FORM_DATA: INITIAL_CREATE_SUBGROUP_FORM_DATA,
    validator: createSubgroupFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const testIds = React.useMemo(
    () => tests?.map((test) => test.id) ?? [],
    [tests]
  )

  const testCodeForId = React.useMemo(
    () => new Map((tests ?? []).map((test) => [test.id, test.code])),
    [tests]
  )

  const groupIds = React.useMemo(
    () => props.groups?.map((group) => group.id) ?? [],
    [props.groups]
  )

  const groupCodeForId = React.useMemo(
    () => new Map((props.groups ?? []).map((group) => [group.id, group.code])),
    [props.groups]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title="создать подгруппу тестов"
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
            errors?.code ?? CREATE_SUBGROUP_FORM_PROPS_JOINED.code ?? ' '
          }
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? CREATE_SUBGROUP_FORM_PROPS_JOINED.name ?? ' '
          }
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormAutocompleteMultipleSelect
          name="testIds"
          label="тесты"
          possibleValues={testIds}
          titleForValue={testCodeForId}
          values={data.testIds ?? EMPTY_TEST_IDS_ARR}
          helperText={
            errors?.testIds ?? CREATE_SUBGROUP_FORM_PROPS_JOINED.testIds ?? ' '
          }
          error={!!errors?.testIds}
          onChange={handleAutocompleteMultipleSelectChange}
        />
        <FormAutocompleteSingleSelect
          name="groupId"
          label="группа"
          possibleValues={groupIds}
          titleForValue={groupCodeForId}
          value={data.groupId ?? null}
          helperText={
            errors?.groupId ?? CREATE_SUBGROUP_FORM_PROPS_JOINED.groupId ?? ' '
          }
          error={!!errors?.groupId}
          onChange={handleAutocompleteSingleSelectChange}
        />
        <FormNumField
          name="numInGroup"
          label="номер в группе"
          value={data.numInGroup ?? ''}
          helperText={
            errors?.numInGroup ??
            CREATE_SUBGROUP_FORM_PROPS_JOINED.numInGroup ??
            ' '
          }
          error={!!errors?.numInGroup}
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
            CREATE_SUBGROUP_FORM_PROPS_JOINED.descriptionText ??
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
              addMes(CREATE_SUBGROUP_FORM_PROPS_JOINED.tagIds)
              addMes(CREATE_SUBGROUP_FORM_PROPS_JOINED.tagCodesToCreate)
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
            CREATE_SUBGROUP_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
