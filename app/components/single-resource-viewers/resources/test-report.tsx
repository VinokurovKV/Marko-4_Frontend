// Project
import type { ReadTestWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/tests.dto'
import type { ReadTestReportWithUpToTertiaryPropsSuccessResultDto } from '@common/dtos/server-api/test-reports.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { localizationForTestStatus } from '~/localization'
import { TestStatusIcon } from '~/components/icons'
import { TwoPartsContainer } from '~/components/containers/two-parts-container'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerFile,
  ColumnViewerItem,
  ColumnViewerMessage,
  ColumnViewerRef,
  ColumnViewerTime
} from '../common'
// React
import * as React from 'react'

type Test = DtoWithoutEnums<ReadTestWithPrimaryPropsSuccessResultDto>
type TestReport =
  DtoWithoutEnums<ReadTestReportWithUpToTertiaryPropsSuccessResultDto>

export interface TestReportViewerProps {
  // testTransitionNum: number
  test: Test | null
  testReport: TestReport
}

export function TestReportViewer(props: TestReportViewerProps) {
  const notifier = useNotifier()
  const test = props.test
  const testReport = props.testReport

  const getItemFileBlob = React.useCallback(
    async (itemId: number) => {
      try {
        const data = await serverConnector.readTestReportItemData({
          id: testReport.id,
          itemId: itemId
        })
        return data
      } catch (error) {
        notifier.showError(error)
        return null
      }
    },
    [testReport.id]
  )

  return (
    <TwoPartsContainer
      proportions="EQUAL"
      title={`Тест ${test?.code ?? 'УДАЛЕН'}`}
    >
      <ColumnViewer>
        <ColumnViewerBlock title="основная информация">
          {test !== null ? (
            <ColumnViewerRef
              field="тест"
              text={test?.code ?? 'УДАЛЕН'}
              href={`/tests/${test.id}`}
            />
          ) : (
            <ColumnViewerItem field="тест" val="УДАЛЕН" />
          )}
          <ColumnViewerItem
            field="статус"
            val={localizationForTestStatus.get(testReport.status)}
            Icon={<TestStatusIcon status={testReport.status} />}
          />
          <ColumnViewerTime
            field="время запуска"
            time={testReport.launchTime}
          />
          <ColumnViewerTime
            field="время завершения"
            time={testReport.finishTime}
          />
        </ColumnViewerBlock>
        <ColumnViewerBlock title="результаты">
          {testReport.items.map((item) => (
            <ColumnViewerFile {...item} getFileBlob={getItemFileBlob} />
          ))}
        </ColumnViewerBlock>
      </ColumnViewer>
      <ColumnViewer>
        <ColumnViewerBlock title="логи">
          {testReport.messages.map((message) => (
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            <ColumnViewerMessage key={`${message.time}`} message={message} />
          ))}
        </ColumnViewerBlock>
      </ColumnViewer>
    </TwoPartsContainer>
  )
}
