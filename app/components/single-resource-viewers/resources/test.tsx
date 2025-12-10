// Project
import type { ReadTagWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/tags.dto'
import type { ReadRequirementsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/requirements.dto'
import type { ReadCommonTopologyWithUpToTertiaryPropsSuccessResultDto } from '@common/dtos/server-api/common-topologies.dto'
import type { ReadTopologyWithUpToTertiaryPropsSuccessResultDto } from '@common/dtos/server-api/topologies.dto'
import type { ReadDbcsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/dbcs.dto'
import type { ReadTestTemplateWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/test-templates.dto'
import type { ReadTestWithUpToTertiaryPropsSuccessResultDto } from '@common/dtos/server-api/tests.dto'
import type { ReadSubgroupWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/subgroups.dto'
import type { ReadGroupWithPrimaryPropsSuccessResultDto } from '@common/dtos/server-api/groups.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { calculateTopologyConfig } from '@common/utilities'
import { FlagIcon } from '~/components/icons'
import { MarkdownView } from '~/components/markdown-view'
import { TwoPartsContainer } from '~/components/containers/two-parts-container'
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
import Container from '@mui/material/Container'
import type { SelectChangeEvent } from '@mui/material/Select'
import Stack from '@mui/material/Stack'

type Tag = DtoWithoutEnums<ReadTagWithPrimaryPropsSuccessResultDto>
type Requirement =
  DtoWithoutEnums<ReadRequirementsWithPrimaryPropsSuccessResultItemDto>
type CommonTopology =
  DtoWithoutEnums<ReadCommonTopologyWithUpToTertiaryPropsSuccessResultDto>
type Topology =
  DtoWithoutEnums<ReadTopologyWithUpToTertiaryPropsSuccessResultDto>
type Dbc = DtoWithoutEnums<ReadDbcsWithPrimaryPropsSuccessResultItemDto>
type TestTemplate =
  DtoWithoutEnums<ReadTestTemplateWithPrimaryPropsSuccessResultDto>
type Test = DtoWithoutEnums<ReadTestWithUpToTertiaryPropsSuccessResultDto>
type Subgroup = DtoWithoutEnums<ReadSubgroupWithPrimaryPropsSuccessResultDto>
type Group = DtoWithoutEnums<ReadGroupWithPrimaryPropsSuccessResultDto>

export interface TestViewerProps {
  tags: Tag[] | null
  requirements: Requirement[] | null
  commonTopology: CommonTopology | null
  topology: Topology | null
  dbcs: Dbc[] | null
  testTemplate: TestTemplate | null
  test: Test
  subgroup: Subgroup | null
  group: Group | null
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

  const tagCodeForId = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.id, tag.code])),
    [tags]
  )

  const requirementIds = React.useMemo(
    () => (requirements ?? []).map((requirement) => requirement.id),
    [requirements]
  )

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
        requirementIds.map((requirementId) => ({
          value: requirementId,
          title: requirementCodeForId.get(requirementId) ?? ''
        })),
      [requirementIds, requirementCodeForId]
    )

  const topologyConfig = React.useMemo(() => {
    return commonTopology !== null && topology !== null
      ? calculateTopologyConfig(commonTopology.config, topology.vertexNames)
      : null
  }, [commonTopology, topology])

  return (
    <TwoPartsContainer
      proportions="EQUAL"
      title={`Тест ${test.code}${test.name !== null ? ` (${test.name})` : ''}`}
    >
      <Stack sx={{ height: '100%', overflow: 'hidden' }}>
        <Container
          sx={{
            height: '50%',
            pl: '0px !important',
            pb: '1rem',
            pr: '0px !important'
          }}
        >
          <ColumnViewer>
            <ColumnViewerBlock title="основная информация">
              <ColumnViewerItem field="код" val={test.code} />
              <ColumnViewerItem field="название" val={test.name ?? ''} />
              <ColumnViewerItem
                field="готовность"
                Icon={<FlagIcon flag={test.prepared} />}
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
                <ColumnViewerItem
                  field="готовность"
                  Icon={<FlagIcon flag={test.prepared} />}
                />
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
                        href={`/topologies/${test.topologyId}`}
                      />
                      <ColumnViewerFile
                        id={vertexIndex}
                        field="файл базовой конфигурации"
                        name={`${dbcCodeForId.get(vertex.dbcId) ?? '???'}`}
                        format="ZIP"
                        getFileBlob={getDbcConfigBlob}
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
                emptyText="нет"
                items={test.tagIds.map((tagId) => ({
                  text: tagCodeForId.get(tagId) ?? '',
                  href: `/tags/${tagId}`
                }))}
              />
            </ColumnViewerBlock>
          </ColumnViewer>
        </Container>
        <Container
          sx={{
            height: '50%',
            pl: '0px !important',
            pb: '1rem',
            pr: '0px !important'
          }}
        >
          <TopologyConfigSchema
            config={topologyConfig}
            nullConfigTitle="схема топологии"
          />
        </Container>
      </Stack>
      <Stack sx={{ height: '100%', overflow: 'hidden' }}>
        <Container
          sx={{
            height: '30%',
            pl: '0px !important',
            pb: '1rem',
            pr: '0px !important'
          }}
        >
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
                items={requirementIds.map((requirementId) => ({
                  text: requirementCodeForId.get(requirementId) ?? '',
                  href: `/requirements/${requirementId}`
                }))}
              />
            </ColumnViewerBlock>
          </ColumnViewer>
        </Container>
        <Container
          sx={{
            height: '70%',
            pl: '0px !important',
            pb: '1rem',
            pr: '0px !important'
          }}
        >
          <ColumnViewer>
            <ColumnViewerBlock title="описание">
              {filteredDescriptionText !== null ? (
                <MarkdownView text={filteredDescriptionText} />
              ) : (
                <ColumnViewerText emptyText="нет" />
              )}
            </ColumnViewerBlock>
          </ColumnViewer>
        </Container>
      </Stack>
    </TwoPartsContainer>
  )
}
