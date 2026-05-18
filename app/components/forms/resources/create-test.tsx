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
  useRequirements,
  useCommonTopology,
  useTopology,
  useTopologies
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
  createTagsAndGetIds,
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
// Other
import JSZip from 'jszip'

const EMPTY_TAG_IDS_ARR: number[] = []
const EMPTY_TAG_CODES_ARR: string[] = []
const EMPTY_REQUIREMENT_IDS_ARR: number[] = []
// const EMPTY_COVERAGE_IDS_ARR: number[] = []
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

  const tagIds = React.useMemo(() => tags?.map((tag) => tag.id) ?? [], [tags])
  const requirements = useRequirements(
    'PRIMARY_PROPS',
    false,
    props.createModeIsActive
  )
  const topologies = useTopologies(
    'PRIMARY_PROPS',
    false,
    props.createModeIsActive
  )

  const tagCodeForId = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.id, tag.code])),
    [tags]
  )

  const tagIdForCode = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.code, tag.id])),
    [tags]
  )

  const requirementIdForCode = React.useMemo(
    () =>
      new Map(
        (requirements ?? []).map((requirement) => [
          requirement.code,
          requirement.id
        ])
      ),
    [requirements]
  )

  const topologyIdForCode = React.useMemo(
    () =>
      new Map(
        (topologies ?? []).map((topology) => [topology.code, topology.id])
      ),
    [topologies]
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

      const newCreatedTagIds = await createTagsAndGetIds(
        tagIdForCode,
        tagCodesToCreate,
        notifier
      )

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
          requirementIds: truncatedData.requirementIds,
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
      notifier.showSuccess(`тест «${data.code}» создан`)
      props.onSuccessCreateTest?.(createTestResult)
    },
    [props.onSuccessCreateTest, notifier]
  )

  const {
    formInternal,
    data,
    errors,
    clearFields,
    handleFieldChange,
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

  useChangeDetector({
    detectedObjects: [data.config],
    otherDependencies: [notifier, data.descriptionText, handleFieldChange],
    onChange: () => {
      const README_FILE_NAME = 'readme.md'
      if (
        data.descriptionText === undefined ||
        data.descriptionText.trim() === ''
      ) {
        void (async () => {
          const zip = await (async () => {
            try {
              return data.config !== undefined
                ? await JSZip.loadAsync(data.config)
                : Promise.resolve(null)
            } catch (error) {
              notifier.showError(
                error,
                'не удалось прочитать ZIP-архив с конфигурацией теста'
              )
              throw error
            }
          })()
          if (zip !== null) {
            const fileNames = Object.keys(zip.files)
            if (fileNames.includes(README_FILE_NAME) === false) {
              const error = new Error(
                `в ZIP-архиве с конфигурацией теста отсутствует файл '${README_FILE_NAME}'`
              )
              notifier.showError(error)
              throw error
            }
            const description = await (async () => {
              try {
                return await zip.file(README_FILE_NAME)!.async('string')
              } catch (error) {
                notifier.showError(
                  error,
                  `не удалось прочитать файл '${README_FILE_NAME}' из ZIP-архива с конфигурацией теста`
                )
                throw error
              }
            })()
            handleFieldChange(
              'descriptionText',
              normalizeEmptyLines(description)
            )
            notifier.showInfo(
              `описание теста подгружено из файла '${README_FILE_NAME}' конфигурации`
            )
          }
        })()
      }
    }
  })

  useChangeDetector({
    detectedObjects: [data.descriptionText],
    otherDependencies: [tagIdForCode, requirementIdForCode, handleFieldChange],
    onChange: () => {
      const tagsLine =
        getFirstNonEmptyLineAfterMarker(data.descriptionText ?? '', '# Теги')
          ?.text ?? null
      const tagCodes =
        tagsLine !== null
          ? removeDuplicates(
              tagsLine
                .split(',')
                .map((fragment) => fragment.trim())
                .filter((fragment) => fragment !== '')
            )
          : null
      if (tagCodes !== null) {
        const tagIds: number[] | undefined = []
        const tagCodesToCreate: string[] | undefined = []
        for (const tagCode of tagCodes) {
          const tagId = tagIdForCode.get(tagCode)
          if (tagId !== undefined) {
            tagIds.push(tagId)
          } else {
            tagCodesToCreate.push(tagCode)
          }
        }
        handleFieldChange('tagIds', tagIds)
        handleFieldChange('tagCodesToCreate', tagCodesToCreate)
      }
      const requirementCodes = extractMarkdownHeadings(
        data.descriptionText ?? '',
        'Требования',
        3
      )
      const requirementIds = removeDuplicates(requirementCodes)
        .map((code) => requirementIdForCode.get(code))
        .filter((id) => id !== undefined)
      if (requirementIds.length > 0) {
        handleFieldChange('requirementIds', requirementIds)
      }
      const topologyCodes = extractMarkdownHeadings(
        data.descriptionText ?? '',
        'Топология',
        2
      )
      const topologyCode = topologyCodes.length > 0 ? topologyCodes[0] : null
      if (topologyCode !== null) {
        const topologyId = topologyIdForCode.get(topologyCode) ?? null
        if (topologyId !== null) {
          handleFieldChange('topologyId', topologyId)
        }
      }
    }
  })

  useChangeDetector({
    detectedObjects: [data.tagIds, data.tagCodesToCreate],
    otherDependencies: [tagCodeForId, handleFieldChange, data.descriptionText],
    onChange: () => {
      const tagCodes = [
        ...(data.tagIds ?? [])
          .map((tagId) => tagCodeForId.get(tagId))
          .filter((tagId) => tagId !== undefined),
        ...(data.tagCodesToCreate ?? [])
      ]
      const tagCodesSet = new Set(tagCodes)
      if (
        data.descriptionText !== undefined &&
        data.descriptionText.trim() !== ''
      ) {
        const tagsLine = getFirstNonEmptyLineAfterMarker(
          data.descriptionText ?? '',
          '# Теги'
        )
        if (tagCodes.length === 0) {
          if (tagsLine !== null) {
            const newDescriptionText = replaceFirstFromIndex(
              data.descriptionText,
              tagsLine.text,
              '',
              tagsLine.startIndex
            ).replace('# Теги', '')
            handleFieldChange(
              'descriptionText',
              normalizeEmptyLines(newDescriptionText)
            )
          }
        } else {
          if (tagsLine !== null) {
            const tagsLineCodesSet = new Set(
              tagsLine.text
                .split(',')
                .map((fragment) => fragment.trim())
                .filter((fragment) => fragment !== '')
            )
            if (setsAreEqual(tagCodesSet, tagsLineCodesSet) === false) {
              const newDescriptionText = replaceFirstFromIndex(
                data.descriptionText,
                tagsLine.text,
                tagCodes.join(', '),
                tagsLine.startIndex
              )
              handleFieldChange(
                'descriptionText',
                normalizeEmptyLines(newDescriptionText)
              )
            }
          } else {
            const newDescriptionText = `${data.descriptionText}\n\n# Теги\n\n${tagCodes.join(', ')}`
            handleFieldChange(
              'descriptionText',
              normalizeEmptyLines(newDescriptionText)
            )
          }
        }
      }
    }
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
          name="requirementIds"
          label="покрываемые требования"
          possibleValues={requirementIds}
          titleForValue={requirementCodeForId}
          values={data.requirementIds ?? EMPTY_REQUIREMENT_IDS_ARR}
          helperText={
            errors?.reqiuirementIds ??
            CREATE_TEST_FORM_PROPS_JOINED.requirementIds ??
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

interface FirstNonEmptyLineResult {
  text: string
  startIndex: number
}

export function getFirstNonEmptyLineAfterMarker(
  text: string,
  marker: string
): FirstNonEmptyLineResult | null {
  // Разбиваем текст на строки
  const lines = text.split('\n')

  // Вычисляем начальные индексы каждой строки в исходном тексте
  let currentIndex = 0
  const lineStartIndices: number[] = []

  for (let i = 0; i < lines.length; i++) {
    lineStartIndices.push(currentIndex)
    // Прибавляем длину строки + 1 для символа '\n'
    currentIndex += lines[i].length + 1
  }

  // Ищем строку, содержащую маркер
  let markerIndex = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(marker)) {
      markerIndex = i
      break
    }
  }

  // Если маркер не найден, возвращаем null
  if (markerIndex === -1) {
    return null
  }

  // Ищем первую непустую строку после маркера
  for (let i = markerIndex + 1; i < lines.length; i++) {
    const trimmedLine = lines[i].trim()
    if (trimmedLine !== '') {
      return trimmedLine.includes('#') === false
        ? {
            text: trimmedLine,
            startIndex: lineStartIndices[i]
          }
        : null
    }
  }

  // Если непустых строк после маркера нет
  return null
}

export function removeDuplicates(arr: string[]): string[] {
  return [...new Set(arr)]
}

export function replaceFirstFromIndex(
  text: string,
  search: string,
  replacement: string,
  fromIndex: number = 0
): string {
  // Проверка валидности входных данных
  if (fromIndex < 0) {
    fromIndex = 0
  }

  if (fromIndex >= text.length) {
    return text
  }

  // Поиск фрагмента, начиная с указанного индекса
  const index = text.indexOf(search, fromIndex)

  // Если фрагмент не найден, возвращаем исходный текст
  if (index === -1) {
    return text
  }

  // Выполняем замену
  return (
    text.substring(0, index) +
    replacement +
    text.substring(index + search.length)
  )
}

export function setsAreEqual<T>(setA: Set<T>, setB: Set<T>): boolean {
  if (setA.size !== setB.size) return false

  for (const item of setA) {
    if (!setB.has(item)) return false
  }

  return true
}

/**
 * Оставляет в тексте не более одной пустой строки подряд
 * Строки, содержащие только пробельные символы, считаются пустыми
 * @param text Исходный текст
 * @returns Текст с нормализованными пустыми строками
 */
export function normalizeEmptyLines(text: string): string {
  if (!text) return text

  // Разбиваем текст на строки
  const lines = text.split('\n')

  const result: string[] = []
  let lastLineWasEmpty = false

  for (const line of lines) {
    // Проверяем, является ли строка пустой (или содержит только пробелы)
    const isEmpty = /^\s*$/.test(line)

    if (isEmpty) {
      // Добавляем пустую строку, только если предыдущая не была пустой
      if (!lastLineWasEmpty) {
        result.push('')
        lastLineWasEmpty = true
      }
      // Иначе пропускаем эту пустую строку
    } else {
      // Непустая строка - добавляем как есть
      result.push(line)
      lastLineWasEmpty = false
    }
  }

  return result.join('\n')
}

interface HeadingInfo {
  level: number
  title: string
  position: number
}

/**
 * Извлекает заголовки указанного уровня, принадлежащие заданному заголовку первого уровня
 * @param markdown - Markdown текст
 * @param mainHeading - Название заголовка первого уровня
 * @param targetLevel - Уровень заголовков для извлечения (2 или 3)
 * @returns Массив названий заголовков указанного уровня
 */
export function extractMarkdownHeadings(
  markdown: string,
  mainHeading: string,
  targetLevel: 2 | 3 = 2
): string[] {
  // Регулярное выражение для поиска всех заголовков
  const headingRegex = /^(#{1,6})\s+(.+)$/gm

  const headings: HeadingInfo[] = []
  let match: RegExpExecArray | null

  // Находим все заголовки в документе
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length
    const title = match[2].trim()
    const position = match.index

    headings.push({ level, title, position })
  }

  // Находим целевой заголовок первого уровня
  const targetHeading = headings.find(
    (h) => h.level === 1 && h.title === mainHeading
  )

  if (!targetHeading) {
    return []
  }

  // Находим следующий заголовок первого уровня после целевого
  const nextH1Index = headings.findIndex(
    (h, idx) => idx > headings.indexOf(targetHeading) && h.level === 1
  )

  // Определяем границы раздела целевого заголовка
  const startIndex = headings.indexOf(targetHeading)
  const endIndex = nextH1Index !== -1 ? nextH1Index : headings.length

  // Извлекаем заголовки указанного уровня в пределах раздела
  const resultHeadings = headings
    .slice(startIndex + 1, endIndex)
    .filter((h) => h.level === targetLevel)
    .map((h) => h.title)

  return resultHeadings
}
