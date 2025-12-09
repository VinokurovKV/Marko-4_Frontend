// Project
import type { ReadTagWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/tags.dto'
import type {
  ReadCommonTopologyWithPrimaryPropsSuccessResultDto,
  ReadCommonTopologyVersionSuccessResultDto
} from '@common/dtos/server-api/common-topologies.dto'
import type { ReadTestWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/tests.dto'
import type { ReadTaskWithUpToTertiaryPropsSuccessResultDto } from '@common/dtos/server-api/tasks.dto'
import type { ReadTestReportWithUpToSecondaryPropsSuccessResultDto } from '@common/dtos/server-api/test-reports.dto'
import type { ReadTaskReportWithUpToTertiaryPropsSuccessResultDto } from '@common/dtos/server-api/task-reports.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import {
  useTagsFilteredSubscription,
  useCommonTopologySubscription,
  useTestsFilteredSubscription,
  useTaskSubscription,
  useTestReportsSubscription,
  useTaskReportSubscription
} from '~/hooks/resources'
import { TaskViewer } from '../single-resource-viewers/resources/task'
// React
import * as React from 'react'

type Tag = DtoWithoutEnums<ReadTagWithPrimaryPropsSuccessResultDto>
type CommonTopology =
  DtoWithoutEnums<ReadCommonTopologyWithPrimaryPropsSuccessResultDto>
type CommonTopologyVersion =
  DtoWithoutEnums<ReadCommonTopologyVersionSuccessResultDto>
type Test = DtoWithoutEnums<ReadTestWithPrimaryPropsSuccessResultDto>
type Task = DtoWithoutEnums<ReadTaskWithUpToTertiaryPropsSuccessResultDto>
type TestReport =
  DtoWithoutEnums<ReadTestReportWithUpToSecondaryPropsSuccessResultDto>
type TaskReport =
  DtoWithoutEnums<ReadTaskReportWithUpToTertiaryPropsSuccessResultDto>

export interface TaskScreenProps {
  taskId: number
  taskReportId: number
  initialTags: Tag[] | null
  initialCommonTopology: CommonTopology | null
  commonTopologyVersion: CommonTopologyVersion | null
  initialTests: Test[] | null
  initialTask: Task | null
  initialTestReports: TestReport[] | null
  initialTaskReport: TaskReport | null
}

export function TaskScreen(props: TaskScreenProps) {
  const [tags, setTags] = React.useState<Tag[] | null>(props.initialTags)
  const [commonTopology, setCommonTopology] =
    React.useState<CommonTopology | null>(props.initialCommonTopology)
  const [tests, setTests] = React.useState<Test[] | null>(props.initialTests)
  const [task, setTask] = React.useState<Task | null>(props.initialTask)
  const [testReports, setTestReports] = React.useState<TestReport[] | null>(
    props.initialTestReports
  )
  const [taskReport, setTaskReport] = React.useState<TaskReport | null>(
    props.initialTaskReport
  )

  const tagIds = React.useMemo(() => task?.tagIds ?? [], [task])

  const testIds = React.useMemo(
    () => (testReports ?? []).map((testReport) => testReport.testId),
    [testReports]
  )

  useTagsFilteredSubscription('PRIMARY_PROPS', tagIds, setTags)
  useCommonTopologySubscription(
    'PRIMARY_PROPS',
    task?.commonTopology.id ?? null,
    setCommonTopology
  )
  useTestsFilteredSubscription('PRIMARY_PROPS', testIds, setTests)
  useTaskSubscription('UP_TO_TERTIARY_PROPS', props.taskId, setTask)
  useTestReportsSubscription(
    'UP_TO_SECONDARY_PROPS',
    props.taskId,
    setTestReports
  )
  useTaskReportSubscription(
    'UP_TO_TERTIARY_PROPS',
    props.taskReportId,
    setTaskReport
  )

  return task !== null && taskReport !== null ? (
    <TaskViewer
      tags={tags}
      commonTopology={commonTopology}
      commonTopologyVersion={props.commonTopologyVersion}
      tests={tests}
      task={task}
      testReports={testReports}
      taskReport={taskReport}
    />
  ) : null
}
