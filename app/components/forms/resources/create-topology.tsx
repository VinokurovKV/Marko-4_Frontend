// Project
import type { ReadCommonTopologiesWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/common-topologies.dto'
import type { CreateTopologySuccessResultDto } from '@common/dtos/server-api/topologies.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { calculateTopologyConfig } from '@common/utilities'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useChangeDetector } from '~/hooks/change-detector'
import { useCommonTopology, useTags } from '~/hooks/resources'
import {
  type CreateTopologyFormData,
  INITIAL_CREATE_TOPOLOGY_FORM_DATA,
  createTopologyFormValidator
} from '~/data/forms/resources/create-topology'
import { TopologyConfigSchema } from '~/components/topologies/topology-config-schema'
import {
  useForm,
  FormAutocompleteFreeItemsMultipleSelect,
  FormAutocompleteMultipleSelect,
  FormAutocompleteSingleSelect,
  FormBlock,
  FormDialog,
  FormMultilineTextField,
  FormNumField,
  FormTextField
} from '../common'
// React
import * as React from 'react'

const EMPTY_TAG_IDS_ARR: number[] = []
const EMPTY_TAG_CODES_ARR: string[] = []
const EMPTY_VERTEX_NAMES_ARR: string[] = []

type CommonTopology =
  DtoWithoutEnums<ReadCommonTopologiesWithPrimaryPropsSuccessResultItemDto>

const CREATE_TOPOLOGY_FORM_PROPS_JOINED =
  createTopologyFormValidator.getPromptsJoined()

export interface CreateTopologyFormDialogProps {
  commonTopologies: CommonTopology[] | null
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessCreateTopology?: (
    createTopologyResult: CreateTopologySuccessResultDto
  ) => void
  onCancelClick?: () => void
}

export function CreateTopologyFormDialog(props: CreateTopologyFormDialogProps) {
  const notifier = useNotifier()

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

  const submitAction = React.useCallback(
    async (validatedData: CreateTopologyFormData) => {
      const {
        descriptionText,
        remarkText,
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

      return await serverConnector.createTopology({
        ...truncatedData,
        commonTopologyId: truncatedData.commonTopologyId!,
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
            ? [...(tagIds ?? []), ...recentlyCreatedTagIds, ...newCreatedTagIds]
            : undefined
      })
    },
    [notifier, tagIdForCode]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: CreateTopologyFormData,
      createTopologyResult: CreateTopologySuccessResultDto
    ) => {
      notifier.showSuccess(`топология '${data.code}' создана`)
      props.onSuccessCreateTopology?.(createTopologyResult)
    },
    [props.onSuccessCreateTopology, notifier]
  )

  const {
    formInternal,
    data,
    errors,
    handleFieldChange,
    handleTextFieldChange,
    handleAutocompleteSingleSelectChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange
  } = useForm<CreateTopologyFormData, CreateTopologySuccessResultDto>({
    INITIAL_FORM_DATA: INITIAL_CREATE_TOPOLOGY_FORM_DATA,
    validator: createTopologyFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

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

  const commonTopology = useCommonTopology(
    'UP_TO_TERTIARY_PROPS',
    data.commonTopologyId ?? null
  )

  const commonTopologyConfig = React.useMemo(
    () => commonTopology?.config ?? null,
    [commonTopology]
  )

  const commonTopologyVertexNames = React.useMemo(
    () => commonTopology?.vertexNames ?? EMPTY_VERTEX_NAMES_ARR,
    [commonTopology]
  )

  const topologyConfig = React.useMemo(() => {
    return commonTopologyConfig !== null
      ? calculateTopologyConfig(commonTopologyConfig, data.vertexNames ?? [])
      : null
  }, [data.vertexNames, commonTopologyConfig])

  // Process common topology vertex names change
  useChangeDetector({
    detectedObjects: [commonTopologyVertexNames],
    otherDependencies: [data.vertexNames, handleFieldChange],
    onChange: ([oldCommonTopologyVertexNames]) => {
      const deletedVertexNamesSet = (() => {
        const newVertexNamesSet = new Set(commonTopologyVertexNames)
        return new Set(
          oldCommonTopologyVertexNames.filter(
            (vertexName) => newVertexNamesSet.has(vertexName) === false
          )
        )
      })()
      if (
        deletedVertexNamesSet.size > 0 &&
        (data.vertexNames ?? []).some((vertexName) =>
          deletedVertexNamesSet.has(vertexName)
        )
      ) {
        handleFieldChange(
          'vertexNames',
          data.vertexNames!.filter(
            (vertexName) => deletedVertexNamesSet.has(vertexName) === false
          )
        )
      }
    }
  })

  return (
    <FormDialog
      formInternal={formInternal}
      title="создать топологию"
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
            errors?.code ?? CREATE_TOPOLOGY_FORM_PROPS_JOINED.code ?? ' '
          }
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? CREATE_TOPOLOGY_FORM_PROPS_JOINED.name ?? ' '
          }
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormAutocompleteSingleSelect
          required
          name="commonTopologyId"
          label="общая топология"
          possibleValues={commonTopologyIds}
          titleForValue={commonTopologyCodeForId}
          value={data.commonTopologyId ?? null}
          helperText={
            errors?.commonTopologyId ??
            CREATE_TOPOLOGY_FORM_PROPS_JOINED.commonTopologyId ??
            ' '
          }
          error={!!errors?.commonTopologyId}
          onChange={handleAutocompleteSingleSelectChange}
        />
        <FormAutocompleteMultipleSelect
          name="vertexNames"
          label="вершины"
          possibleValues={commonTopologyVertexNames}
          values={data.vertexNames ?? EMPTY_VERTEX_NAMES_ARR}
          helperText={
            errors?.vertexNames ??
            CREATE_TOPOLOGY_FORM_PROPS_JOINED.vertexNames ??
            ' '
          }
          error={!!errors?.vertexNames}
          onChange={handleAutocompleteMultipleSelectChange}
        />
        <FormNumField
          name="numInCommonTopology"
          label="номер в общей топологии"
          value={data.numInCommonTopology ?? ''}
          helperText={
            errors?.numInCommonTopology ??
            CREATE_TOPOLOGY_FORM_PROPS_JOINED.numInCommonTopology ??
            ' '
          }
          error={!!errors?.numInCommonTopology}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
      <FormBlock title="схема">
        <TopologyConfigSchema
          config={topologyConfig}
          nullConfigTitle="схема топологии"
        />
      </FormBlock>
      <FormBlock title="дополнительная информация">
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            CREATE_TOPOLOGY_FORM_PROPS_JOINED.descriptionText ??
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
              addMes(CREATE_TOPOLOGY_FORM_PROPS_JOINED.tagIds)
              addMes(CREATE_TOPOLOGY_FORM_PROPS_JOINED.tagCodesToCreate)
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
            CREATE_TOPOLOGY_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
