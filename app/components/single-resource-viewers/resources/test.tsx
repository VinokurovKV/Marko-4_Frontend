// Project
import { calculateTopologyConfig } from '@common/utilities'
import type {
  TagPrimary,
  RequirementPrimary,
  CommonTopologyTertiary,
  TopologyTertiary,
  DbcPrimary,
  TestTemplatePrimary,
  TestTertiary,
  SubgroupPrimary,
  GroupPrimary
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { FlagIcon } from '~/components/icons'
import { MarkdownView } from '~/components/markdown-view'
import {
  HorizontalTwoPartsContainer,
  VerticalTwoPartsContainer
} from '~/components/containers'
import { TopologyConfigSchema } from '~/components/topologies/topology-config-schema'
import { type FormSelectProps, FormSelect } from '~/components/forms/common'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerFile,
  ColumnViewerItem,
  ColumnViewerRef,
  ColumnViewerText
} from '../common'
// React
import * as React from 'react'
// Material UI
import type { SelectChangeEvent } from '@mui/material/Select'
import Stack from '@mui/material/Stack'

export interface TestViewerProps {
  tags: TagPrimary[] | null
  requirements: RequirementPrimary[] | null
  commonTopology: CommonTopologyTertiary | null
  topology: TopologyTertiary | null
  dbcs: DbcPrimary[] | null
  testTemplate: TestTemplatePrimary | null
  test: TestTertiary
  subgroup: SubgroupPrimary | null
  group: GroupPrimary | null
}

export function TestViewer({
  tags,
  requirements,
  commonTopology,
  topology,
  dbcs,
  testTemplate,
  test,
  subgroup,
  group
}: TestViewerProps) {
  const notifier = useNotifier()

  const [requirementId, setRequirementId] = React.useState<number | null>(null)

  const requirementCodeForId = React.useMemo(
    () =>
      new Map(
        (requirements ?? []).map((requirement) => [
          requirement.id,
          requirement.code
        ])
      ),
    [requirements]
  )

  const dbcCodeForId = React.useMemo(
    () => new Map((dbcs ?? []).map((dbc) => [dbc.id, dbc.code])),
    [dbcs]
  )

  const getConfigBlob = React.useCallback(async () => {
    try {
      const data = await serverConnector.readTestConfig({
        id: test.id
      })
      return data
    } catch (error) {
      notifier.showError(error)
      return null
    }
  }, [test])

  const getDeltaBlob = React.useCallback(
    async (vertexIndex: number) => {
      try {
        const data = await serverConnector.readTestDelta({
          id: test.id,
          vertexName: test.vertexes[vertexIndex].vertexName
        })
        return data
      } catch (error) {
        notifier.showError(error)
        return null
      }
    },
    [test]
  )

  const getDbcConfigBlob = React.useCallback(
    async (dbcId: number) => {
      try {
        const data = await serverConnector.readDbcConfig({
          id: dbcId
        })
        return data
      } catch (error) {
        notifier.showError(error)
        return null
      }
    },
    [test]
  )

  const filteredDescriptionText = React.useMemo(() => {
    if (test.description?.text === undefined || test.description.text === '') {
      return null
    }
    const requirementCode =
      requirementId !== null
        ? (requirementCodeForId.get(requirementId) ?? null)
        : null
    const text = test.description.text
    let preparedText = ''
    let currentPosition = 0
    while (true) {
      const startMarkerPosition = text.indexOf('<ТР', currentPosition)
      if (startMarkerPosition === -1) {
        preparedText += text.substring(currentPosition)
        return preparedText
      }
      preparedText += text.substring(currentPosition, startMarkerPosition)
      const newLinePosition = text.indexOf('\n', startMarkerPosition + 3)
      if (newLinePosition === -1) {
        return preparedText
      }
      const requirementsBlockWithColon = text
        .substring(newLinePosition, startMarkerPosition + 3)
        .trim()
      const requirementsBlock = requirementsBlockWithColon.substring(
        0,
        requirementsBlockWithColon.length - 1
      )
      const requirementCodes = requirementsBlock
        .split(',')
        .map((requirementCode) => requirementCode.trim())
      const endMarkerPosition = text.indexOf('ТР>', startMarkerPosition + 3)
      if (
        requirementCode !== null &&
        requirementCodes.includes(requirementCode)
      ) {
        if (endMarkerPosition === -1) {
          preparedText += text.substring(newLinePosition + 1)
          return preparedText
        }
        preparedText += text.substring(newLinePosition + 1, endMarkerPosition)
      }
      currentPosition = endMarkerPosition + 4
    }
  }, [test.description, requirementId, requirementCodeForId])

  // const handleRequirementChange = React.useCallback(
  //   (event: { name: string; value: number | undefined }) => {
  //     setRequirementId(event.value ?? null)
  //   },
  //   [setRequirementId]
  // )

  const handleRequirementChange = React.useCallback(
    (event: SelectChangeEvent<number | string>) => {
      setRequirementId((event.target.value ?? null) as number | null)
    },
    [setRequirementId]
  )

  const requirementSelectItems: FormSelectProps<number>['items'] =
    React.useMemo(
      () =>
        (requirements ?? []).map((requirement) => ({
          value: requirement.id,
          title: requirement.code
        })),
      [requirements, requirementCodeForId]
    )

  const topologyConfig = React.useMemo(() => {
    return commonTopology !== null && topology !== null
      ? calculateTopologyConfig(commonTopology.config, topology.vertexNames)
      : null
  }, [commonTopology, topology])

  return (
    <HorizontalTwoPartsContainer
      proportions="EQUAL"
      title={['Тест', `${test.code}`]}
    >
      <VerticalTwoPartsContainer proportions="50_50">
        <ColumnViewer>
          <ColumnViewerBlock title="основная информация">
            <ColumnViewerItem field="код" val={test.code} />
            <ColumnViewerItem field="название" val={test.name ?? ''} />
            <ColumnViewerItem
              field="готовность"
              Icon={
                <FlagIcon
                  flag={test.prepared}
                  truePrompt="все необходимые конфигурации загружены"
                  falsePrompt="не все необходимые конфигурации загружены"
                />
              }
            />
            <ColumnViewerRef
              field="группа"
              text={group?.code}
              href={group !== null ? `/groups/${group.id}` : undefined}
            />
            <ColumnViewerRef
              field="подгруппа"
              text={subgroup?.code}
              href={
                test.subgroupId !== null
                  ? `/subgroups/${test.subgroupId}`
                  : undefined
              }
            />
            <ColumnViewerItem
              field="номер в подгруппе"
              val={test.numInSubgroup ?? undefined}
            />
            <ColumnViewerRef
              field="общая топология"
              text={commonTopology?.code ?? '???'}
              href={
                commonTopology !== null
                  ? `/common-topologies/${commonTopology?.id}`
                  : undefined
              }
            />
            <ColumnViewerRef
              field="топология"
              text={topology?.code ?? '???'}
              href={`/topologies/${test.topologyId}`}
            />
            <ColumnViewerRef
              field="шаблон"
              text={testTemplate?.code}
              href={
                test.testTemplateId !== null
                  ? `/test-templates/${test.testTemplateId}`
                  : undefined
              }
            />
            {test.config !== null ? (
              <ColumnViewerFile
                id={test.id}
                field="конфигурация"
                name={`${test.code}-config`}
                size={test.config.size}
                format={test.config.format}
                getFileBlob={getConfigBlob}
              />
            ) : (
              <ColumnViewerItem field="конфигурация" />
            )}
          </ColumnViewerBlock>
          {test.vertexes.map((vertex, vertexIndex) => (
            <ColumnViewerBlock
              key={vertex.vertexName}
              title={`вершина ${vertex.vertexName}`}
            >
              <>
                {vertex.dbcId !== null ? (
                  <>
                    <ColumnViewerRef
                      field="базовая конфигурация"
                      text={dbcCodeForId.get(vertex.dbcId) ?? '???'}
                      href={`/dbcs/${test.topologyId}`}
                    />
                    <ColumnViewerFile
                      id={vertexIndex}
                      name={`${dbcCodeForId.get(vertex.dbcId) ?? '???'}`}
                      format="ZIP"
                      getFileBlob={getDbcConfigBlob}
                      hideTitle
                    />
                  </>
                ) : (
                  <ColumnViewerItem field="базовая конфигурация" val="нет" />
                )}
                {vertex.delta !== null ? (
                  <ColumnViewerFile
                    id={vertexIndex}
                    field="delta-конфигурация"
                    name={`${test.code}-${vertex.vertexName}-delta`}
                    size={vertex.delta.size}
                    format={vertex.delta.format}
                    getFileBlob={getDeltaBlob}
                  />
                ) : (
                  <ColumnViewerItem field="delta-конфигурация" val="нет" />
                )}
              </>
            </ColumnViewerBlock>
          ))}
          <ColumnViewerBlock title="теги">
            <ColumnViewerChipsBlock
              emptyText={tags !== null ? 'нет' : '???'}
              items={(tags ?? []).map((tag) => ({
                text: tag.code,
                href: `/tags/${tag.id}`
              }))}
            />
          </ColumnViewerBlock>
        </ColumnViewer>
        <TopologyConfigSchema
          config={topologyConfig}
          nullConfigTitle="схема топологии"
        />
      </VerticalTwoPartsContainer>
      <VerticalTwoPartsContainer proportions="30_70">
        <ColumnViewer>
          <Stack spacing={-2}>
            {/* <FormAutocompleteSingleSelect
                name="requirementId"
                label="отображаемое в описании требование"
                possibleValues={requirementIds}
                titleForValue={requirementCodeForId}
                value={requirementId}
                onChange={handleRequirementChange}
              /> */}
            <FormSelect
              name="requirementId"
              label="отображаемое в описании требование"
              items={requirementSelectItems}
              value={requirementId ?? ''}
              onChange={handleRequirementChange}
            />
          </Stack>
          <ColumnViewerBlock title="покрываемые требования">
            <ColumnViewerChipsBlock
              emptyText="нет"
              items={(requirements ?? []).map((requirement) => ({
                text: requirement.code,
                href: `/requirements/${requirement.id}`
              }))}
            />
          </ColumnViewerBlock>
        </ColumnViewer>

        <ColumnViewer>
          <ColumnViewerBlock title="описание">
            {filteredDescriptionText !== null ? (
              <MarkdownView text={filteredDescriptionText} />
            ) : (
              <ColumnViewerText emptyText="нет" />
            )}
          </ColumnViewerBlock>
        </ColumnViewer>
      </VerticalTwoPartsContainer>
    </HorizontalTwoPartsContainer>
  )
}
