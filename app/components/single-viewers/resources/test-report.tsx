// Project
import type { TestPrimary, TestReportTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { localizationForTestStatus } from '@common/localization'
import { TestStatusIcon } from '~/components/icons'
import { HorizontalTwoPartsContainer } from '~/components/containers'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerFile,
  ColumnViewerItem,
  ColumnViewerMessage,
  ColumnViewerRef,
  ColumnViewerTime
} from '../common'
// React
import * as React from 'react'
// Material UI
import Typography from '@mui/material/Typography'

const ALL_STAGES_FILTER_KEY = '__ALL_STAGES__'
const EMPTY_STAGE_FILTER_KEY = '__EMPTY_STAGE__'

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
  const [selectedStage, setSelectedStage] = React.useState(
    ALL_STAGES_FILTER_KEY
  )
  const stages = React.useMemo(() => {
    const stageSet = new Set<string>()
    let hasMessagesWithoutStage = false

    testReport.messages.forEach((message) => {
      const stage = message.stage?.trim() ?? ''
      if (stage === '') {
        hasMessagesWithoutStage = true
        return
      }

      stageSet.add(stage)
    })

    return {
      values: Array.from(stageSet).sort((firstStage, secondStage) =>
        firstStage.localeCompare(secondStage)
      ),
      hasMessagesWithoutStage
    }
  }, [testReport.messages])
  const filteredMessages = React.useMemo(() => {
    if (selectedStage === ALL_STAGES_FILTER_KEY) {
      return testReport.messages
    }

    return testReport.messages.filter((message) => {
      const stage = message.stage?.trim() ?? ''
      if (selectedStage === EMPTY_STAGE_FILTER_KEY) {
        return stage === ''
      }

      return stage === selectedStage
    })
  }, [selectedStage, testReport.messages])

  React.useEffect(() => {
    if (
      selectedStage !== ALL_STAGES_FILTER_KEY &&
      selectedStage !== EMPTY_STAGE_FILTER_KEY &&
      stages.values.includes(selectedStage) === false
    ) {
      setSelectedStage(ALL_STAGES_FILTER_KEY)
    }

    if (
      selectedStage === EMPTY_STAGE_FILTER_KEY &&
      stages.hasMessagesWithoutStage === false
    ) {
      setSelectedStage(ALL_STAGES_FILTER_KEY)
    }
  }, [selectedStage, stages])

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
      title={['Тест', `${test?.code ?? 'УДАЛЕН'}`]}
    >
      <ColumnViewer>
        <ColumnViewerBlock title="основная информация">
          <ColumnViewerRef
            field="тест"
            text={test?.code ?? 'УДАЛЕН'}
            href={`${test === null ? '/history' : ''}/tests/${testReport.testId}`}
          />
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
            <ColumnViewerFile
              {...item}
              getFileBlob={getItemFileBlob}
              withBrowse
            />
          ))}
        </ColumnViewerBlock>
      </ColumnViewer>
      <ColumnViewer>
        <ColumnViewerBlock title="логи">
          <Typography
            variant="subtitle2"
            sx={{
              mt: 0.5,
              textAlign: 'center',
              fontWeight: 700
            }}
          >
            Этап
          </Typography>
          <ColumnViewerChipsBlock
            emptyText="этапы не найдены"
            items={[
              {
                text: 'Все этапы',
                onClick: () => setSelectedStage(ALL_STAGES_FILTER_KEY),
                isActive: selectedStage === ALL_STAGES_FILTER_KEY
              },
              ...stages.values.map((stage) => ({
                text: stage,
                onClick: () => setSelectedStage(stage),
                isActive: selectedStage === stage,
                disableCapitalize: true
              })),
              ...(stages.hasMessagesWithoutStage
                ? [
                    {
                      text: 'Без этапа',
                      onClick: () => setSelectedStage(EMPTY_STAGE_FILTER_KEY),
                      isActive: selectedStage === EMPTY_STAGE_FILTER_KEY
                    }
                  ]
                : [])
            ]}
          />
          {filteredMessages.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ p: 1, textAlign: 'center', color: 'text.secondary' }}
            >
              сообщений нет
            </Typography>
          ) : (
            filteredMessages.map((message) => (
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              <ColumnViewerMessage key={`${message.time}`} message={message} />
            ))
          )}
        </ColumnViewerBlock>
      </ColumnViewer>
    </HorizontalTwoPartsContainer>
  )
}
