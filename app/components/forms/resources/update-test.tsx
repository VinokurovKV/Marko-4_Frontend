// Project
import { convertFileFormatToExtension } from '@common/formats'
import type { UpdateTestSuccessResultDto } from '@common/dtos/server-api/tests.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { convertNumberOfBytesToStr } from '@common/utilities'
import type {
  TopologyPrimary,
  DbcPrimary,
  TestTemplatePrimary,
  TestTertiary,
  SubgroupPrimary
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useChangeDetector } from '~/hooks/change-detector'
import { useTestSubscription } from '~/hooks/resources'
import {
  useTags,
  useRequirements,
  useCommonTopology,
  useTopology
} from '~/hooks/resources'
import {
  type UpdateTestFormData,
  MAX_VERTEXES_IN_TOPOLOGY,
  getDbcIdField,
  getDeltaField,
  updateTestFormValidator
} from '~/data/forms/resources/update-test'
import { TopologySchema } from '~/components/topologies/topology-schema'
import {
  createTagsAndGetIds,
  prepareArrFieldForUpdate as prepareArr,
  prepareFileExtraFieldForUpdate as prepareFileExtra,
  prepareOptionalFieldForUpdate as prepareOptional,
  prepareRequiredFieldForUpdate as prepareRequired,
  prepareTextFieldForUpdate as prepareText,
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
const EMPTY_REQUIREMENT_IDS_ARR: number[] = []
// const EMPTY_COVERAGE_IDS_ARR: number[] = []
const EMPTY_VERTEX_NAMES_ARR: string[] = []

const UPDATE_TEST_FORM_PROPS_JOINED = updateTestFormValidator.getPromptsJoined()

const FICT_FILE_TYPE = 'fict'

export interface UpdateTestFormDialogProps {
  topologies: TopologyPrimary[] | null
  dbcs: DbcPrimary[] | null
  testTemplates: TestTemplatePrimary[] | null
  subgroups: SubgroupPrimary[] | null
  testId: number | null
  setTestId: React.Dispatch<React.SetStateAction<number | null>>
  initialTest: TestTertiary | null
  onSuccessUpdateTest?: (
    updateTestResult: DtoWithoutEnums<UpdateTestSuccessResultDto>
  ) => void
  onCancelClick?: () => void
}

export function UpdateTestFormDialog(props: UpdateTestFormDialogProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const selfId = React.useMemo(
    () => (meta.status !== 'AUTHENTICATED' ? null : meta.selfMeta.id),
    [meta]
  )

  const [test, setTest] = React.useState<TestTertiary | null>(props.initialTest)
  useTestSubscription('UP_TO_TERTIARY_PROPS', props.testId, setTest)

  const tags = useTags('PRIMARY_PROPS', false, props.testId !== null)

  const tagIds = React.useMemo(() => tags?.map((tag) => tag.id) ?? [], [tags])
  const requirements = useRequirements(
    'PRIMARY_PROPS',
    false,
    props.testId !== null
  )

  const tagCodeForId = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.id, tag.code])),
    [tags]
  )

  const tagIdForCode = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.code, tag.id])),
    [tags]
  )

  // const readTopologyNonGeneratorVertexNamesSorted = React.useCallback(
  //   async (topologyId: number, errorMessage: string) => {
  //     try {
  //       const topology = await serverConnector.readTopology(
  //         {
  //           id: topologyId
  //         },
  //         {
  //           scope: 'UP_TO_TERTIARY_PROPS'
  //         }
  //       )
  //       const commonTopology = await serverConnector.readCommonTopology(
  //         {
  //           id: topology.commonTopologyId
  //         },
  //         {
  //           scope: 'UP_TO_TERTIARY_PROPS'
  //         }
  //       )
  //       const generatorVertexNamesSet = new Set(
  //         commonTopology.config.vertexes
  //           .filter((vertex) => vertex.isGenerator)
  //           .map((vertex) => vertex.name)
  //       )
  //       return topology.vertexNames
  //         .filter(
  //           (vertexName) => generatorVertexNamesSet.has(vertexName) === false
  //         )
  //         .toSorted()
  //     } catch (error) {
  //       notifier.showError(error, errorMessage)
  //       return EMPTY_VERTEX_NAMES_ARR
  //     }
  //   },
  //   [notifier]
  // )

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToEvents(
      {
        filter: {
          types: ['UPDATE_TEST', 'DELETE_TEST', 'DELETE_TESTS']
        }
      },
      (data) => {
        ;(() => {
          if (props.testId !== null) {
            for (const event of data) {
              if (selfId !== null && event.initiatorId !== selfId) {
                if (
                  event.type === 'UPDATE_TEST' &&
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  (event as any).config?.resource?.id === props.testId
                ) {
                  notifier.showWarning(
                    `редактируемый тест изменен другим пользователем`
                  )
                } else if (
                  (event.type === 'DELETE_TEST' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resource?.id === props.testId) ||
                  (event.type === 'DELETE_TESTS' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resources?.some?.(
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      (resource: any) => resource?.id === props.testId
                    ))
                ) {
                  notifier.showWarning(
                    `редактируемый тест удален другим пользователем`
                  )
                }
              }
            }
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [props.testId, notifier, selfId])

  const submitAction = React.useCallback(
    async (validatedData: UpdateTestFormData) => {
      if (props.testId === null) {
        throw new Error('отсутствует идентификатор теста')
      } else if (test === null) {
        throw new Error(
          `отсутствует доступ к текущим характеристикам редактируемого теста`
        )
      } else {
        const {
          descriptionText,
          remarkText,
          config,
          tagIds,
          tagCodesToCreate
          //, ...truncatedData
        } = validatedData

        const recentlyCreatedTagIds = (tagCodesToCreate ?? [])
          .map((tagCodeToCreate) => tagIdForCode.get(tagCodeToCreate))
          .filter((tagId) => tagId !== undefined)

        const newCreatedTagIds = await createTagsAndGetIds(
          tagIdForCode,
          tagCodesToCreate,
          notifier
        )

        // const vertexNamesSorted = await (async () => {
        //   if (validatedData.topologyId === undefined) {
        //     return EMPTY_VERTEX_NAMES_ARR
        //   }
        //   return await readTopologyNonGeneratorVertexNamesSorted(
        //     validatedData.topologyId,
        //     'не удалось загрузить топологию при обработке введенных данных о вершинах'
        //   )
        // })()

        // const deltas = vertexNamesSorted.map(
        //   (vertexName, vertexIndex) =>
        //     truncatedData[getDeltaField(vertexIndex)] as File | undefined
        // )

        // const deltaTransferIndexes = (() => {
        //   let lastUsedTransferIndex = -1
        //   const deltaTransferIndexes: (number | undefined)[] = []
        //   for (
        //     let vertexIndex = 0;
        //     vertexIndex < deltas.length;
        //     vertexIndex++
        //   ) {
        //     if (deltas[vertexIndex] !== undefined) {
        //       lastUsedTransferIndex++
        //       deltaTransferIndexes.push(lastUsedTransferIndex)
        //     } else {
        //       deltaTransferIndexes.push(undefined)
        //     }
        //   }
        //   return deltaTransferIndexes
        // })()

        return await serverConnector.updateTest(
          {
            id: props.testId,
            code: prepareRequired(test.code, validatedData.code),
            name: prepareOptional(test.name, validatedData.name),
            numInSubgroup: prepareOptional(
              test.numInSubgroup,
              validatedData.numInSubgroup
            ),
            topologyId: prepareRequired(
              test.topologyId,
              validatedData.topologyId
            ),
            testTemplateId: prepareOptional(
              test.testTemplateId,
              validatedData.testTemplateId
            ),
            subgroupId: prepareOptional(
              test.subgroupId,
              validatedData.subgroupId
            ),
            config: prepareFileExtra(test.config, validatedData.config),
            description: prepareText(test.description, descriptionText),
            remark: prepareText(test.remark, remarkText),
            tagIds: prepareArr(test.tagIds, [
              ...(tagIds ?? []),
              ...recentlyCreatedTagIds,
              ...newCreatedTagIds
            ]),
            requirementIds: prepareArr(
              test.requirementIds,
              validatedData.requirementIds
            ),
            vertexes: undefined
            // vertexes: vertexNamesSorted.map((vertexName, vertexIndex) => ({
            //   vertexName: vertexName,
            //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            //   dbcId: truncatedData[getDbcIdField(vertexIndex)],
            //   deltaIndex: deltaTransferIndexes[vertexIndex]
            // }))
          },
          config?.type !== FICT_FILE_TYPE ? config : undefined,
          undefined, // deltas.filter((delta) => delta !== undefined),
          undefined
        )
      }
    },
    [props.testId, notifier, test, tagIdForCode]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: UpdateTestFormData,
      updateTestResult: DtoWithoutEnums<UpdateTestSuccessResultDto>
    ) => {
      notifier.showSuccess(`тест «${test?.code}» изменен`)
      props.onSuccessUpdateTest?.(updateTestResult)
    },
    [props.onSuccessUpdateTest, notifier, test]
  )

  const initialFormData = React.useMemo(() => {
    const initialFormData: UpdateTestFormData = {
      code: test?.code ?? '',
      name: test?.name ?? undefined,
      numInSubgroup: test?.numInSubgroup ?? undefined,
      topologyId: test?.topologyId ?? undefined,
      testTemplateId: test?.testTemplateId ?? undefined,
      subgroupId: test?.subgroupId ?? undefined,
      config: test?.config
        ? new File(
            [],
            `${convertNumberOfBytesToStr(test.config.size)}.${convertFileFormatToExtension(test.config.format)}`,
            {
              type: FICT_FILE_TYPE
            }
          )
        : undefined,
      descriptionText: test?.description?.text,
      remarkText: test?.remark?.text,
      tagIds: test?.tagIds,
      requirementIds: test?.requirementIds
    }
    const vertexesSorted = (test?.vertexes ?? []).toSorted(
      (vertex_1, vertex_2) =>
        vertex_1.vertexName.localeCompare(vertex_2.vertexName)
    )
    for (const [vertexIndex, vertex] of vertexesSorted.entries()) {
      const dbcIdField = getDbcIdField(vertexIndex)
      const deltaField = getDeltaField(vertexIndex)
      initialFormData[dbcIdField] = vertex.dbcId ?? undefined
      initialFormData[deltaField] = vertex.delta
        ? new File(
            [],
            `${convertNumberOfBytesToStr(vertex.delta.size)}.${convertFileFormatToExtension(vertex.delta.format)}`,
            {
              type: FICT_FILE_TYPE
            }
          )
        : undefined
    }
    return initialFormData
  }, [test])

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
  } = useForm<UpdateTestFormData, DtoWithoutEnums<UpdateTestSuccessResultDto>>({
    INITIAL_FORM_DATA: initialFormData,
    validator: updateTestFormValidator,
    clearTrigger: test?.id,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const requirementIds = React.useMemo(
    () => requirements?.map((requirement) => requirement.id) ?? [],
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
    props.testId !== null
  )

  const commonTopology = useCommonTopology(
    'UP_TO_TERTIARY_PROPS',
    topology?.commonTopologyId ?? null,
    true,
    props.testId !== null
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

  const setIsActive = React.useCallback(
    (value: boolean | ((prevState: boolean) => boolean)) => {
      if (value === false) {
        props.setTestId(null)
      } else {
        throw new Error()
      }
    },
    [props.setTestId]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title={`изменить тест «${test?.code}»`}
      submitButtonTitle="изменить"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'к текущим значениям'
      }}
      isActive={props.testId !== null}
      setIsActive={setIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="code"
          label="код"
          value={data.code}
          helperText={errors?.code ?? UPDATE_TEST_FORM_PROPS_JOINED.code ?? ' '}
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={errors?.name ?? UPDATE_TEST_FORM_PROPS_JOINED.name ?? ' '}
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
            UPDATE_TEST_FORM_PROPS_JOINED.subgroupId ??
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
            UPDATE_TEST_FORM_PROPS_JOINED.numInSubgroup ??
            ' '
          }
          error={!!errors?.numInSubgroup}
          onChange={handleTextFieldChange}
        />
        <FormAutocompleteMultipleSelect
          name="requirementIds"
          label="покрываемые требования"
          possibleValues={requirementIds}
          titleForValue={requirementCodeForId}
          values={data.requirementIds ?? EMPTY_REQUIREMENT_IDS_ARR}
          helperText={
            errors?.reqiuirementIds ??
            UPDATE_TEST_FORM_PROPS_JOINED.requirementIds ??
            ' '
          }
          error={!!errors?.requirementIds}
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
            UPDATE_TEST_FORM_PROPS_JOINED.testTemplateId ??
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
            errors?.config ?? UPDATE_TEST_FORM_PROPS_JOINED.config ?? ' '
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
            UPDATE_TEST_FORM_PROPS_JOINED.topologyId ??
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
                  UPDATE_TEST_FORM_PROPS_JOINED[dbcIdField] ??
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
                  UPDATE_TEST_FORM_PROPS_JOINED[deltaField] ??
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
            UPDATE_TEST_FORM_PROPS_JOINED.descriptionText ??
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
              addMes(UPDATE_TEST_FORM_PROPS_JOINED.tagIds)
              addMes(UPDATE_TEST_FORM_PROPS_JOINED.tagCodesToCreate)
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
            UPDATE_TEST_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
