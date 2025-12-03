// Project
import type { CommonTopologyConfigDto } from '@common/dtos'
import type { CreateCommonTopologySuccessResultDto } from '@common/dtos/server-api/common-topologies.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useChangeDetector } from '~/hooks/change-detector'
import { useTags } from '~/hooks/resources'
import {
  type CreateCommonTopologyFormDataWithoutConfig,
  type CreateCommonTopologyFormData,
  MAX_VERTEXES_IN_COMMON_TOPOLOGY,
  MAX_LINKS_IN_COMMON_TOPOLOGY,
  INITIAL_CREATE_COMMON_TOPOLOGY_FORM_DATA,
  getVertexNameField,
  getVertexIsGeneratorField,
  getVertexIfaceNamesField,
  getStartVertexIfacePairField,
  getEndVertexIfacePairField,
  createCommonTopologyFormValidator
} from '~/data/forms/resources/create-common-topology'
import { ProjButton } from '~/components/buttons/button'
import { TopologyConfigSchema } from '~/components/topologies/topology-config-schema'
import {
  useForm,
  type Field,
  FormAutocompleteFreeItemsMultipleSelect,
  FormAutocompleteSingleSelect,
  FormBlock,
  FormCheckbox,
  FormDialog,
  FormMultilineTextField,
  FormNumField,
  FormTextField
} from '../common'
// React
import * as React from 'react'
// Material UI
import ClearIcon from '@mui/icons-material/Clear'

type CommonTopologyConfig = DtoWithoutEnums<CommonTopologyConfigDto>

const EMPTY_TAG_IDS_ARR: number[] = []
const EMPTY_TAG_CODES_ARR: string[] = []
const EMPTY_VERTEX_IFACE_NAMES_ARR: string[] = []
const DEFAULT_FIELDS_WITH_NOT_IGNORED_ERRORS_BEFORE_SUBMIT: Field<CreateCommonTopologyFormDataWithoutConfig>[] =
  [
    'code',
    'name',
    'num',
    'descriptionText',
    'tagIds',
    'tagCodesToCreate',
    'remarkText'
  ]

const VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR = ' - '

const CREATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED =
  createCommonTopologyFormValidator.getPromptsJoined()

export interface CreateCommonTopologyFormDialogProps {
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessCreateCommonTopology?: (
    createCommonTopologyResult: CreateCommonTopologySuccessResultDto
  ) => void
  onCancelClick?: () => void
}

export function CreateCommonTopologyFormDialog(
  props: CreateCommonTopologyFormDialogProps
) {
  const notifier = useNotifier()

  const [
    fieldsWithNotIgnoredErrorsBeforeSubmit,
    setFieldsWithNotIgnoredErrorsBeforeSubmit
  ] = React.useState<Field<CreateCommonTopologyFormData>[]>(
    DEFAULT_FIELDS_WITH_NOT_IGNORED_ERRORS_BEFORE_SUBMIT
  )

  const tags = useTags('PRIMARY_PROPS', false, props.createModeIsActive)

  const tagIds = React.useMemo(() => tags?.map((tag) => tag.id) ?? [], [tags])

  const tagCodeForId = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.id, tag.code])),
    [tags]
  )

  const tagIdForCode = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.code, tag.id])),
    [tags]
  )

  const calculateConfig = React.useCallback(
    (data: CreateCommonTopologyFormData) => {
      return {
        vertexes: Array.from(Array(data.vertexesCount).keys()).map(
          (vertexIndex) => ({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            name: data[getVertexNameField(vertexIndex)] ?? '',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            isGenerator: data[getVertexIsGeneratorField(vertexIndex)] ?? false,
            ifaces: (
              (data[getVertexIfaceNamesField(vertexIndex)] as
                | string[]
                | undefined) ?? []
            ).map((ifaceName) => ({
              name: ifaceName
            }))
          })
        ),
        links: Array.from(Array(data.linksCount).keys()).map((linkIndex) => {
          const [startVertexName, startIfaceName] = (
            (data[getStartVertexIfacePairField(linkIndex)] ??
              VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR) as string
          ).split(VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR)
          const [endVertexName, endIfaceName] = (
            (data[getEndVertexIfacePairField(linkIndex)] ??
              VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR) as string
          ).split(VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR)
          return {
            start: {
              vertexName: startVertexName,
              ifaceName: startIfaceName
            },
            end: {
              vertexName: endVertexName,
              ifaceName: endIfaceName
            }
          }
        })
      } as CommonTopologyConfig
    },
    []
  )

  const submitAction = React.useCallback(
    async (validatedData: CreateCommonTopologyFormData) => {
      const recentlyCreatedTagIds = (validatedData.tagCodesToCreate ?? [])
        .map((tagCodeToCreate) => tagIdForCode.get(tagCodeToCreate))
        .filter((tagId) => tagId !== undefined)

      const newCreatedTagIds = (
        await Promise.allSettled(
          (validatedData.tagCodesToCreate ?? [])
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

      return await serverConnector.createCommonTopology({
        code: validatedData.code,
        name: validatedData.name,
        num: validatedData.num,
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
          (tagIds ?? []).length +
            recentlyCreatedTagIds.length +
            newCreatedTagIds.length >
          0
            ? [...(tagIds ?? []), ...recentlyCreatedTagIds, ...newCreatedTagIds]
            : undefined,
        config: calculateConfig(validatedData)
      })
    },
    [notifier, tagIdForCode, calculateConfig]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: CreateCommonTopologyFormData,
      createCommonTopologyResult: CreateCommonTopologySuccessResultDto
    ) => {
      notifier.showSuccess(`общая топология '${data.code}' создана`)
      props.onSuccessCreateCommonTopology?.(createCommonTopologyResult)
    },
    [props.onSuccessCreateCommonTopology, notifier]
  )

  const {
    formInternal,
    data,
    errors,
    clearFields,
    moveFields,
    handleFieldChange,
    handleCheckboxChange,
    handleTextFieldChange,
    handleAutocompleteSingleSelectChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange
  } = useForm<
    CreateCommonTopologyFormData,
    CreateCommonTopologySuccessResultDto
  >({
    INITIAL_FORM_DATA: INITIAL_CREATE_COMMON_TOPOLOGY_FORM_DATA,
    validator: createCommonTopologyFormValidator,
    fieldsWithNotIgnoredErrorsBeforeSubmit,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const config = React.useMemo(
    () => calculateConfig(data),
    [calculateConfig, data]
  )

  const updateFieldsWithNotIgnoredErrorsBeforeSubmit = React.useCallback(() => {
    setFieldsWithNotIgnoredErrorsBeforeSubmit([
      ...DEFAULT_FIELDS_WITH_NOT_IGNORED_ERRORS_BEFORE_SUBMIT,
      ...Array.from(Array(data.vertexesCount).keys()).flatMap((vertexIndex) => [
        getVertexNameField(vertexIndex),
        getVertexIsGeneratorField(vertexIndex),
        getVertexIfaceNamesField(vertexIndex)
      ]),
      ...Array.from(Array(data.linksCount).keys()).flatMap((linkIndex) => [
        getStartVertexIfacePairField(linkIndex),
        getEndVertexIfacePairField(linkIndex)
      ])
    ])
  }, [
    setFieldsWithNotIgnoredErrorsBeforeSubmit,
    data.vertexesCount,
    data.linksCount
  ])

  useChangeDetector({
    detectedObjects: [data.vertexesCount],
    otherDependencies: [
      clearFields,
      updateFieldsWithNotIgnoredErrorsBeforeSubmit
    ],
    onChange: ([oldVertexesCount]) => {
      if (data.vertexesCount < oldVertexesCount) {
        clearFields(
          Array.from(Array(oldVertexesCount).keys())
            .filter((vertexIndex) => vertexIndex >= data.vertexesCount)
            .flatMap((vertexIndex) => [
              getVertexNameField(vertexIndex),
              getVertexIsGeneratorField(vertexIndex),
              getVertexIfaceNamesField(vertexIndex)
            ]),
          true
        )
      }
      updateFieldsWithNotIgnoredErrorsBeforeSubmit()
    }
  })

  useChangeDetector({
    detectedObjects: [data.linksCount],
    otherDependencies: [
      clearFields,
      updateFieldsWithNotIgnoredErrorsBeforeSubmit
    ],
    onChange: ([oldLinksCount]) => {
      if (data.linksCount < oldLinksCount) {
        clearFields(
          Array.from(Array(oldLinksCount).keys())
            .filter((linkIndex) => linkIndex >= data.linksCount)
            .flatMap((linkIndex) => [
              getStartVertexIfacePairField(linkIndex),
              getEndVertexIfacePairField(linkIndex)
            ]),
          true
        )
      }
      updateFieldsWithNotIgnoredErrorsBeforeSubmit()
    }
  })

  const vertexNameIfaceNamePairs = React.useMemo(
    () =>
      Array.from(Array(data.vertexesCount).keys()).flatMap((vertexIndex) => {
        const vertexNameField = getVertexNameField(vertexIndex)
        const vertexIfaceNamesField = getVertexIfaceNamesField(vertexIndex)
        let vertexName = data[vertexNameField] as string | undefined
        if (vertexName?.trim() === '') {
          vertexName = undefined
        }
        const ifaceNames = data[vertexIfaceNamesField] as string[] | undefined
        return vertexName !== undefined
          ? (ifaceNames ?? []).map(
              (ifaceName) =>
                `${vertexName}${VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR}${ifaceName}`
            )
          : []
      }),
    [data]
  )

  for (const vertexIndex of Array.from(
    Array(MAX_VERTEXES_IN_COMMON_TOPOLOGY).keys()
  )) {
    const vertexNameField = getVertexNameField(vertexIndex)
    const vertexIfaceNamesField = getVertexIfaceNamesField(vertexIndex)
    useChangeDetector({
      detectedObjects: [data[vertexNameField] as string | undefined],
      otherDependencies: [data, handleFieldChange],
      onChange: ([oldVertexName]) => {
        let newVertexName = data[vertexNameField] as string | undefined
        if (newVertexName?.trim() === '') {
          newVertexName = undefined
        }
        for (const linkIndex of Array.from(Array(data.linksCount).keys())) {
          const startVertexIfacePairField =
            getStartVertexIfacePairField(linkIndex)
          const endVertexIfacePairField = getEndVertexIfacePairField(linkIndex)
          const startVertexIfacePair = data[startVertexIfacePairField] as
            | string
            | undefined
          const endVertexIfacePair = data[endVertexIfacePairField] as
            | string
            | undefined
          if (startVertexIfacePair !== undefined) {
            const [vertexName, ifaceName] = startVertexIfacePair.split(
              VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR
            )
            if (vertexName === oldVertexName) {
              handleFieldChange(
                startVertexIfacePairField,
                newVertexName !== undefined
                  ? `${newVertexName}${VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR}${ifaceName}`
                  : undefined
              )
            }
          }
          if (endVertexIfacePair !== undefined) {
            const [vertexName, ifaceName] = endVertexIfacePair.split(
              VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR
            )
            if (vertexName === oldVertexName) {
              handleFieldChange(
                endVertexIfacePairField,
                newVertexName !== undefined
                  ? `${newVertexName}${VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR}${ifaceName}`
                  : undefined
              )
            }
          }
        }
      }
    })
    useChangeDetector({
      detectedObjects: [data[vertexIfaceNamesField] as string[] | undefined],
      otherDependencies: [data, handleFieldChange],
      onChange: ([oldVertexIfaceNames]) => {
        const currentVertexName = data[vertexNameField] as string | undefined
        if (currentVertexName !== undefined) {
          const deletedVertexNamesSet = (() => {
            const vertexIfaceNamesSet = new Set(oldVertexIfaceNames ?? [])
            for (const vertexIfaceName of (data[vertexIfaceNamesField] as
              | string[]
              | undefined) ?? []) {
              vertexIfaceNamesSet.delete(vertexIfaceName)
            }
            return vertexIfaceNamesSet
          })()
          for (const linkIndex of Array.from(Array(data.linksCount).keys())) {
            const startVertexIfacePairField =
              getStartVertexIfacePairField(linkIndex)
            const endVertexIfacePairField =
              getEndVertexIfacePairField(linkIndex)
            const startVertexIfacePair = data[startVertexIfacePairField] as
              | string
              | undefined
            const endVertexIfacePair = data[endVertexIfacePairField] as
              | string
              | undefined
            if (startVertexIfacePair !== undefined) {
              const [vertexName, ifaceName] = startVertexIfacePair.split(
                VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR
              )
              if (
                vertexName === currentVertexName &&
                deletedVertexNamesSet.has(ifaceName)
              ) {
                handleFieldChange(startVertexIfacePairField, undefined)
              }
            }
            if (endVertexIfacePair !== undefined) {
              const [vertexName, ifaceName] = endVertexIfacePair.split(
                VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR
              )
              if (
                vertexName === currentVertexName &&
                deletedVertexNamesSet.has(ifaceName)
              ) {
                handleFieldChange(endVertexIfacePairField, undefined)
              }
            }
          }
        }
      }
    })
  }

  const handleAddVertexClick = React.useCallback(() => {
    if (data.vertexesCount < MAX_VERTEXES_IN_COMMON_TOPOLOGY) {
      handleFieldChange('vertexesCount', data.vertexesCount + 1)
    }
  }, [data.vertexesCount, handleFieldChange])

  const handleAddLinkClick = React.useCallback(() => {
    if (data.linksCount < MAX_LINKS_IN_COMMON_TOPOLOGY) {
      handleFieldChange('linksCount', data.linksCount + 1)
    }
  }, [data.linksCount, handleFieldChange])

  const handleDeleteVertexClick = React.useCallback(
    (deletedVertexIndex: number) => {
      moveFields(
        Array.from(Array(data.vertexesCount).keys()).flatMap((vertexIndex) =>
          vertexIndex >= deletedVertexIndex &&
          vertexIndex < data.vertexesCount - 1
            ? [
                {
                  oldField: getVertexNameField(vertexIndex + 1),
                  newField: getVertexNameField(vertexIndex)
                },
                {
                  oldField: getVertexIsGeneratorField(vertexIndex + 1),
                  newField: getVertexIsGeneratorField(vertexIndex)
                },
                {
                  oldField: getVertexIfaceNamesField(vertexIndex + 1),
                  newField: getVertexIfaceNamesField(vertexIndex)
                }
              ]
            : []
        )
      )
      handleFieldChange('vertexesCount', data.vertexesCount - 1)
    },
    [data.vertexesCount, moveFields]
  )

  const handleDeleteLinkClick = React.useCallback(
    (deletedLinkIndex: number) => {
      moveFields(
        Array.from(Array(data.linksCount).keys()).flatMap((linkIndex) =>
          linkIndex >= deletedLinkIndex && linkIndex < data.linksCount - 1
            ? [
                {
                  oldField: getStartVertexIfacePairField(linkIndex + 1),
                  newField: getStartVertexIfacePairField(linkIndex)
                },
                {
                  oldField: getEndVertexIfacePairField(linkIndex + 1),
                  newField: getEndVertexIfacePairField(linkIndex)
                }
              ]
            : []
        )
      )
      handleFieldChange('linksCount', data.linksCount - 1)
    },
    [data.linksCount, moveFields]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title="создать общую топологию"
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
          helperText={
            errors?.code ?? CREATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED.code ?? ' '
          }
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? CREATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED.name ?? ' '
          }
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormNumField
          name="num"
          label="номер"
          value={data.num ?? ''}
          helperText={
            errors?.num ?? CREATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED.num ?? ' '
          }
          error={!!errors?.num}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
      {Array.from(Array(data.vertexesCount).keys()).map((vertexIndex) => {
        const vertexNameField = getVertexNameField(vertexIndex)
        const vertexIsGeneratorField = getVertexIsGeneratorField(vertexIndex)
        const vertexIfaceNamesField = getVertexIfaceNamesField(vertexIndex)
        return (
          <FormBlock
            key={vertexIndex}
            title={`вершина ${vertexIndex + 1}`}
            buttons={[
              {
                id: vertexIndex,
                Icon: ClearIcon,
                prompt: 'удалить вершину',
                onClick: handleDeleteVertexClick
              }
            ]}
          >
            <FormTextField
              required
              name={vertexNameField}
              label="название"
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              value={data[vertexNameField] ?? ''}
              helperText={
                errors?.[vertexNameField] ??
                CREATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED[vertexNameField] ??
                ' '
              }
              error={!!errors?.[vertexNameField]}
              onChange={handleTextFieldChange}
            />
            <FormCheckbox
              name={vertexIsGeneratorField}
              label="генератор"
              onChange={handleCheckboxChange}
            />
            <FormAutocompleteFreeItemsMultipleSelect
              name={'_' + vertexIfaceNamesField}
              freeItemsFieldName={vertexIfaceNamesField}
              label="интерфейсы"
              possibleValues={EMPTY_VERTEX_IFACE_NAMES_ARR}
              values={EMPTY_VERTEX_IFACE_NAMES_ARR}
              freeItems={
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                data[vertexIfaceNamesField] ?? EMPTY_VERTEX_IFACE_NAMES_ARR
              }
              helperText={
                errors?.[vertexIfaceNamesField] ??
                CREATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED[
                  vertexIfaceNamesField
                ] ??
                ' '
              }
              error={!!errors?.[vertexIfaceNamesField]}
              onChange={handleAutocompleteMultipleSelectChange}
              onChangeFreeItems={
                handleAutocompleteMultipleSelectFreeItemsChange
              }
            />
          </FormBlock>
        )
      })}
      {data.vertexesCount < MAX_VERTEXES_IN_COMMON_TOPOLOGY ? (
        <FormBlock title={data.vertexesCount === 0 ? 'вершины' : undefined}>
          <ProjButton variant="outlined" onClick={handleAddVertexClick}>
            добавить вершину
          </ProjButton>
        </FormBlock>
      ) : null}
      {Array.from(Array(data.linksCount).keys()).map((linkIndex) => {
        const startVertexIfacePairField =
          getStartVertexIfacePairField(linkIndex)
        const endVertexIfacePairField = getEndVertexIfacePairField(linkIndex)
        return (
          <FormBlock
            key={linkIndex}
            title={`связь ${linkIndex + 1}`}
            buttons={[
              {
                id: linkIndex,
                Icon: ClearIcon,
                prompt: 'удалить связь',
                onClick: handleDeleteLinkClick
              }
            ]}
          >
            <FormAutocompleteSingleSelect
              name={startVertexIfacePairField}
              label="начало"
              possibleValues={vertexNameIfaceNamePairs}
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              value={data[startVertexIfacePairField] ?? null}
              helperText={
                errors?.[startVertexIfacePairField] ??
                CREATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED[
                  startVertexIfacePairField
                ] ??
                ' '
              }
              error={!!errors?.[startVertexIfacePairField]}
              onChange={handleAutocompleteSingleSelectChange}
            />
            <FormAutocompleteSingleSelect
              name={endVertexIfacePairField}
              label="конец"
              possibleValues={vertexNameIfaceNamePairs}
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              value={data[endVertexIfacePairField] ?? null}
              helperText={
                errors?.[endVertexIfacePairField] ??
                CREATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED[
                  endVertexIfacePairField
                ] ??
                ' '
              }
              error={!!errors?.[endVertexIfacePairField]}
              onChange={handleAutocompleteSingleSelectChange}
            />
          </FormBlock>
        )
      })}
      {data.linksCount < MAX_LINKS_IN_COMMON_TOPOLOGY ? (
        <FormBlock title={data.linksCount === 0 ? 'связи' : undefined}>
          <ProjButton variant="outlined" onClick={handleAddLinkClick}>
            добавить связь
          </ProjButton>
        </FormBlock>
      ) : null}
      <FormBlock title="схема">
        <TopologyConfigSchema
          config={
            config.vertexes.length > 0 || config.links.length > 0
              ? config
              : null
          }
          nullConfigTitle="схема общей топологии"
        />
      </FormBlock>
      <FormBlock title="дополнительная информация">
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            CREATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED.descriptionText ??
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
              addMes(CREATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED.tagIds)
              addMes(CREATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED.tagCodesToCreate)
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
            CREATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
