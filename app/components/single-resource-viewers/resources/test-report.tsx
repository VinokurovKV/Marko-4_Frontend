// Project
import type { TestPrimary, TestReportTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { localizationForTestStatus } from '~/localization'
import { TestStatusIcon } from '~/components/icons'
import { HorizontalTwoPartsContainer } from '~/components/containers'
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

export interface TestReportViewerProps {
  // testTransitionNum: number
  // TODO: change server api to load testTransitionNum
  test: TestPrimary | null
  testReport: TestReportTertiary
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
    <HorizontalTwoPartsContainer
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
    </HorizontalTwoPartsContainer>
  )
}
