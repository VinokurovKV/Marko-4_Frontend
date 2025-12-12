// Project
import type { CreateTestSuccessResultDto } from '@common/dtos/server-api/tests.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import type {
  TopologyPrimary,
  DbcPrimary,
  TestTemplatePrimary,
  SubgroupPrimary
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useChangeDetector } from '~/hooks/change-detector'
import {
  useTags,
  useCoverages,
  useCommonTopology,
  useTopology
} from '~/hooks/resources'
import {
  type CreateTestFormData,
  MAX_VERTEXES_IN_TOPOLOGY,
  INITIAL_CREATE_TEST_FORM_DATA,
  getDbcIdField,
  getDeltaField,
  createTestFormValidator
} from '~/data/forms/resources/create-test'
import { TopologySchema } from '~/components/topologies/topology-schema'
import {
  useForm,
  FormAutocompleteFreeItemsMultipleSelect,
  FormAutocompleteMultipleSelect,
  FormAutocompleteSingleSelect,
  FormBlock,
  FormDialog,
  FormFileUpload,
  FormMultilineTextField,
  FormNumField,
  FormTextField
} from '../common'
// React
import * as React from 'react'

const EMPTY_TAG_IDS_ARR: number[] = []
const EMPTY_TAG_CODES_ARR: string[] = []
const EMPTY_COVERAGE_IDS_ARR: number[] = []
const EMPTY_VERTEX_NAMES_ARR: string[] = []

const CREATE_TEST_FORM_PROPS_JOINED = createTestFormValidator.getPromptsJoined()

export interface CreateTestFormDialogProps {
  topologies: TopologyPrimary[] | null
  dbcs: DbcPrimary[] | null
  testTemplates: TestTemplatePrimary[] | null
  subgroups: SubgroupPrimary[] | null
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessCreateTest?: (
    createTestResult: DtoWithoutEnums<CreateTestSuccessResultDto>
  ) => void
  onCancelClick?: () => void
}

export function CreateTestFormDialog(props: CreateTestFormDialogProps) {
  const notifier = useNotifier()

  const tags = useTags('PRIMARY_PROPS', false, props.createModeIsActive)
  const coverages = useCoverages(
    'PRIMARY_PROPS',
    false,
    props.createModeIsActive
  )

  const tagIds = React.useMemo(() => tags?.map((tag) => tag.id) ?? [], [tags])

  const tagCodeForId = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.id, tag.code])),
    [tags]
  )

  const tagIdForCode = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.code, tag.id])),
    [tags]
  )

  const readTopologyNonGeneratorVertexNamesSorted = React.useCallback(
    async (topologyId: number, errorMessage: string) => {
      try {
        const topology = await serverConnector.readTopology(
          {
            id: topologyId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        const commonTopology = await serverConnector.readCommonTopology(
          {
            id: topology.commonTopologyId
          },
          {
            scope: 'UP_TO_TERTIARY_PROPS'
          }
        )
        const generatorVertexNamesSet = new Set(
          commonTopology.config.vertexes
            .filter((vertex) => vertex.isGenerator)
            .map((vertex) => vertex.name)
        )
        return topology.vertexNames
          .filter(
            (vertexName) => generatorVertexNamesSet.has(vertexName) === false
          )
          .toSorted()
      } catch (error) {
        notifier.showError(error, errorMessage)
        return EMPTY_VERTEX_NAMES_ARR
      }
    },
    [notifier]
  )

  const submitAction = React.useCallback(
    async (validatedData: CreateTestFormData) => {
      const {
        descriptionText,
        remarkText,
        config,
        tagIds,
        tagCodesToCreate,
        ...truncatedData
      } = validatedData

      const recentlyCreatedTagIds = (tagCodesToCreate ?? [])
        .map((tagCodeToCreate) => tagIdForCode.get(tagCodeToCreate))
        .filter((tagId) => tagId !== undefined)

      const newCreatedTagIds = (
        await Promise.allSettled(
          (tagCodesToCreate ?? [])
            .filter(
              (tagCodeToCreate) => tagIdForCode.has(tagCodeToCreate) === false
            )
            .map((tagCodeToCreate) =>
              (async () => {
                try {
                  return await serverConnector
                    .createTag({
                      code: tagCodeToCreate
                    })
                    .then((result) => result.result.createdResourceId)
                } catch (error) {
                  notifier.showError(
                    error,
                    `не удалось создать тег '${tagCodeToCreate}'`
                  )
                  return null
                }
              })()
            )
        )
      )
        .map((result) => (result.status === 'fulfilled' ? result.value : null))
        .filter((result) => result !== null)

      const vertexNamesSorted = await (async () => {
        if (validatedData.topologyId === undefined) {
          return EMPTY_VERTEX_NAMES_ARR
        }
        return await readTopologyNonGeneratorVertexNamesSorted(
          validatedData.topologyId,
          'не удалось загрузить топологию при обработке введенных данных о вершинах'
        )
      })()

      const deltas = vertexNamesSorted.map(
        (vertexName, vertexIndex) =>
          truncatedData[getDeltaField(vertexIndex)] as File | undefined
      )

      const deltaTransferIndexes = (() => {
        let lastUsedTransferIndex = -1
        const deltaTransferIndexes: (number | undefined)[] = []
        for (let vertexIndex = 0; vertexIndex < deltas.length; vertexIndex++) {
          if (deltas[vertexIndex] !== undefined) {
            lastUsedTransferIndex++
            deltaTransferIndexes.push(lastUsedTransferIndex)
          } else {
            deltaTransferIndexes.push(undefined)
          }
        }
        return deltaTransferIndexes
      })()

      return await serverConnector.createTest(
        {
          code: truncatedData.code,
          name: truncatedData.name,
          numInSubgroup: truncatedData.numInSubgroup,
          topologyId: truncatedData.topologyId!,
          testTemplateId: truncatedData.testTemplateId,
          subgroupId: truncatedData.subgroupId,
          description:
            descriptionText !== undefined
              ? {
                  format: 'PLAIN',
                  text: descriptionText
                }
              : undefined,
          remark:
            remarkText !== undefined
              ? {
                  format: 'PLAIN',
                  text: remarkText
                }
              : undefined,
          tagIds:
            (tagIds ?? []).length +
              recentlyCreatedTagIds.length +
              newCreatedTagIds.length >
            0
              ? [
                  ...(tagIds ?? []),
                  ...recentlyCreatedTagIds,
                  ...newCreatedTagIds
                ]
              : undefined,
          coverageIds: truncatedData.coverageIds,
          vertexes: vertexNamesSorted.map((vertexName, vertexIndex) => ({
            vertexName: vertexName,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            dbcId: truncatedData[getDbcIdField(vertexIndex)],
            deltaIndex: deltaTransferIndexes[vertexIndex]
          }))
        },
        config,
        deltas.filter((delta) => delta !== undefined),
        undefined
      )
    },
    [notifier, tagIdForCode, readTopologyNonGeneratorVertexNamesSorted]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: CreateTestFormData,
      createTestResult: DtoWithoutEnums<CreateTestSuccessResultDto>
    ) => {
      notifier.showSuccess(`тест '${data.code}' создан`)
      props.onSuccessCreateTest?.(createTestResult)
    },
    [props.onSuccessCreateTest, notifier]
  )

  const {
    formInternal,
    data,
    errors,
    clearFields,
    handleTextFieldChange,
    handleAutocompleteSingleSelectChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange,
    handleFileUploadChange
  } = useForm<CreateTestFormData, DtoWithoutEnums<CreateTestSuccessResultDto>>({
    INITIAL_FORM_DATA: INITIAL_CREATE_TEST_FORM_DATA,
    validator: createTestFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const coverageIds = React.useMemo(
    () => coverages?.map((coverage) => coverage.id) ?? [],
    [coverages]
  )

  const coverageCodeForId = React.useMemo(
    () =>
      new Map(
        (coverages ?? []).map((coverage) => [coverage.id, coverage.code])
      ),
    [coverages]
  )

  const topologyIds = React.useMemo(
    () => props.topologies?.map((topology) => topology.id) ?? [],
    [props.topologies]
  )

  const topologyCodeForId = React.useMemo(
    () =>
      new Map(
        (props.topologies ?? []).map((topology) => [topology.id, topology.code])
      ),
    [props.topologies]
  )

  const topology = useTopology(
    'UP_TO_TERTIARY_PROPS',
    data.topologyId ?? null,
    true,
    props.createModeIsActive
  )

  const commonTopology = useCommonTopology(
    'UP_TO_TERTIARY_PROPS',
    topology?.commonTopologyId ?? null,
    true,
    props.createModeIsActive
  )

  const vertexNames = React.useMemo(() => {
    if (topology === null || commonTopology === null) {
      return EMPTY_VERTEX_NAMES_ARR
    } else {
      const generatorVertexNamesSet = new Set(
        commonTopology.config.vertexes
          .filter((vertex) => vertex.isGenerator)
          .map((vertex) => vertex.name)
      )
      return topology.vertexNames
        .filter(
          (vertexName) => generatorVertexNamesSet.has(vertexName) === false
        )
        .toSorted()
    }
  }, [topology, commonTopology])

  const dbcIds = React.useMemo(
    () => props.dbcs?.map((dbc) => dbc.id) ?? [],
    [props.dbcs]
  )

  const dbcCodeForId = React.useMemo(
    () => new Map((props.dbcs ?? []).map((dbc) => [dbc.id, dbc.code])),
    [props.dbcs]
  )

  const testTemplateIds = React.useMemo(
    () => props.testTemplates?.map((testTemplate) => testTemplate.id) ?? [],
    [props.testTemplates]
  )

  const testTemplateCodeForId = React.useMemo(
    () =>
      new Map(
        (props.testTemplates ?? []).map((testTemplate) => [
          testTemplate.id,
          testTemplate.code
        ])
      ),
    [props.testTemplates]
  )

  const subgroupIds = React.useMemo(
    () => props.subgroups?.map((subgroup) => subgroup.id) ?? [],
    [props.subgroups]
  )

  const subgroupCodeForId = React.useMemo(
    () =>
      new Map(
        (props.subgroups ?? []).map((subgroup) => [subgroup.id, subgroup.code])
      ),
    [props.subgroups]
  )

  const vertexNamesTruncated = React.useMemo(() => {
    const vertexNamesTruncated = [...vertexNames]
    if (vertexNamesTruncated.length > MAX_VERTEXES_IN_TOPOLOGY) {
      vertexNamesTruncated.length = MAX_VERTEXES_IN_TOPOLOGY
    }
    return vertexNamesTruncated
  }, [vertexNames])

  useChangeDetector({
    detectedObjects: [vertexNamesTruncated],
    otherDependencies: [clearFields],
    onChange: ([oldVertexNames]) => {
      clearFields(
        Array.from(Array(oldVertexNames.length).keys()).flatMap(
          (vertexIndex) => [
            getDbcIdField(vertexIndex),
            getDeltaField(vertexIndex)
          ]
        )
      )
    }
  })

  return (
    <FormDialog
      formInternal={formInternal}
      title="создать тест"
      submitButtonLabel="создать"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'очистить'
      }}
      createModeIsActive={props.createModeIsActive}
      setCreateModeIsActive={props.setCreateModeIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="code"
          label="код"
          value={data.code}
          helperText={errors?.code ?? CREATE_TEST_FORM_PROPS_JOINED.code ?? ' '}
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={errors?.name ?? CREATE_TEST_FORM_PROPS_JOINED.name ?? ' '}
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormAutocompleteSingleSelect
          name="subgroupId"
          label="подгруппа"
          possibleValues={subgroupIds}
          titleForValue={subgroupCodeForId}
          value={data.subgroupId ?? null}
          helperText={
            errors?.subgroupId ??
            CREATE_TEST_FORM_PROPS_JOINED.subgroupId ??
            ' '
          }
          error={!!errors?.subgroupId}
          onChange={handleAutocompleteSingleSelectChange}
        />
        <FormNumField
          name="numInSubgroup"
          label="номер в подгруппе"
          value={data.numInSubgroup ?? ''}
          helperText={
            errors?.numInSubgroup ??
            CREATE_TEST_FORM_PROPS_JOINED.numInSubgroup ??
            ' '
          }
          error={!!errors?.numInSubgroup}
          onChange={handleTextFieldChange}
        />
        <FormAutocompleteMultipleSelect
          name="coverageIds"
          label="покрытия"
          possibleValues={coverageIds}
          titleForValue={coverageCodeForId}
          values={data.coverageIds ?? EMPTY_COVERAGE_IDS_ARR}
          helperText={
            errors?.coverageIds ??
            CREATE_TEST_FORM_PROPS_JOINED.coverageIds ??
            ' '
          }
          error={!!errors?.coverageIds}
          onChange={handleAutocompleteMultipleSelectChange}
        />
        <FormAutocompleteSingleSelect
          name="testTemplateId"
          label="шаблон"
          possibleValues={testTemplateIds}
          titleForValue={testTemplateCodeForId}
          value={data.testTemplateId ?? null}
          helperText={
            errors?.testTemplateId ??
            CREATE_TEST_FORM_PROPS_JOINED.testTemplateId ??
            ' '
          }
          error={!!errors?.testTemplateId}
          onChange={handleAutocompleteSingleSelectChange}
        />
        <FormFileUpload
          name="config"
          label="конфигурация"
          extensions={['zip']}
          value={data.config}
          helperText={
            errors?.config ?? CREATE_TEST_FORM_PROPS_JOINED.config ?? ' '
          }
          error={!!errors?.config}
          onChange={handleFileUploadChange}
        />
      </FormBlock>
      <FormBlock title="топология">
        <FormAutocompleteSingleSelect
          required
          name="topologyId"
          label="топология"
          possibleValues={topologyIds}
          titleForValue={topologyCodeForId}
          value={data.topologyId ?? null}
          helperText={
            errors?.topologyId ??
            CREATE_TEST_FORM_PROPS_JOINED.topologyId ??
            ' '
          }
          error={!!errors?.topologyId}
          onChange={handleAutocompleteSingleSelectChange}
        />
        <TopologySchema topologyId={data.topologyId ?? null} />
        {vertexNamesTruncated.map((vertexName, vertexIndex) => {
          const dbcIdField = getDbcIdField(vertexIndex)
          const deltaField = getDeltaField(vertexIndex)
          return (
            <FormBlock key={vertexIndex} title={`вершина ${vertexName}`}>
              <FormAutocompleteSingleSelect
                name={dbcIdField}
                label="базовая конфигурация"
                possibleValues={dbcIds}
                titleForValue={dbcCodeForId}
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                value={data[dbcIdField] ?? null}
                helperText={
                  errors?.[dbcIdField] ??
                  CREATE_TEST_FORM_PROPS_JOINED[dbcIdField] ??
                  ' '
                }
                error={!!errors?.[dbcIdField]}
                onChange={handleAutocompleteSingleSelectChange}
              />
              <FormFileUpload
                name={deltaField}
                label="delta-конфигурация"
                extensions={['zip']}
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                value={data[deltaField]}
                helperText={
                  errors?.[deltaField] ??
                  CREATE_TEST_FORM_PROPS_JOINED[deltaField] ??
                  ' '
                }
                error={!!errors?.[deltaField]}
                onChange={handleFileUploadChange}
              />
            </FormBlock>
          )
        })}
      </FormBlock>
      <FormBlock title="дополнительная информация">
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            CREATE_TEST_FORM_PROPS_JOINED.descriptionText ??
            ' '
          }
          error={!!errors?.descriptionText}
          onChange={handleTextFieldChange}
        />
        <FormAutocompleteFreeItemsMultipleSelect
          name="tagIds"
          freeItemsFieldName="tagCodesToCreate"
          label="теги"
          possibleValues={tagIds}
          titleForValue={tagCodeForId}
          values={data.tagIds ?? EMPTY_TAG_IDS_ARR}
          freeItems={data.tagCodesToCreate ?? EMPTY_TAG_CODES_ARR}
          helperText={(() => {
            const result: string[] = []
            const addMes = (mes: string | undefined) => {
              if (mes) {
                result.push(mes)
              }
            }
            if (errors?.tagIds || errors?.tagCodesToCreate) {
              addMes(errors?.tagIds)
              addMes(errors?.tagCodesToCreate)
            } else {
              addMes(CREATE_TEST_FORM_PROPS_JOINED.tagIds)
              addMes(CREATE_TEST_FORM_PROPS_JOINED.tagCodesToCreate)
            }
            return result.length > 0 ? result.join(', ') : ' '
          })()}
          error={!!errors?.tagIds || !!errors?.tagCodesToCreate}
          onChange={handleAutocompleteMultipleSelectChange}
          onChangeFreeItems={handleAutocompleteMultipleSelectFreeItemsChange}
        />
        <FormMultilineTextField
          name="remarkText"
          label="комментарии"
          value={data.remarkText ?? ''}
          helperText={
            errors?.remarkText ??
            CREATE_TEST_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
