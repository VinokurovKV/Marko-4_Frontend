// Project
import type { ReadCommonTopologyWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/common-topologies.dto'
import type { ReadTestWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/tests.dto'
import type { ReadTaskWithUpToTertiaryPropsSuccessResultDto } from '@common/dtos/server-api/tasks.dto'
import type { ReadTestReportWithUpToSecondaryPropsSuccessResultDto } from '@common/dtos/server-api/test-reports.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import {
  useCommonTopologySubscription,
  useTestsFilteredSubscription,
  useTaskSubscription,
  useTestReportsSubscription
} from '~/hooks/resources'
import { TaskViewer } from '../single-resource-viewers/resources/task'
// React
import * as React from 'react'

type CommonTopology =
  DtoWithoutEnums<ReadCommonTopologyWithPrimaryPropsSuccessResultDto>
type Test = DtoWithoutEnums<ReadTestWithPrimaryPropsSuccessResultDto>
type Task = DtoWithoutEnums<ReadTaskWithUpToTertiaryPropsSuccessResultDto>
type TestReport =
  DtoWithoutEnums<ReadTestReportWithUpToSecondaryPropsSuccessResultDto>

export interface TaskScreenProps {
  taskId: number
  initialCommonTopology: CommonTopology | null
  initialTests: Test[] | null
  initialTask: Task | null
  initialTestReports: TestReport[] | null
}

export function TaskScreen(props: TaskScreenProps) {
  const [commonTopology, setCommonTopology] =
    React.useState<CommonTopology | null>(props.initialCommonTopology)
  const [tests, setTests] = React.useState<Test[] | null>(props.initialTests)
  const [task, setTask] = React.useState<Task | null>(props.initialTask)
  const [testReports, setTestReports] = React.useState<TestReport[] | null>(
    props.initialTestReports
  )

  const testIds = React.useMemo(
    () => (testReports ?? []).map((testReport) => testReport.testId),
    [testReports]
  )

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

  return task !== null ? (
    <TaskViewer
      commonTopology={commonTopology}
      tests={tests}
      task={task}
      testReports={testReports}
    />
  ) : null
}
