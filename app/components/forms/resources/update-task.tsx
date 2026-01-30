// Project
import type { UpdateTaskSuccessResultDto } from '@common/dtos/server-api/tasks.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import type { TaskTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useTaskSubscription } from '~/hooks/resources'
import { useTags } from '~/hooks/resources'
import {
  type UpdateTaskFormData,
  updateTaskFormValidator
} from '~/data/forms/resources/update-task'
import {
  createTagsAndGetIds,
  prepareArrFieldForUpdate as prepareArr,
  prepareOptionalFieldForUpdate as prepareOptional,
  prepareRequiredFieldForUpdate as prepareRequired,
  prepareTextFieldForUpdate as prepareText,
  useForm,
  FormAutocompleteFreeItemsMultipleSelect,
  FormBlock,
  // FormDateTime,
  FormDialog,
  FormMultilineTextField,
  FormNumField,
  FormTextField
} from '../common'
// React
import * as React from 'react'

const EMPTY_TAG_IDS_ARR: number[] = []
const EMPTY_TAG_CODES_ARR: string[] = []

const UPDATE_TASK_FORM_PROPS_JOINED = updateTaskFormValidator.getPromptsJoined()

export interface UpdateTaskFormDialogProps {
  taskId: number | null
  setTaskId: React.Dispatch<React.SetStateAction<number | null>>
  initialTask: TaskTertiary | null
  onSuccessUpdateTask?: (
    updateTaskResult: DtoWithoutEnums<UpdateTaskSuccessResultDto>
  ) => void
  onCancelClick?: () => void
}

export function UpdateTaskFormDialog(props: UpdateTaskFormDialogProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const selfId = React.useMemo(
    () => (meta.status !== 'AUTHENTICATED' ? null : meta.selfMeta.id),
    [meta]
  )

  const [task, setTask] = React.useState<TaskTertiary | null>(props.initialTask)
  useTaskSubscription('UP_TO_TERTIARY_PROPS', props.taskId, setTask)

  const tags = useTags('PRIMARY_PROPS', false, props.taskId !== null)

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
          types: ['UPDATE_TASK', 'DELETE_TASK', 'DELETE_TASKS']
        }
      },
      (data) => {
        ;(() => {
          if (props.taskId !== null) {
            for (const event of data) {
              if (selfId !== null && event.initiatorId !== selfId) {
                if (
                  event.type === 'UPDATE_TASK' &&
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  (event as any).config?.resource?.id === props.taskId
                ) {
                  notifier.showWarning(
                    `редактируемое задание изменено другим пользователем`
                  )
                } else if (
                  (event.type === 'DELETE_TASK' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resource?.id === props.taskId) ||
                  (event.type === 'DELETE_TASKS' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resources?.some?.(
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      (resource: any) => resource?.id === props.taskId
                    ))
                ) {
                  notifier.showWarning(
                    `редактируемое задание удалено другим пользователем`
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
  }, [props.taskId, notifier, selfId])

  const submitAction = React.useCallback(
    async (validatedData: UpdateTaskFormData) => {
      if (props.taskId === null) {
        throw new Error('отсутствует идентификатор задания')
      } else if (task === null) {
        throw new Error(
          `отсутствует доступ к текущим характеристикам редактируемого задания`
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

        return await serverConnector.updateTask({
          id: props.taskId,
          name: prepareOptional(task.name, validatedData.name),
          priority: prepareRequired(task.priority, validatedData.priority),
          minLaunchTime: prepareOptional(
            task.minLaunchTime,
            validatedData.minLaunchTime
          ),
          description: prepareText(task.description, descriptionText),
          remark: prepareText(task.remark, remarkText),
          tagIds: prepareArr(task.tagIds, [
            ...(tagIds ?? []),
            ...recentlyCreatedTagIds,
            ...newCreatedTagIds
          ])
        })
      }
    },
    [props.taskId, notifier, task, tagIdForCode]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: UpdateTaskFormData,
      updateTaskResult: DtoWithoutEnums<UpdateTaskSuccessResultDto>
    ) => {
      notifier.showSuccess(`задание тестирования «${task?.code}» изменено`)
      props.onSuccessUpdateTask?.(updateTaskResult)
    },
    [props.onSuccessUpdateTask, notifier, task]
  )

  const initialFormData: UpdateTaskFormData = React.useMemo(
    () => ({
      name: task?.name ?? undefined,
      priority: task?.priority,
      minLaunchTime: task?.minLaunchTime ?? undefined,
      descriptionText: task?.description?.text,
      remarkText: task?.remark?.text,
      tagIds: task?.tagIds
    }),
    [task]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange
    // handleDateTimeChange
  } = useForm<UpdateTaskFormData, DtoWithoutEnums<UpdateTaskSuccessResultDto>>({
    INITIAL_FORM_DATA: initialFormData,
    validator: updateTaskFormValidator,
    clearTrigger: task?.id,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const setIsActive = React.useCallback(
    (value: boolean | ((prevState: boolean) => boolean)) => {
      if (value === false) {
        props.setTaskId(null)
      } else {
        throw new Error()
      }
    },
    [props.setTaskId]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title={`изменить задание тестирования «${task?.code}»`}
      submitButtonTitle="изменить"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'к текущим значениям'
      }}
      isActive={props.taskId !== null}
      setIsActive={setIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={errors?.name ?? UPDATE_TASK_FORM_PROPS_JOINED.name ?? ' '}
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
      <FormBlock title="параметры запуска">
        <FormNumField
          required
          name="priority"
          label="приоритет"
          value={data.priority ?? ''}
          helperText={
            errors?.priority ?? UPDATE_TASK_FORM_PROPS_JOINED.priority ?? ' '
          }
          error={!!errors?.priority}
          onChange={handleTextFieldChange}
        />
        {/* <FormDateTime
          disablePast
          name="minLaunchTime"
          label="время отложенного запуска"
          value={data.minLaunchTime ?? null}
          helperText={
            errors?.minLaunchTime ??
            UPDATE_TASK_FORM_PROPS_JOINED.minLaunchTime ??
            ' '
          }
          error={!!errors?.minLaunchTime}
          onChange={handleDateTimeChange}
        /> */}
      </FormBlock>
      <FormBlock title="дополнительная информация">
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            UPDATE_TASK_FORM_PROPS_JOINED.descriptionText ??
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
              addMes(UPDATE_TASK_FORM_PROPS_JOINED.tagIds)
              addMes(UPDATE_TASK_FORM_PROPS_JOINED.tagCodesToCreate)
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
            UPDATE_TASK_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
