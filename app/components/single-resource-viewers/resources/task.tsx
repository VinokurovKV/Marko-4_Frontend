// Project
import type { ReadCommonTopologyWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/common-topologies.dto'
import type { ReadTestWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/tests.dto'
import type { ReadTaskWithUpToTertiaryPropsSuccessResultDto } from '@common/dtos/server-api/tasks.dto'
import type { ReadTestReportWithUpToSecondaryPropsSuccessResultDto } from '@common/dtos/server-api/test-reports.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
// import { TestReportsGrid } from '~/components/grids/resources/test-reports'
// Material UI
import Typography from '@mui/material/Typography'

type CommonTopology =
  DtoWithoutEnums<ReadCommonTopologyWithPrimaryPropsSuccessResultDto>
type Test = DtoWithoutEnums<ReadTestWithPrimaryPropsSuccessResultDto>
type Task = DtoWithoutEnums<ReadTaskWithUpToTertiaryPropsSuccessResultDto>
type TestReport =
  DtoWithoutEnums<ReadTestReportWithUpToSecondaryPropsSuccessResultDto>

export interface TaskViewerProps {
  commonTopology: CommonTopology | null
  tests: Test[] | null
  task: Task
  testReports: TestReport[] | null
}

export function TaskViewer(props: TaskViewerProps) {
  return (
    <>
      <Typography sx={{ overflow: 'scroll' }}>
        {JSON.stringify(props.task)}
      </Typography>
      {/* <TestReportsGrid tests={props.tests} testReports={props.testReports} /> */}
    </>
  )
}
