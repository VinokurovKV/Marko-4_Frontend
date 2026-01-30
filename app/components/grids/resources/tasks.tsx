// Project
import type {
  CommonTopologyPrimary,
  TaskSecondary,
  TaskTertiary
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { CreateTaskFormDialog } from '~/components/forms/resources/create-task'
import { UpdateTaskFormDialog } from '~/components/forms/resources/update-task'
import { type GridProps, Grid } from '../grid'
import {
  type ActionsColProps,
  useAbortIfNotPassedCol,
  useActionsCol,
  useAllSubgroupsCountCol,
  useAllTestsCountCol,
  useCodeCol,
  useCommonTopologyVersionCol,
  useCreateTimeCol,
  useGroupsCountCol,
  // useMinLaunchTimeCol,
  useNameCol,
  usePausedCol,
  usePriorityCol,
  useSubgroupsCountCol,
  useTaskModeCol,
  useTaskStatusCol,
  useTestsCountCol,
  useWithoutDeviceConfigCol
} from '../cols'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

// const MAX_TASKS_IN_MESSAGES = 3

export interface TasksGridProps {
  commonTopologies: CommonTopologyPrimary[] | null
  tasks: TaskSecondary[]
  navigationMode?: boolean
  navigationModeSelectedRowId?: number
}

export function TasksGrid(props: TasksGridProps) {
  const navigationMode = props.navigationMode ?? false
  const navigate = useNavigate()
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet = React.useMemo(
    () =>
      meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet,
    [meta]
  )

  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)
  const [updatedTaskId, setUpdatedTaskId] = React.useState<number | null>(null)
  const [initialUpdatedTask, setInitialUpdatedTask] =
    React.useState<TaskTertiary | null>(null)

  const taskForId = React.useMemo(
    () => new Map(props.tasks.map((task) => [task.id, task])),
    [props.tasks]
  )

  const taskCodeForId = React.useMemo(
    () => new Map(props.tasks.map((task) => [task.id, task.code])),
    [props.tasks]
  )

  const rows: GridValidRowModel[] = props.tasks

  const readCols = [
    useCodeCol('id', true, '/tasks', navigationMode),
    useNameCol(),
    useTaskStatusCol(),
    useCreateTimeCol(),
    useTaskModeCol(),
    useCommonTopologyVersionCol(props.commonTopologies),
    useAllTestsCountCol(),
    useTestsCountCol(),
    useAllSubgroupsCountCol(),
    useSubgroupsCountCol(),
    useGroupsCountCol(),
    useAbortIfNotPassedCol(),
    useWithoutDeviceConfigCol(),
    usePriorityCol(),
    usePausedCol()
    // useMinLaunchTimeCol()
  ]

  const navigationModeReadCols = React.useMemo(
    () => [readCols[0], readCols[1], readCols[2]],
    [readCols]
  )

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      update: rightsSet.has('UPDATE_TASK')
        ? {
            action: async (rowId) => {
              try {
                const initialTask = await serverConnector.readTask(
                  {
                    id: rowId
                  },
                  {
                    scope: 'UP_TO_TERTIARY_PROPS'
                  }
                )
                setUpdatedTaskId(rowId)
                setInitialUpdatedTask(initialTask)
              } catch {
                notifier.showWarning(
                  `не удалось загрузить задание тестирования с идентификатором ${rowId}`
                )
              }
            }
          }
        : undefined,
      cancel: rightsSet.has('CANCEL_TASK')
        ? {
            displayCondition: (rowId) => {
              const status = taskForId.get(rowId)?.status
              return status === 'CREATED' || status === 'CREATED_PAUSED'
            },
            action: async (rowId) => {
              try {
                await serverConnector.cancelTask({
                  id: rowId
                })
                notifier.showSuccess(
                  `задание тестирования «${taskCodeForId.get(rowId) ?? ''}» отменено`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined,
      abort: rightsSet.has('ABORT_TASK')
        ? {
            displayCondition: (rowId) => {
              const status = taskForId.get(rowId)?.status
              return status === 'LAUNCHED' || status === 'LAUNCHED_PAUSED'
            },
            action: async (rowId) => {
              try {
                await serverConnector.abortTask({
                  id: rowId
                })
                notifier.showSuccess(
                  `задание тестирования «${taskCodeForId.get(rowId) ?? ''}» прервано`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined,
      pause: rightsSet.has('PAUSE_TASK')
        ? {
            displayCondition: (rowId) => {
              const status = taskForId.get(rowId)?.status
              return status === 'CREATED' || status === 'LAUNCHED'
            },
            action: async (rowId) => {
              try {
                await serverConnector.pauseTask({
                  id: rowId
                })
                notifier.showSuccess(
                  `задание тестирования «${taskCodeForId.get(rowId) ?? ''}» приостановлено`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined,
      unpause: rightsSet.has('UNPAUSE_TASK')
        ? {
            displayCondition: (rowId) => {
              const status = taskForId.get(rowId)?.status
              return status === 'CREATED_PAUSED' || status === 'LAUNCHED_PAUSED'
            },
            action: async (rowId) => {
              try {
                await serverConnector.unpauseTask({
                  id: rowId
                })
                notifier.showSuccess(
                  `задание тестирования «${taskCodeForId.get(rowId) ?? ''}» возобновлено`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined,
      delete: rightsSet.has('DELETE_TASK')
        ? {
            displayCondition: (rowId) => {
              const status = taskForId.get(rowId)?.status
              return (
                status === 'CANCELED' ||
                status === 'ABORTED_BY_USER' ||
                status === 'ABORTED_DUE_TO_NOT_PASSED' ||
                status === 'COMPLETED'
              )
            },
            prepareConfirmMessage: (rowId) =>
              `удалить задание тестирования «${taskCodeForId.get(rowId) ?? ''}»?`,
            action: async (rowId) => {
              try {
                await serverConnector.deleteTask({
                  id: rowId
                })
                notifier.showSuccess(
                  `задание тестирования «${taskCodeForId.get(rowId) ?? ''}» удалено`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined
    }),
    [notifier, rightsSet, taskForId, taskCodeForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => [
      ...(navigationMode ? navigationModeReadCols : readCols),
      ...(rightsSet.has('UPDATE_TASK') ||
      rightsSet.has('CANCEL_TASK') ||
      rightsSet.has('ABORT_TASK') ||
      rightsSet.has('PAUSE_TASK') ||
      rightsSet.has('UNPAUSE_TASK') ||
      rightsSet.has('DELETE_TASK')
        ? [actionsCol]
        : [])
    ],
    [navigationMode, rightsSet, readCols, navigationModeReadCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () =>
      [
        'testsCount',
        'allSubgroupsCount',
        'subgroupsCount',
        'groupsCount',
        'abortIfNotPassed',
        'withoutDeviceConfig',
        'priority',
        'paused',
        'minLaunchTime'
      ] as (keyof TaskSecondary)[],
    []
  )

  const createProps: GridProps['create'] = React.useMemo(
    () =>
      rightsSet.has('CREATE_TASK')
        ? {
            createModeIsActive: createModeIsActive,
            setCreateModeIsActive: setCreateModeIsActive
          }
        : undefined,
    [rightsSet, createModeIsActive, setCreateModeIsActive]
  )

  // const getDisplayedTaskCodes = React.useCallback(
  //   (ids: number[]) => {
  //     return ids
  //       .slice(0, MAX_TASKS_IN_MESSAGES)
  //       .map((id) => taskCodeForId.get(id) ?? '')
  //   },
  //   [taskCodeForId]
  // )

  // const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
  //   () =>
  //     rightsSet.has('DELETE_TASK')
  //       ? {
  //           prepareConfirmMessage: (rowIds) => {
  //             const displayedTaskCodes = getDisplayedTaskCodes(rowIds)
  //             const count = rowIds.length
  //             const hiddenCount = count - displayedTaskCodes.length
  //             return `удалить задани${count === 1 ? 'е' : 'я'} тестирования${displayedTaskCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
  //           },
  //           action: async (rowIds) => {
  //             const displayedTaskCodes = getDisplayedTaskCodes(rowIds)
  //             try {
  //               await serverConnector.deleteTasks({
  //                 ids: rowIds
  //               })
  //               const count = rowIds.length
  //               const hiddenCount = count - displayedTaskCodes.length
  //               notifier.showSuccess(
  //                 `задани${count === 1 ? 'е' : 'я'} тестирования${displayedTaskCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? 'о' : 'ы'}`
  //               )
  //             } catch (error) {
  //               notifier.showError(error)
  //               throw error
  //             }
  //           }
  //         }
  //       : undefined,
  //   [notifier, rightsSet, getDisplayedTaskCodes]
  // )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  const cancelUpdateForm = React.useCallback(() => {
    setUpdatedTaskId(null)
  }, [setUpdatedTaskId])

  const handleNavigationModeRowClick = React.useCallback(
    (rowId: number) => {
      void navigate(
        props.navigationModeSelectedRowId !== rowId
          ? `/tasks/${rowId}`
          : '/tasks'
      )
    },
    [props.navigationModeSelectedRowId, navigate]
  )

  return (
    <>
      <Grid
        localSaveKey="TASKS"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        navigationMode={navigationMode}
        selectedRowId={
          navigationMode ? props.navigationModeSelectedRowId : undefined
        }
        navigationModeOnRowClick={handleNavigationModeRowClick}
        create={createProps}
        // deleteMany={deleteManyProps}
        compactFooter={navigationMode}
      />
      <CreateTaskFormDialog
        commonTopologies={props.commonTopologies}
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateTask={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
      <UpdateTaskFormDialog
        key={updatedTaskId}
        taskId={updatedTaskId}
        setTaskId={setUpdatedTaskId}
        initialTask={initialUpdatedTask}
        onSuccessUpdateTask={cancelUpdateForm}
        onCancelClick={cancelUpdateForm}
      />
    </>
  )
}
