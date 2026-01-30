// Project
import { allTaskModes, allTaskResultsToSave } from '@common/enums'
import type { CreateTaskSuccessResultDto } from '@common/dtos/server-api/tasks.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import type { CommonTopologyPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useChangeDetector } from '~/hooks/change-detector'
import {
  useTags,
  useCommonTopology,
  useTests,
  useSubgroups,
  useGroups,
  useDevices
} from '~/hooks/resources'
import {
  localizationForTaskMode,
  localizationForTaskResultToSave
} from '~/localization'
import {
  type CreateTaskFormDataWithoutVertexes,
  type CreateTaskFormData,
  MAX_VERTEXES_IN_COMMON_TOPOLOGY,
  INITIAL_CREATE_TASK_FORM_DATA,
  getDeviceIdField,
  createTaskFormValidator
} from '~/data/forms/resources/create-task'
import { TopologyConfigSchema } from '~/components/topologies/topology-config-schema'
import {
  createTagsAndGetIds,
  type Field,
  type FormSelectProps,
  useForm,
  FormAutocompleteFreeItemsMultipleSelect,
  FormAutocompleteMultipleSelect,
  FormAutocompleteSingleSelect,
  FormBlock,
  FormCheckbox,
  // FormDateTime,
  FormDialog,
  FormMultilineTextField,
  FormNumField,
  FormSelect,
  FormTextField
} from '../common'
// React
import * as React from 'react'

const EMPTY_TAG_IDS_ARR: number[] = []
const EMPTY_TAG_CODES_ARR: string[] = []
const EMPTY_TEST_IDS_ARR: number[] = []
const EMPTY_SUBGROUP_IDS_ARR: number[] = []
const EMPTY_GROUP_IDS_ARR: number[] = []
const EMPTY_VERTEX_NAMES_ARR: string[] = []
const EMPTY_RESULTS_TO_SAVE_ARR: string[] = []
const DEFAULT_FIELDS_WITH_NOT_IGNORED_ERRORS_BEFORE_SUBMIT: Field<CreateTaskFormDataWithoutVertexes>[] =
  [
    'name',
    'mode',
    'commonTopologyId',
    'testIds',
    'subgroupIds',
    'groupIds',
    'resultsToSave',
    'abortIfNotPassed',
    'withoutDeviceConfig',
    'priority',
    'paused',
    'minLaunchTime',
    'descriptionText',
    'tagIds',
    'tagCodesToCreate',
    'remarkText'
  ]

const CREATE_TASK_FORM_PROPS_JOINED = createTaskFormValidator.getPromptsJoined()

export interface CreateTaskFormDialogProps {
  commonTopologies: CommonTopologyPrimary[] | null
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessCreateTask?: (
    createTaskResult: DtoWithoutEnums<CreateTaskSuccessResultDto>
  ) => void
  onCancelClick?: () => void
}

export function CreateTaskFormDialog(props: CreateTaskFormDialogProps) {
  const notifier = useNotifier()

  const [
    fieldsWithNotIgnoredErrorsBeforeSubmit,
    setFieldsWithNotIgnoredErrorsBeforeSubmit
  ] = React.useState<Field<CreateTaskFormData>[]>(
    DEFAULT_FIELDS_WITH_NOT_IGNORED_ERRORS_BEFORE_SUBMIT
  )

  const tags = useTags('PRIMARY_PROPS', false, props.createModeIsActive)
  const tests = useTests('PRIMARY_PROPS', false, props.createModeIsActive)
  const subgroups = useSubgroups(
    'PRIMARY_PROPS',
    false,
    props.createModeIsActive
  )
  const groups = useGroups('PRIMARY_PROPS', false, props.createModeIsActive)
  const devices = useDevices('PRIMARY_PROPS', false, props.createModeIsActive)

  const tagIds = React.useMemo(() => tags?.map((tag) => tag.id) ?? [], [tags])

  const tagCodeForId = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.id, tag.code])),
    [tags]
  )

  const tagIdForCode = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.code, tag.id])),
    [tags]
  )

  const commonTopologyIds = React.useMemo(
    () =>
      props.commonTopologies?.map((commonTopology) => commonTopology.id) ?? [],
    [props.commonTopologies]
  )

  const commonTopologyCodeForId = React.useMemo(
    () =>
      new Map(
        (props.commonTopologies ?? []).map((commonTopology) => [
          commonTopology.id,
          commonTopology.code
        ])
      ),
    [props.commonTopologies]
  )

  const preparedTestIds = React.useMemo(
    () => tests?.filter((test) => test.prepared).map((test) => test.id) ?? [],
    [tests]
  )

  const testCodeForId = React.useMemo(
    () => new Map((tests ?? []).map((test) => [test.id, test.code])),
    [tests]
  )

  const subgroupIds = React.useMemo(
    () => subgroups?.map((subgroup) => subgroup.id) ?? [],
    [subgroups]
  )

  const subgroupCodeForId = React.useMemo(
    () =>
      new Map(
        (subgroups ?? []).map((subgroup) => [subgroup.id, subgroup.code])
      ),
    [subgroups]
  )

  const groupIds = React.useMemo(
    () => groups?.map((group) => group.id) ?? [],
    [groups]
  )

  const groupCodeForId = React.useMemo(
    () => new Map((groups ?? []).map((group) => [group.id, group.code])),
    [groups]
  )

  const deviceCodeForId = React.useMemo(
    () => new Map((devices ?? []).map((device) => [device.id, device.code])),
    [devices]
  )

  const readCommonTopologyNonGeneratorVertexNamesSorted = React.useCallback(
    async (commonTopologyId: number, errorMessage: string) => {
      try {
        return (
          await serverConnector.readCommonTopology(
            {
              id: commonTopologyId
            },
            {
              scope: 'UP_TO_TERTIARY_PROPS'
            }
          )
        ).config.vertexes
          .filter((vertex) => vertex.isGenerator === false)
          .map((vertex) => vertex.name)
          .toSorted()
      } catch (error) {
        notifier.showError(error, errorMessage)
        return EMPTY_VERTEX_NAMES_ARR
      }
    },
    [notifier]
  )

  const submitAction = React.useCallback(
    async (validatedData: CreateTaskFormData) => {
      const recentlyCreatedTagIds = (validatedData.tagCodesToCreate ?? [])
        .map((tagCodeToCreate) => tagIdForCode.get(tagCodeToCreate))
        .filter((tagId) => tagId !== undefined)

      const newCreatedTagIds = await createTagsAndGetIds(
        tagIdForCode,
        validatedData.tagCodesToCreate,
        notifier
      )

      const vertexNamesSorted = await (async () => {
        if (validatedData.commonTopologyId === undefined) {
          return EMPTY_VERTEX_NAMES_ARR
        }
        return await readCommonTopologyNonGeneratorVertexNamesSorted(
          validatedData.commonTopologyId,
          'не удалось загрузить общую топологию при обработке введенных данных о вершинах'
        )
      })()

      return await serverConnector.createTask({
        name: validatedData.name,
        mode: validatedData.mode!,
        commonTopologyId: validatedData.commonTopologyId!,
        testIds: validatedData.testIds,
        subgroupIds: validatedData.subgroupIds,
        groupIds: validatedData.groupIds,
        resultsToSave: validatedData.resultsToSave ?? [],
        abortIfNotPassed: validatedData.abortIfNotPassed,
        withoutDeviceConfig: validatedData.withoutDeviceConfig,
        priority: validatedData.priority,
        paused: validatedData.paused,
        minLaunchTime: validatedData.minLaunchTime,
        description:
          validatedData.descriptionText !== undefined
            ? {
                format: 'PLAIN',
                text: validatedData.descriptionText
              }
            : undefined,
        remark:
          validatedData.remarkText !== undefined
            ? {
                format: 'PLAIN',
                text: validatedData.remarkText
              }
            : undefined,
        tagIds:
          (validatedData.tagIds ?? []).length +
            recentlyCreatedTagIds.length +
            newCreatedTagIds.length >
          0
            ? [
                ...(validatedData.tagIds ?? []),
                ...recentlyCreatedTagIds,
                ...newCreatedTagIds
              ]
            : undefined,
        vertexes: vertexNamesSorted.map((vertexName, vertexIndex) => ({
          vertexName: vertexName,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          deviceId: validatedData[getDeviceIdField(vertexIndex)]!
        }))
      })
    },
    [notifier, tagIdForCode, readCommonTopologyNonGeneratorVertexNamesSorted]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: CreateTaskFormData,
      createTaskResult: DtoWithoutEnums<CreateTaskSuccessResultDto>
    ) => {
      notifier.showSuccess(
        `задание тестирования «${createTaskResult.result.code}» создано`
      )
      props.onSuccessCreateTask?.(createTaskResult)
    },
    [props.onSuccessCreateTask, notifier]
  )

  const {
    formInternal,
    data,
    errors,
    clearFields,
    handleCheckboxChange,
    handleTextFieldChange,
    handleStrSelectChange,
    handleAutocompleteSingleSelectChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange
    // handleDateTimeChange
  } = useForm<CreateTaskFormData, DtoWithoutEnums<CreateTaskSuccessResultDto>>({
    INITIAL_FORM_DATA: INITIAL_CREATE_TASK_FORM_DATA,
    validator: createTaskFormValidator,
    fieldsWithNotIgnoredErrorsBeforeSubmit,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const commonTopology = useCommonTopology(
    'UP_TO_TERTIARY_PROPS',
    data.commonTopologyId ?? null,
    true,
    props.createModeIsActive
  )

  const commonTopologyConfig = React.useMemo(() => {
    return commonTopology?.config ?? null
  }, [commonTopology])

  const vertexNames = React.useMemo(() => {
    return (commonTopology?.config.vertexes ?? [])
      .filter((vertex) => vertex.isGenerator === false)
      .map((vertex) => vertex.name)
      .toSorted()
  }, [commonTopology])

  const vertexNamesTruncated = React.useMemo(() => {
    const vertexNamesTruncated = [...vertexNames]
    if (vertexNamesTruncated.length > MAX_VERTEXES_IN_COMMON_TOPOLOGY) {
      vertexNamesTruncated.length = MAX_VERTEXES_IN_COMMON_TOPOLOGY
    }
    return vertexNamesTruncated
  }, [vertexNames])

  const updateFieldsWithNotIgnoredErrorsBeforeSubmit = React.useCallback(() => {
    setFieldsWithNotIgnoredErrorsBeforeSubmit([
      ...DEFAULT_FIELDS_WITH_NOT_IGNORED_ERRORS_BEFORE_SUBMIT,
      ...Array.from(Array(vertexNamesTruncated.length).keys()).flatMap(
        (vertexIndex) => [getDeviceIdField(vertexIndex)]
      )
    ])
  }, [setFieldsWithNotIgnoredErrorsBeforeSubmit, vertexNamesTruncated])

  // Process vertex names truncated change
  useChangeDetector({
    detectedObjects: [vertexNamesTruncated],
    otherDependencies: [
      clearFields,
      updateFieldsWithNotIgnoredErrorsBeforeSubmit
    ],
    onChange: ([oldVertexNames]) => {
      clearFields(
        Array.from(Array(oldVertexNames.length).keys()).flatMap(
          (vertexIndex) => [getDeviceIdField(vertexIndex)]
        )
      )
      updateFieldsWithNotIgnoredErrorsBeforeSubmit()
    }
  })

  const modeSelectItems: FormSelectProps<string>['items'] = React.useMemo(
    () =>
      allTaskModes.map((mode) => ({
        value: mode,
        title: localizationForTaskMode.get(mode) ?? mode
      })),
    []
  )

  const filteredPreparedDeviceIds = React.useMemo(
    () =>
      devices
        ?.filter(
          (device) =>
            device.prepared &&
            (data.mode === undefined ||
              (data.mode === 'TEST' && device.type !== 'ETALON') ||
              (data.mode !== 'TEST' && device.type !== 'UNDER_TEST'))
        )
        .map((device) => device.id) ?? [],
    [devices, data.mode]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title="создать задание тестирования"
      submitButtonTitle="создать"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'очистить'
      }}
      isActive={props.createModeIsActive}
      setIsActive={props.setCreateModeIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={errors?.name ?? CREATE_TASK_FORM_PROPS_JOINED.name ?? ' '}
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormSelect
          required
          name="mode"
          label="режим"
          items={modeSelectItems}
          value={data.mode ?? ''}
          helperText={errors?.mode ?? CREATE_TASK_FORM_PROPS_JOINED.mode ?? ' '}
          error={!!errors?.mode}
          onChange={handleStrSelectChange}
        />
      </FormBlock>
      <FormBlock title="общая топология">
        <FormAutocompleteSingleSelect
          required
          name="commonTopologyId"
          label="общая топология"
          possibleValues={commonTopologyIds}
          titleForValue={commonTopologyCodeForId}
          value={data.commonTopologyId ?? null}
          helperText={
            errors?.commonTopologyId ??
            CREATE_TASK_FORM_PROPS_JOINED.commonTopologyId ??
            ' '
          }
          error={!!errors?.commonTopologyId}
          onChange={handleAutocompleteSingleSelectChange}
        />
        <TopologyConfigSchema
          config={commonTopologyConfig}
          nullConfigTitle="схема общей топологии"
        />
      </FormBlock>
      {vertexNamesTruncated.map((vertexName, vertexIndex) => {
        const deviceIdField = getDeviceIdField(vertexIndex)
        return (
          <FormBlock key={vertexIndex} title={`вершина ${vertexName}`}>
            <FormAutocompleteSingleSelect
              required
              name={deviceIdField}
              label="устройство"
              possibleValues={filteredPreparedDeviceIds}
              titleForValue={deviceCodeForId}
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              value={data[deviceIdField] ?? null}
              helperText={
                errors?.[deviceIdField] ??
                CREATE_TASK_FORM_PROPS_JOINED[deviceIdField] ??
                ' '
              }
              error={!!errors?.[deviceIdField]}
              onChange={handleAutocompleteSingleSelectChange}
            />
          </FormBlock>
        )
      })}
      <FormBlock title="иерархия тестов">
        <FormAutocompleteMultipleSelect
          name="testIds"
          label="тесты"
          possibleValues={preparedTestIds}
          titleForValue={testCodeForId}
          values={data.testIds ?? EMPTY_TEST_IDS_ARR}
          helperText={
            errors?.testIds ?? CREATE_TASK_FORM_PROPS_JOINED.testIds ?? ' '
          }
          error={!!errors?.testIds}
          onChange={handleAutocompleteMultipleSelectChange}
        />
        <FormAutocompleteMultipleSelect
          name="subgroupIds"
          label="подгруппы"
          possibleValues={subgroupIds}
          titleForValue={subgroupCodeForId}
          values={data.subgroupIds ?? EMPTY_SUBGROUP_IDS_ARR}
          helperText={
            errors?.subgroupIds ??
            CREATE_TASK_FORM_PROPS_JOINED.subgroupIds ??
            ' '
          }
          error={!!errors?.subgroupIds}
          onChange={handleAutocompleteMultipleSelectChange}
        />
        <FormAutocompleteMultipleSelect
          name="groupIds"
          label="группы"
          possibleValues={groupIds}
          titleForValue={groupCodeForId}
          values={data.groupIds ?? EMPTY_GROUP_IDS_ARR}
          helperText={
            errors?.groupIds ?? CREATE_TASK_FORM_PROPS_JOINED.groupIds ?? ' '
          }
          error={!!errors?.groupIds}
          onChange={handleAutocompleteMultipleSelectChange}
        />
      </FormBlock>
      <FormBlock title="параметры запуска">
        <FormAutocompleteMultipleSelect
          name="resultsToSave"
          label="сохраняемые результаты"
          possibleValues={allTaskResultsToSave}
          titleForValue={groupCodeForId}
          localizationForTitle={localizationForTaskResultToSave}
          values={data.resultsToSave ?? EMPTY_RESULTS_TO_SAVE_ARR}
          helperText={
            errors?.resultsToSave ??
            CREATE_TASK_FORM_PROPS_JOINED.resultsToSave ??
            ' '
          }
          error={!!errors?.resultsToSave}
          onChange={handleAutocompleteMultipleSelectChange}
        />
        <FormCheckbox
          name="abortIfNotPassed"
          label="прерывать при непрохождении либо ошибке"
          checked={data.abortIfNotPassed}
          onChange={handleCheckboxChange}
        />
        <FormCheckbox
          name="withoutDeviceConfig"
          label="отключить конфигурирование устройств перед запуском тестов"
          checked={data.withoutDeviceConfig}
          onChange={handleCheckboxChange}
        />
        <FormNumField
          name="priority"
          label="приоритет"
          value={data.priority ?? ''}
          helperText={
            errors?.priority ?? CREATE_TASK_FORM_PROPS_JOINED.priority ?? ' '
          }
          error={!!errors?.priority}
          onChange={handleTextFieldChange}
        />
        <FormCheckbox
          name="paused"
          label="постановка на паузу при создании"
          checked={data.paused}
          onChange={handleCheckboxChange}
        />
        {/* <FormDateTime
          disablePast
          name="minLaunchTime"
          label="время отложенного запуска"
          value={data.minLaunchTime ?? null}
          helperText={
            errors?.minLaunchTime ??
            CREATE_TASK_FORM_PROPS_JOINED.minLaunchTime ??
            ' '
          }
          error={!!errors?.minLaunchTime}
          onChange={handleDateTimeChange}
        /> */}
      </FormBlock>
      <FormBlock title="дополнительная информация">
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            CREATE_TASK_FORM_PROPS_JOINED.descriptionText ??
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
              addMes(CREATE_TASK_FORM_PROPS_JOINED.tagIds)
              addMes(CREATE_TASK_FORM_PROPS_JOINED.tagCodesToCreate)
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
            CREATE_TASK_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
