// Project
import type { ReadTestWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/tests.dto'
import type { ReadTestReportWithUpToTertiaryPropsSuccessResultDto } from '@common/dtos/server-api/test-reports.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import {
  useTestSubscription,
  useTestReportSubscription
} from '~/hooks/resources'
import { TestReportViewer } from '../single-resource-viewers/resources/test-report'
// React
import * as React from 'react'

type Test = DtoWithoutEnums<ReadTestWithPrimaryPropsSuccessResultDto>
type TestReport =
  DtoWithoutEnums<ReadTestReportWithUpToTertiaryPropsSuccessResultDto>

export interface TestReportScreenProps {
  testReportId: number
  testId: number
  // testTransitionNum: number
  initialTest: Test | null
  initialTestReport: TestReport | null
}

export function TestReportScreen(props: TestReportScreenProps) {
  const [test, setTest] = React.useState<Test | null>(props.initialTest)
  const [testReport, setTestReport] = React.useState<TestReport | null>(
    props.initialTestReport
  )

  useTestSubscription('PRIMARY_PROPS', props.testId, setTest)
  useTestReportSubscription(
    'UP_TO_TERTIARY_PROPS',
    props.testReportId,
    setTestReport
  )

  return testReport !== null ? (
    <TestReportViewer
      // testTransitionNum={props.testTransitionNum}
      test={test}
      testReport={testReport}
    />
  ) : null
}
