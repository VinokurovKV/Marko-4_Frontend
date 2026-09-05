// Project
import type { CommonTopologyPrimary, TaskSecondary } from '~/types'
import { Grid } from '../grid'
import {
  useAbortIfNotPassedCol,
  useAllSubgroupsCountCol,
  useAllTestsCountCol,
  useCodeCol,
  useCommonTopologyVersionCol,
  useCreateTimeCol,
  useGroupsCountCol,
  useNameCol,
  usePausedCol,
  usePriorityCol,
  useSubgroupsCountCol,
  useTaskModeCol,
  useTaskStatusCol,
  useTestsCountCol,
  useWithoutDeviceConfigCol
} from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

export interface SliceTasksGridProps {
  commonTopologies: CommonTopologyPrimary[] | null
  tasks: TaskSecondary[]
  selectedSliceCode?: string
}

export function SliceTasksGrid(props: SliceTasksGridProps) {
  const rows: GridValidRowModel[] = props.tasks

  const cols: GridColDef[] = [
    useCodeCol('id', true, '/tasks'),
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
  ]

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

  const title = props.selectedSliceCode
    ? `задания среза «${props.selectedSliceCode}»`
    : 'задания среза'

  return (
    <Grid
      localSaveKey="SLICE_TASKS"
      title={title}
      cols={cols}
      rows={rows}
      defaultHiddenFields={defaultHiddenFields}
      navigationMode={false}
      compactFooter
    />
  )
}
