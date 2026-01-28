// Project
import type { UpdateSubgroupSuccessResultDto } from '@common/dtos/server-api/subgroups.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import type { GroupPrimary, SubgroupTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useSubgroupSubscription } from '~/hooks/resources'
import { useTags, useTests } from '~/hooks/resources'
import {
  type UpdateSubgroupFormData,
  updateSubgroupFormValidator
} from '~/data/forms/resources/update-subgroup'
import {
  createTagsAndGetIds,
  prepareArrFieldForUpdate as prepareArr,
  prepareOptionalFieldForUpdate as prepareOptional,
  prepareRequiredFieldForUpdate as prepareRequired,
  prepareTextFieldForUpdate as prepareText,
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

const UPDATE_SUBGROUP_FORM_PROPS_JOINED =
  updateSubgroupFormValidator.getPromptsJoined()

export interface UpdateSubgroupFormDialogProps {
  groups: GroupPrimary[] | null
  subgroupId: number | null
  setSubgroupId: React.Dispatch<React.SetStateAction<number | null>>
  initialSubgroup: SubgroupTertiary | null
  onSuccessUpdateSubgroup?: (
    updateSubgroupResult: DtoWithoutEnums<UpdateSubgroupSuccessResultDto>
  ) => void
  onCancelClick?: () => void
}

export function UpdateSubgroupFormDialog(props: UpdateSubgroupFormDialogProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const selfId = React.useMemo(
    () => (meta.status !== 'AUTHENTICATED' ? null : meta.selfMeta.id),
    [meta]
  )

  const [subgroup, setSubgroup] = React.useState<SubgroupTertiary | null>(
    props.initialSubgroup
  )
  useSubgroupSubscription('UP_TO_TERTIARY_PROPS', props.subgroupId, setSubgroup)

  const tags = useTags('PRIMARY_PROPS', false, props.subgroupId !== null)
  const tests = useTests('PRIMARY_PROPS', false, props.subgroupId !== null)

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
          types: ['UPDATE_SUBGROUP', 'DELETE_SUBGROUP', 'DELETE_SUBGROUPS']
        }
      },
      (data) => {
        ;(() => {
          if (props.subgroupId !== null) {
            for (const event of data) {
              if (selfId !== null && event.initiatorId !== selfId) {
                if (
                  event.type === 'UPDATE_SUBGROUP' &&
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  (event as any).config?.resource?.id === props.subgroupId
                ) {
                  notifier.showWarning(
                    `редактируемая подгруппа тестов изменена другим пользователем`
                  )
                } else if (
                  (event.type === 'DELETE_SUBGROUP' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resource?.id === props.subgroupId) ||
                  (event.type === 'DELETE_SUBGROUPS' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resources?.some?.(
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      (resource: any) => resource?.id === props.subgroupId
                    ))
                ) {
                  notifier.showWarning(
                    `редактируемая подгруппа тестов удалена другим пользователем`
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
  }, [props.subgroupId, notifier, selfId])

  const submitAction = React.useCallback(
    async (validatedData: UpdateSubgroupFormData) => {
      if (props.subgroupId === null) {
        throw new Error('отсутствует идентификатор подгруппы тестов')
      } else if (subgroup === null) {
        throw new Error(
          `отсутствует доступ к текущим характеристикам редактируемой подгруппы тестов`
        )
      } else {
        const { descriptionText, remarkText, tagIds, tagCodesToCreate } =
          validatedData

        const recentlyCreatedTagIds = (tagCodesToCreate ?? [])
          .map((tagCodeToCreate) => tagIdForCode.get(tagCodeToCreate))
          .filter((tagId) => tagId !== undefined)

        const newCreatedTagIds = await createTagsAndGetIds(
          tagIdForCode,
          tagCodesToCreate,
          notifier
        )

        return await serverConnector.updateSubgroup({
          id: props.subgroupId,
          code: prepareRequired(subgroup.code, validatedData.code),
          name: prepareOptional(subgroup.name, validatedData.name),
          numInGroup: prepareOptional(
            subgroup.numInGroup,
            validatedData.numInGroup
          ),
          groupId: prepareOptional(subgroup.groupId, validatedData.groupId),
          description: prepareText(subgroup.description, descriptionText),
          remark: prepareText(subgroup.remark, remarkText),
          tagIds: prepareArr(subgroup.tagIds, [
            ...(tagIds ?? []),
            ...recentlyCreatedTagIds,
            ...newCreatedTagIds
          ]),
          testIds: prepareArr(subgroup.testIds, validatedData.testIds)
        })
      }
    },
    [props.subgroupId, notifier, subgroup, tagIdForCode]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: UpdateSubgroupFormData,
      updateSubgroupResult: DtoWithoutEnums<UpdateSubgroupSuccessResultDto>
    ) => {
      notifier.showSuccess(`подгруппа тестов «${subgroup?.code}» изменена`)
      props.onSuccessUpdateSubgroup?.(updateSubgroupResult)
    },
    [props.onSuccessUpdateSubgroup, notifier]
  )

  const initialFormData: UpdateSubgroupFormData = React.useMemo(
    () => ({
      code: subgroup?.code ?? '',
      name: subgroup?.name ?? undefined,
      numInGroup: subgroup?.numInGroup ?? undefined,
      groupId: subgroup?.groupId ?? undefined,
      descriptionText: subgroup?.description?.text,
      remarkText: subgroup?.remark?.text,
      tagIds: subgroup?.tagIds,
      testIds: subgroup?.testIds
    }),
    [subgroup]
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
    UpdateSubgroupFormData,
    DtoWithoutEnums<UpdateSubgroupSuccessResultDto>
  >({
    INITIAL_FORM_DATA: initialFormData,
    validator: updateSubgroupFormValidator,
    clearTrigger: subgroup?.id,
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

  const setIsActive = React.useCallback(
    (value: boolean | ((prevState: boolean) => boolean)) => {
      if (value === false) {
        props.setSubgroupId(null)
      } else {
        throw new Error()
      }
    },
    [props.setSubgroupId]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title="изменить подгруппу тестов"
      submitButtonTitle="изменить"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'к текущим значениям'
      }}
      isActive={props.subgroupId !== null}
      setIsActive={setIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="code"
          label="код"
          value={data.code}
          helperText={
            errors?.code ?? UPDATE_SUBGROUP_FORM_PROPS_JOINED.code ?? ' '
          }
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? UPDATE_SUBGROUP_FORM_PROPS_JOINED.name ?? ' '
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
            errors?.testIds ?? UPDATE_SUBGROUP_FORM_PROPS_JOINED.testIds ?? ' '
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
            errors?.groupId ?? UPDATE_SUBGROUP_FORM_PROPS_JOINED.groupId ?? ' '
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
            UPDATE_SUBGROUP_FORM_PROPS_JOINED.numInGroup ??
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
            UPDATE_SUBGROUP_FORM_PROPS_JOINED.descriptionText ??
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
              addMes(UPDATE_SUBGROUP_FORM_PROPS_JOINED.tagIds)
              addMes(UPDATE_SUBGROUP_FORM_PROPS_JOINED.tagCodesToCreate)
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
            UPDATE_SUBGROUP_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
