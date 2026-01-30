// Project
import type { UpdateCommonTopologySuccessResultDto } from '@common/dtos/server-api/common-topologies.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import type { CommonTopologyConfig, CommonTopologyTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useChangeDetector } from '~/hooks/change-detector'
import { useCommonTopologySubscription } from '~/hooks/resources'
import { useTags } from '~/hooks/resources'
import {
  type UpdateCommonTopologyFormDataWithoutConfig,
  type UpdateCommonTopologyFormData,
  MAX_VERTEXES_IN_COMMON_TOPOLOGY,
  MAX_LINKS_IN_COMMON_TOPOLOGY,
  getVertexIdField,
  getUniqueVertexId,
  getVertexNameField,
  getVertexIsGeneratorField,
  getVertexIfaceNamesField,
  getLinkIdField,
  getUniqueLinkId,
  getStartVertexIfacePairField,
  getEndVertexIfacePairField,
  updateCommonTopologyFormValidator
} from '~/data/forms/resources/update-common-topology'
import { ProjButton } from '~/components/buttons/button'
import { TopologyConfigSchema } from '~/components/topologies/topology-config-schema'
import {
  createTagsAndGetIds,
  prepareArrFieldForUpdate as prepareArr,
  prepareOptionalFieldForUpdate as prepareOptional,
  prepareRequiredFieldForUpdate as prepareRequired,
  prepareTextFieldForUpdate as prepareText,
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

const EMPTY_TAG_IDS_ARR: number[] = []
const EMPTY_TAG_CODES_ARR: string[] = []
const EMPTY_VERTEX_IFACE_NAMES_ARR: string[] = []
const DEFAULT_FIELDS_WITH_NOT_IGNORED_ERRORS_BEFORE_SUBMIT: Field<UpdateCommonTopologyFormDataWithoutConfig>[] =
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

const UPDATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED =
  updateCommonTopologyFormValidator.getPromptsJoined()

export interface UpdateCommonTopologyFormDialogProps {
  commonTopologyId: number | null
  setCommonTopologyId: React.Dispatch<React.SetStateAction<number | null>>
  initialCommonTopology: CommonTopologyTertiary | null
  onSuccessUpdateCommonTopology?: (
    updateCommonTopologyResult: DtoWithoutEnums<UpdateCommonTopologySuccessResultDto>
  ) => void
  onCancelClick?: () => void
}

export function UpdateCommonTopologyFormDialog(
  props: UpdateCommonTopologyFormDialogProps
) {
  const notifier = useNotifier()
  const meta = useMeta()
  const selfId = React.useMemo(
    () => (meta.status !== 'AUTHENTICATED' ? null : meta.selfMeta.id),
    [meta]
  )

  const [commonTopology, setCommonTopology] =
    React.useState<CommonTopologyTertiary | null>(props.initialCommonTopology)
  useCommonTopologySubscription(
    'UP_TO_TERTIARY_PROPS',
    props.commonTopologyId,
    setCommonTopology
  )

  const [
    fieldsWithNotIgnoredErrorsBeforeSubmit,
    setFieldsWithNotIgnoredErrorsBeforeSubmit
  ] = React.useState<Field<UpdateCommonTopologyFormData>[]>(
    DEFAULT_FIELDS_WITH_NOT_IGNORED_ERRORS_BEFORE_SUBMIT
  )

  const tags = useTags('PRIMARY_PROPS', false, props.commonTopologyId !== null)

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
    (data: UpdateCommonTopologyFormData) => {
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

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToEvents(
      {
        filter: {
          types: [
            'UPDATE_COMMON_TOPOLOGY',
            'DELETE_COMMON_TOPOLOGY',
            'DELETE_COMMON_TOPOLOGIES'
          ]
        }
      },
      (data) => {
        ;(() => {
          if (props.commonTopologyId !== null) {
            for (const event of data) {
              if (selfId !== null && event.initiatorId !== selfId) {
                if (
                  event.type === 'UPDATE_COMMON_TOPOLOGY' &&
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  (event as any).config?.resource?.id === props.commonTopologyId
                ) {
                  notifier.showWarning(
                    `редактируемая общая топология изменена другим пользователем`
                  )
                } else if (
                  (event.type === 'DELETE_COMMON_TOPOLOGY' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resource?.id ===
                      props.commonTopologyId) ||
                  (event.type === 'DELETE_COMMON_TOPOLOGIES' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resources?.some?.(
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      (resource: any) => resource?.id === props.commonTopologyId
                    ))
                ) {
                  notifier.showWarning(
                    `редактируемая общая топология удалена другим пользователем`
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
  }, [props.commonTopologyId, notifier, selfId])

  const submitAction = React.useCallback(
    async (validatedData: UpdateCommonTopologyFormData) => {
      if (props.commonTopologyId === null) {
        throw new Error('отсутствует идентификатор общей топологии')
      } else if (commonTopology === null) {
        throw new Error(
          `отсутствует доступ к текущим характеристикам редактируемой общей топологии`
        )
      } else {
        const { descriptionText, remarkText, tagIds, tagCodesToCreate } =
          validatedData

        const recentlyCreatedTagIds = (tagCodesToCreate ?? [])
          .map((tagCodeToCreate) => tagIdForCode.get(tagCodeToCreate))
          .filter((tagId) => tagId !== undefined)

        const newCreatedTagIds = await createTagsAndGetIds(
          tagIdForCode,
          tagCodesToCreate,
          notifier
        )

        return await serverConnector.updateCommonTopology({
          id: props.commonTopologyId,
          code: prepareRequired(commonTopology.code, validatedData.code),
          name: prepareOptional(commonTopology.name, validatedData.name),
          num: prepareOptional(commonTopology.num, validatedData.num),
          description: prepareText(commonTopology.description, descriptionText),
          remark: prepareText(commonTopology.remark, remarkText),
          tagIds: prepareArr(commonTopology.tagIds, [
            ...(tagIds ?? []),
            ...recentlyCreatedTagIds,
            ...newCreatedTagIds
          ]),
          config: calculateConfig(validatedData)
        })
      }
    },
    [
      props.commonTopologyId,
      notifier,
      commonTopology,
      tagIdForCode,
      calculateConfig
    ]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: UpdateCommonTopologyFormData,
      updateCommonTopologyResult: DtoWithoutEnums<UpdateCommonTopologySuccessResultDto>
    ) => {
      notifier.showSuccess(`общая топология «${commonTopology?.code}» изменена`)
      props.onSuccessUpdateCommonTopology?.(updateCommonTopologyResult)
    },
    [props.onSuccessUpdateCommonTopology, notifier, commonTopology]
  )

  const initialFormData = React.useMemo(() => {
    const data: UpdateCommonTopologyFormData = {
      code: commonTopology?.code ?? '',
      name: commonTopology?.name ?? undefined,
      num: commonTopology?.num ?? undefined,
      descriptionText: commonTopology?.description?.text,
      remarkText: commonTopology?.remark?.text,
      tagIds: commonTopology?.tagIds,
      vertexesCount: commonTopology?.config.vertexes.length ?? 0,
      linksCount: commonTopology?.config.links.length ?? 0
    }
    for (const [vertexIndex, vertex] of (
      commonTopology?.config.vertexes ?? []
    ).entries()) {
      data[getVertexIdField(vertexIndex)] = getUniqueVertexId()
      data[getVertexNameField(vertexIndex)] = vertex.name ?? undefined
      data[getVertexIsGeneratorField(vertexIndex)] = vertex.isGenerator
      data[getVertexIfaceNamesField(vertexIndex)] = vertex.ifaces.map(
        (iface) => iface.name
      )
    }
    for (const [linkIndex, link] of (
      commonTopology?.config.links ?? []
    ).entries()) {
      data[getLinkIdField(linkIndex)] = getUniqueLinkId()
      data[getStartVertexIfacePairField(linkIndex)] =
        `${link.start.vertexName}${VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR}${link.start.ifaceName}`
      data[getEndVertexIfacePairField(linkIndex)] =
        `${link.end.vertexName}${VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR}${link.end.ifaceName}`
    }
    return data
  }, [commonTopology])

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
    UpdateCommonTopologyFormData,
    DtoWithoutEnums<UpdateCommonTopologySuccessResultDto>
  >({
    INITIAL_FORM_DATA: initialFormData,
    validator: updateCommonTopologyFormValidator,
    clearTrigger: commonTopology?.id,
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

  // Process data.vertexesCount change
  useChangeDetector({
    detectedObjects: [data.vertexesCount],
    otherDependencies: [
      clearFields,
      handleFieldChange,
      updateFieldsWithNotIgnoredErrorsBeforeSubmit
    ],
    onChange: ([oldVertexesCount]) => {
      if (data.vertexesCount < oldVertexesCount) {
        clearFields(
          Array.from(Array(oldVertexesCount).keys())
            .filter((vertexIndex) => vertexIndex >= data.vertexesCount)
            .flatMap((vertexIndex) => [
              getVertexIdField(vertexIndex),
              getVertexNameField(vertexIndex),
              getVertexIsGeneratorField(vertexIndex),
              getVertexIfaceNamesField(vertexIndex)
            ])
          // true
        )
      } else if (data.vertexesCount > oldVertexesCount) {
        for (
          let vertexIndex = oldVertexesCount;
          vertexIndex < data.vertexesCount;
          vertexIndex++
        ) {
          handleFieldChange(getVertexIdField(vertexIndex), getUniqueVertexId())
        }
      }
      updateFieldsWithNotIgnoredErrorsBeforeSubmit()
    }
  })

  // Process data.linksCount change
  useChangeDetector({
    detectedObjects: [data.linksCount],
    otherDependencies: [
      clearFields,
      handleFieldChange,
      updateFieldsWithNotIgnoredErrorsBeforeSubmit
    ],
    onChange: ([oldLinksCount]) => {
      if (data.linksCount < oldLinksCount) {
        clearFields(
          Array.from(Array(oldLinksCount).keys())
            .filter((linkIndex) => linkIndex >= data.linksCount)
            .flatMap((linkIndex) => [
              getLinkIdField(linkIndex),
              getStartVertexIfacePairField(linkIndex),
              getEndVertexIfacePairField(linkIndex)
            ])
          // true
        )
      } else if (data.linksCount > oldLinksCount) {
        for (
          let linkIndex = oldLinksCount;
          linkIndex < data.linksCount;
          linkIndex++
        ) {
          handleFieldChange(getLinkIdField(linkIndex), getUniqueLinkId())
        }
      }
      updateFieldsWithNotIgnoredErrorsBeforeSubmit()
    }
  })

  const vertexNameIfaceNamePairs = React.useMemo(
    () =>
      Array.from(
        new Set(
          Array.from(Array(data.vertexesCount).keys()).flatMap(
            (vertexIndex) => {
              const vertexNameField = getVertexNameField(vertexIndex)
              const vertexIfaceNamesField =
                getVertexIfaceNamesField(vertexIndex)
              let vertexName = data[vertexNameField] as string | undefined
              if (vertexName?.trim() === '') {
                vertexName = undefined
              }
              const ifaceNames = data[vertexIfaceNamesField] as
                | string[]
                | undefined
              return vertexName !== undefined
                ? (ifaceNames ?? []).map(
                    (ifaceName) =>
                      `${vertexName}${VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR}${ifaceName}`
                  )
                : []
            }
          )
        )
      ).toSorted(),
    [data]
  )

  const updateLinkIfacesForVertexName = React.useCallback(
    (vertexName: string, newVertexName: string | undefined) => {
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
          const [linkVertexName, linkIfaceName] = startVertexIfacePair.split(
            VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR
          )
          if (linkVertexName === vertexName) {
            handleFieldChange(
              startVertexIfacePairField,
              newVertexName !== undefined
                ? `${newVertexName}${VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR}${linkIfaceName}`
                : undefined
            )
          }
        }
        if (endVertexIfacePair !== undefined) {
          const [linkVertexName, linkIfaceName] = endVertexIfacePair.split(
            VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR
          )
          if (linkVertexName === vertexName) {
            handleFieldChange(
              endVertexIfacePairField,
              newVertexName !== undefined
                ? `${newVertexName}${VERTEX_NAME_IFACE_NAME_PAIR_SEPARATOR}${linkIfaceName}`
                : undefined
            )
          }
        }
      }
    },
    [data, handleFieldChange]
  )

  // Process vertex name change
  for (const vertexIndex of Array.from(
    Array(MAX_VERTEXES_IN_COMMON_TOPOLOGY).keys()
  )) {
    const vertexIdField = getVertexIdField(vertexIndex)
    const vertexNameField = getVertexNameField(vertexIndex)
    useChangeDetector({
      detectedObjects: [data[vertexIdField], data[vertexNameField]] as [
        number | undefined,
        string | undefined
      ],
      otherDependencies: [data, updateLinkIfacesForVertexName],
      onChange: ([oldVertexId, oldVertexName]) => {
        const newVertexId = data[vertexIdField] as number | undefined
        let newVertexName = data[vertexNameField] as string | undefined
        if (newVertexId === oldVertexId && newVertexName !== oldVertexName) {
          if (newVertexName?.trim() === '') {
            newVertexName = undefined
          }
          if (oldVertexName !== undefined) {
            updateLinkIfacesForVertexName(oldVertexName, newVertexName)
          }
        }
      }
    })
  }

  // Process vertex iface names change
  for (const vertexIndex of Array.from(
    Array(MAX_VERTEXES_IN_COMMON_TOPOLOGY).keys()
  )) {
    const vertexIdField = getVertexIdField(vertexIndex)
    const vertexNameField = getVertexNameField(vertexIndex)
    const vertexIfaceNamesField = getVertexIfaceNamesField(vertexIndex)
    useChangeDetector({
      detectedObjects: [data[vertexIdField], data[vertexIfaceNamesField]] as [
        number | undefined,
        string[] | undefined
      ],
      otherDependencies: [data, handleFieldChange],
      onChange: ([oldVertexId, oldVertexIfaceNames]) => {
        const newVertexId = data[vertexIdField] as number | undefined
        const currentVertexName = data[vertexNameField] as string | undefined
        const newVertexIfaceNames = data[vertexIfaceNamesField] as
          | string[]
          | undefined
        if (
          newVertexId === oldVertexId &&
          newVertexIfaceNames !== oldVertexIfaceNames &&
          currentVertexName !== undefined
        ) {
          const deletedVertexIfaceNamesSet = (() => {
            const vertexIfaceNamesSet = new Set(oldVertexIfaceNames ?? [])
            for (const vertexIfaceName of newVertexIfaceNames ?? []) {
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
                deletedVertexIfaceNamesSet.has(ifaceName)
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
                deletedVertexIfaceNamesSet.has(ifaceName)
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
      updateLinkIfacesForVertexName(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        data[getVertexNameField(deletedVertexIndex)],
        undefined
      )
    },
    [data, moveFields, handleFieldChange, updateLinkIfacesForVertexName]
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
    [data.linksCount, moveFields, handleFieldChange]
  )

  const setIsActive = React.useCallback(
    (value: boolean | ((prevState: boolean) => boolean)) => {
      if (value === false) {
        props.setCommonTopologyId(null)
      } else {
        throw new Error()
      }
    },
    [props.setCommonTopologyId]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title={`изменить общую топологию «${commonTopology?.code}»`}
      submitButtonTitle="изменить"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'к текущим значениям'
      }}
      isActive={props.commonTopologyId !== null}
      setIsActive={setIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="code"
          label="код"
          value={data.code}
          helperText={
            errors?.code ?? UPDATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED.code ?? ' '
          }
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? UPDATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED.name ?? ' '
          }
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormNumField
          name="num"
          label="номер"
          value={data.num ?? ''}
          helperText={
            errors?.num ?? UPDATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED.num ?? ' '
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
                UPDATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED[vertexNameField] ??
                ' '
              }
              error={!!errors?.[vertexNameField]}
              onChange={handleTextFieldChange}
            />
            <FormCheckbox
              name={vertexIsGeneratorField}
              label="генератор"
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              checked={data[vertexIsGeneratorField]}
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
                UPDATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED[
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
                UPDATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED[
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
                UPDATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED[
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
            UPDATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED.descriptionText ??
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
              addMes(UPDATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED.tagIds)
              addMes(UPDATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED.tagCodesToCreate)
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
            UPDATE_COMMON_TOPOLOGY_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
