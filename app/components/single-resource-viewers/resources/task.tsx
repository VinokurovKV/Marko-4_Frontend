// Project
import type { ReadTagWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/tags.dto'
import type {
  ReadCommonTopologyWithPrimaryPropsSuccessResultDto,
  ReadCommonTopologyVersionSuccessResultDto
} from '@common/dtos/server-api/common-topologies.dto'
import type { ReadTestWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/tests.dto'
import type { ReadTaskWithUpToTertiaryPropsSuccessResultDto } from '@common/dtos/server-api/tasks.dto'
import type { ReadTestReportWithUpToSecondaryPropsSuccessResultDto } from '@common/dtos/server-api/test-reports.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import {
  localizationForTaskMode,
  localizationForTaskResultToSave,
  localizationForTaskStatus
} from '~/localization'
import { FlagIcon, TaskModeIcon, TaskStatusIcon } from '~/components/icons'
import { TwoPartsContainer } from '~/components/containers/two-parts-container'
import { TopologyConfigSchema } from '~/components/topologies/topology-config-schema'
import { TestReportsGrid } from '~/components/grids/resources/test-reports'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerItem,
  ColumnViewerRef,
  ColumnViewerText,
  ColumnViewerTime
} from '../common'
// React
import * as React from 'react'
// Material UI
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'

type Tag = DtoWithoutEnums<ReadTagWithPrimaryPropsSuccessResultDto>
type CommonTopology =
  DtoWithoutEnums<ReadCommonTopologyWithPrimaryPropsSuccessResultDto>
type CommonTopologyVersion =
  DtoWithoutEnums<ReadCommonTopologyVersionSuccessResultDto>
type Test = DtoWithoutEnums<ReadTestWithPrimaryPropsSuccessResultDto>
type Task = DtoWithoutEnums<ReadTaskWithUpToTertiaryPropsSuccessResultDto>
type TestReport =
  DtoWithoutEnums<ReadTestReportWithUpToSecondaryPropsSuccessResultDto>

const EMPTY_TESTS_ARR: Test[] = []
const EMPTY_TEST_REPORTS_ARR: TestReport[] = []

export interface TaskViewerProps {
  tags: Tag[] | null
  commonTopology: CommonTopology | null
  commonTopologyVersion: CommonTopologyVersion | null
  tests: Test[] | null
  task: Task
  testReports: TestReport[] | null
}

export function TaskViewer(props: TaskViewerProps) {
  const task = props.task

  const tagCodeForId = React.useMemo(
    () => new Map((props.tags ?? []).map((tag) => [tag.id, tag.code])),
    [props.tags]
  )

  return (
    <Stack sx={{ height: '100%', overflow: 'hidden' }}>
      <Container
        sx={{
          height: '45%',
          pl: '0px !important',
          pb: '1rem',
          pr: '0px !important'
        }}
      >
        <TwoPartsContainer
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
        </TwoPartsContainer>
      </Container>
      <Container
        sx={{ height: '55%', pl: '0px !important', pr: '0px !important' }}
      >
        <TestReportsGrid
          tests={props.tests ?? EMPTY_TESTS_ARR}
          task={props.task}
          testReports={props.testReports ?? EMPTY_TEST_REPORTS_ARR}
        />
      </Container>
    </Stack>
  )
}
