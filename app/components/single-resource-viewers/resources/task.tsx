// Project
import type {
  TagPrimary,
  CommonTopologyPrimary,
  CommonTopologyVersion,
  TestPrimary,
  TaskTertiary,
  TestReportSecondary,
  TaskReportTertiary
} from '~/types'
import {
  localizationForTaskMode,
  localizationForTaskResultToSave,
  localizationForTaskStatus
} from '~/localization'
import {
  FlagIcon,
  TaskModeIcon,
  TaskStatusIcon,
  TestStatusIcon
} from '~/components/icons'
import {
  HorizontalTwoPartsContainer,
  VerticalTwoPartsContainer
} from '~/components/containers'
import { TopologyConfigSchema } from '~/components/topologies/topology-config-schema'
import { TestReportsGrid } from '~/components/grids/resources/test-reports'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerIconsBlock,
  type ColumnViewerIconsBlockProps,
  ColumnViewerItem,
  ColumnViewerRef,
  ColumnViewerText,
  ColumnViewerTime
} from '../common'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'

const EMPTY_TESTS_ARR: TestPrimary[] = []
const EMPTY_TEST_REPORTS_ARR: TestReportSecondary[] = []

export interface TaskViewerProps {
  tags: TagPrimary[] | null
  commonTopology: CommonTopologyPrimary | null
  commonTopologyVersion: CommonTopologyVersion | null
  tests: TestPrimary[] | null
  task: TaskTertiary
  testReports: TestReportSecondary[] | null
  taskReport: TaskReportTertiary
  children: React.ReactNode
}

export function TaskViewer(props: TaskViewerProps) {
  const task = props.task
  const taskReport = props.taskReport

  const { pathname } = useLocation()
  const match = matchPath('/tasks/:taskId?/:testId?', pathname)
  const withTest = match?.params.testId !== undefined
  const testId = React.useMemo(() => {
    const parsed =
      match?.params.testId !== undefined ? parseInt(match.params.testId) : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])
  const testReportId = React.useMemo(
    () =>
      props.testReports?.find((testReport) => testReport.testId === testId)
        ?.id ?? null,
    [props.testReports, testId]
  )

  const tagCodeForId = React.useMemo(
    () => new Map((props.tags ?? []).map((tag) => [tag.id, tag.code])),
    [props.tags]
  )

  const testsCountsItems = React.useMemo(() => {
    const items: ColumnViewerIconsBlockProps['items'] = []
    if (taskReport.waitingCount > 0) {
      items.push({
        Icon: <TestStatusIcon status="WAITING" />,
        text: taskReport.waitingCount
      })
    }
    if (taskReport.canceledCount > 0) {
      items.push({
        Icon: <TestStatusIcon status="CANCELED" />,
        text: taskReport.canceledCount
      })
    }
    if (taskReport.launchedCount > 0) {
      items.push({
        Icon: <TestStatusIcon status="LAUNCHED" />,
        text: taskReport.launchedCount
      })
    }
    if (taskReport.abortedCount > 0) {
      items.push({
        Icon: <TestStatusIcon status="ABORTED" />,
        text: taskReport.abortedCount
      })
    }
    if (taskReport.errorCount > 0) {
      items.push({
        Icon: <TestStatusIcon status="ERROR" />,
        text: taskReport.errorCount
      })
    }
    if (taskReport.failedCount > 0) {
      items.push({
        Icon: <TestStatusIcon status="FAILED" />,
        text: taskReport.failedCount
      })
    }
    if (taskReport.passedCount > 0) {
      items.push({
        Icon: <TestStatusIcon status="PASSED" />,
        text: taskReport.passedCount
      })
    }
    return items
  }, [props.tags])

  return (
    <VerticalTwoPartsContainer proportions="45_55">
      <HorizontalTwoPartsContainer
        proportions="EQUAL"
        title={`Задание ${task.code}${task.name !== null ? ` (${task.name})` : ''}`}
      >
        <ColumnViewer>
          <ColumnViewerBlock title="основная информация">
            <ColumnViewerItem field="код" val={task.code} />
            <ColumnViewerItem field="название" val={task.name ?? ''} />
            <ColumnViewerItem
              field="статус"
              val={localizationForTaskStatus.get(task.status)}
              Icon={<TaskStatusIcon status={task.status} />}
            />
            <ColumnViewerItem
              field="режим"
              val={localizationForTaskMode.get(task.mode)}
              Icon={<TaskModeIcon mode={task.mode} />}
            />
            <ColumnViewerTime field="время создания" time={task.createTime} />
            <ColumnViewerTime
              field="время запуска"
              time={taskReport.launchTime}
            />
            <ColumnViewerTime
              field="время завершения"
              time={taskReport.finishTime}
            />
            {task.minLaunchTime !== null ? (
              <ColumnViewerTime
                field="минимальное время запуска"
                time={task.minLaunchTime}
              />
            ) : null}
            <ColumnViewerRef
              field="общая топология"
              text={props.commonTopology?.code ?? 'УДАЛЕНА'}
              href={`/common-topologies/${props.commonTopologyVersion?.resourceId}/versions/${props.commonTopologyVersion?.transitionNum}`}
            />
            {/* <ColumnViewerItem
                field="приостановлено"
                Icon={<FlagIcon flag={task.paused} />}
              /> */}
          </ColumnViewerBlock>
          <ColumnViewerBlock title="счетчики тестов">
            <ColumnViewerItem field="всего" val={taskReport.totalCount} />
            <ColumnViewerIconsBlock items={testsCountsItems} />
          </ColumnViewerBlock>
          <ColumnViewerBlock title="описание">
            <ColumnViewerText emptyText="нет" text={task.description?.text} />
          </ColumnViewerBlock>
          <ColumnViewerBlock title="тестовая иерархия">
            <ColumnViewerItem
              field="число всех тестов"
              val={task.allTestsCount}
            />
            <ColumnViewerItem field="число тестов" val={task.testsCount} />
            <ColumnViewerItem
              field="число всех подгрупп"
              val={task.allSubgroupsCount}
            />
            <ColumnViewerItem
              field="число подгрупп"
              val={task.subgroupsCount}
            />
            <ColumnViewerItem field="число групп" val={task.groupsCount} />
          </ColumnViewerBlock>
          <ColumnViewerBlock title="параметры запуска">
            <ColumnViewerItem
              field="прерывать при непрохождении либо ошибке"
              Icon={<FlagIcon flag={task.abortIfNotPassed} />}
            />
            <ColumnViewerItem
              field="отключить конфигурирование устройств перед запуском тестов"
              Icon={<FlagIcon flag={task.withoutDeviceConfig} />}
            />
            <ColumnViewerItem field="приоритет" val={task.priority} />
          </ColumnViewerBlock>
          <ColumnViewerBlock title="сохраняемые результаты">
            <ColumnViewerChipsBlock
              emptyText="нет"
              items={task.resultsToSave.map((resultToSave) => ({
                text: localizationForTaskResultToSave.get(resultToSave) ?? ''
              }))}
            />
          </ColumnViewerBlock>
          <ColumnViewerBlock title="теги">
            <ColumnViewerChipsBlock
              emptyText="нет"
              items={task.tagIds.map((tagId) => ({
                text: tagCodeForId.get(tagId) ?? '',
                href: `/tags/${tagId}`
              }))}
            />
          </ColumnViewerBlock>
        </ColumnViewer>
        <TopologyConfigSchema
          config={props.commonTopologyVersion?.version.config ?? null}
          nullConfigTitle="схема общей топологии"
        />
      </HorizontalTwoPartsContainer>
      <HorizontalTwoPartsContainer
        proportions={props.children ? 'ONE_TWO' : 'ONE_ZERO'}
      >
        <TestReportsGrid
          tests={props.tests ?? EMPTY_TESTS_ARR}
          testReports={props.testReports ?? EMPTY_TEST_REPORTS_ARR}
          navigationMode={withTest}
          navigationModeSelectedRowId={
            withTest ? (testReportId ?? undefined) : undefined
          }
        />
        {props.children ? props.children : null}
      </HorizontalTwoPartsContainer>
    </VerticalTwoPartsContainer>
  )
}
