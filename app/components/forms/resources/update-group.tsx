// Project
import type { UpdateGroupSuccessResultDto } from '@common/dtos/server-api/groups.dto'
import type { GroupTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useGroupSubscription } from '~/hooks/resources'
import { useTags, useSubgroups } from '~/hooks/resources'
import {
  type UpdateGroupFormData,
  updateGroupFormValidator
} from '~/data/forms/resources/update-group'
import {
  createTagsAndGetIds,
  prepareArrFieldForUpdate as prepareArr,
  prepareOptionalFieldForUpdate as prepareOptional,
  prepareRequiredFieldForUpdate as prepareRequired,
  prepareTextFieldForUpdate as prepareText,
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

const UPDATE_GROUP_FORM_PROPS_JOINED =
  updateGroupFormValidator.getPromptsJoined()

export interface UpdateGroupFormDialogProps {
  groupId: number | null
  setGroupId: React.Dispatch<React.SetStateAction<number | null>>
  initialGroup: GroupTertiary | null
  onSuccessUpdateGroup?: (
    updateGroupResult: UpdateGroupSuccessResultDto
  ) => void
  onCancelClick?: () => void
}

export function UpdateGroupFormDialog(props: UpdateGroupFormDialogProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const selfId = React.useMemo(
    () => (meta.status !== 'AUTHENTICATED' ? null : meta.selfMeta.id),
    [meta]
  )

  const [group, setGroup] = React.useState<GroupTertiary | null>(
    props.initialGroup
  )
  useGroupSubscription('UP_TO_TERTIARY_PROPS', props.groupId, setGroup)

  const tags = useTags('PRIMARY_PROPS', false, props.groupId !== null)
  const subgroups = useSubgroups('PRIMARY_PROPS', false, props.groupId !== null)

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
          types: ['UPDATE_GROUP', 'DELETE_GROUP', 'DELETE_GROUPS']
        }
      },
      (data) => {
        ;(() => {
          if (props.groupId !== null) {
            for (const event of data) {
              if (selfId !== null && event.initiatorId !== selfId) {
                if (
                  event.type === 'UPDATE_GROUP' &&
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  (event as any).config?.resource?.id === props.groupId
                ) {
                  notifier.showWarning(
                    `редактируемая группа тестов изменена другим пользователем`
                  )
                } else if (
                  (event.type === 'DELETE_GROUP' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resource?.id === props.groupId) ||
                  (event.type === 'DELETE_GROUPS' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resources?.some?.(
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      (resource: any) => resource?.id === props.groupId
                    ))
                ) {
                  notifier.showWarning(
                    `редактируемая группа тестов удалена другим пользователем`
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
  }, [props.groupId, notifier, selfId])

  const submitAction = React.useCallback(
    async (validatedData: UpdateGroupFormData) => {
      if (props.groupId === null) {
        throw new Error('отсутствует идентификатор группы тестов')
      } else if (group === null) {
        throw new Error(
          `отсутствует доступ к текущим характеристикам редактируемой группы тестов`
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

        return await serverConnector.updateGroup({
          id: props.groupId,
          code: prepareRequired(group.code, validatedData.code),
          name: prepareOptional(group.name, validatedData.name),
          num: prepareOptional(group.num, validatedData.num),
          description: prepareText(group.description, descriptionText),
          remark: prepareText(group.remark, remarkText),
          tagIds: prepareArr(group.tagIds, [
            ...(tagIds ?? []),
            ...recentlyCreatedTagIds,
            ...newCreatedTagIds
          ]),
          subgroupIds: prepareArr(group.subgroupIds, validatedData.subgroupIds)
        })
      }
    },
    [props.groupId, notifier, group, tagIdForCode]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: UpdateGroupFormData,
      updateGroupResult: UpdateGroupSuccessResultDto
    ) => {
      notifier.showSuccess(`группа тестов «${group?.code}» изменена`)
      props.onSuccessUpdateGroup?.(updateGroupResult)
    },
    [props.onSuccessUpdateGroup, notifier, group]
  )

  const initialFormData: UpdateGroupFormData = React.useMemo(
    () => ({
      code: group?.code ?? '',
      name: group?.name ?? undefined,
      num: group?.num ?? undefined,
      descriptionText: group?.description?.text,
      remarkText: group?.remark?.text,
      tagIds: group?.tagIds,
      subgroupIds: group?.subgroupIds
    }),
    [group]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange
  } = useForm<UpdateGroupFormData, UpdateGroupSuccessResultDto>({
    INITIAL_FORM_DATA: initialFormData,
    validator: updateGroupFormValidator,
    clearTrigger: group?.id,
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

  const setIsActive = React.useCallback(
    (value: boolean | ((prevState: boolean) => boolean)) => {
      if (value === false) {
        props.setGroupId(null)
      } else {
        throw new Error()
      }
    },
    [props.setGroupId]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title={`изменить группу тестов «${group?.code}»`}
      submitButtonTitle="изменить"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'к текущим значениям'
      }}
      isActive={props.groupId !== null}
      setIsActive={setIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="code"
          label="код"
          value={data.code}
          helperText={
            errors?.code ?? UPDATE_GROUP_FORM_PROPS_JOINED.code ?? ' '
          }
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? UPDATE_GROUP_FORM_PROPS_JOINED.name ?? ' '
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
            UPDATE_GROUP_FORM_PROPS_JOINED.subgroupIds ??
            ' '
          }
          error={!!errors?.subgroupIds}
          onChange={handleAutocompleteMultipleSelectChange}
        />
        <FormNumField
          name="num"
          label="номер"
          value={data.num ?? ''}
          helperText={errors?.num ?? UPDATE_GROUP_FORM_PROPS_JOINED.num ?? ' '}
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
            UPDATE_GROUP_FORM_PROPS_JOINED.descriptionText ??
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
              addMes(UPDATE_GROUP_FORM_PROPS_JOINED.tagIds)
              addMes(UPDATE_GROUP_FORM_PROPS_JOINED.tagCodesToCreate)
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
            UPDATE_GROUP_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
