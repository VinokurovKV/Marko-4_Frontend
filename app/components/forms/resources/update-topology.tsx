// Project
import type { UpdateTopologySuccessResultDto } from '@common/dtos/server-api/topologies.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { calculateTopologyConfig } from '@common/utilities'
import type { CommonTopologyPrimary, TopologyTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useChangeDetector } from '~/hooks/change-detector'
import { useTopologySubscription } from '~/hooks/resources'
import { useCommonTopology, useTags } from '~/hooks/resources'
import {
  type UpdateTopologyFormData,
  updateTopologyFormValidator
} from '~/data/forms/resources/update-topology'
import { TopologyConfigSchema } from '~/components/topologies/topology-config-schema'
import {
  createTagsAndGetIds,
  prepareArrFieldForUpdate as prepareArr,
  prepareOptionalFieldForUpdate as prepareOptional,
  prepareRequiredFieldForUpdate as prepareRequired,
  prepareTextFieldForUpdate as prepareText,
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

const UPDATE_TOPOLOGY_FORM_PROPS_JOINED =
  updateTopologyFormValidator.getPromptsJoined()

export interface UpdateTopologyFormDialogProps {
  commonTopologies: CommonTopologyPrimary[] | null
  topologyId: number | null
  setTopologyId: React.Dispatch<React.SetStateAction<number | null>>
  initialTopology: TopologyTertiary | null
  onSuccessUpdateTopology?: (
    updateTopologyResult: DtoWithoutEnums<UpdateTopologySuccessResultDto>
  ) => void
  onCancelClick?: () => void
}

export function UpdateTopologyFormDialog(props: UpdateTopologyFormDialogProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const selfId = React.useMemo(
    () => (meta.status !== 'AUTHENTICATED' ? null : meta.selfMeta.id),
    [meta]
  )

  const [topology, setTopology] = React.useState<TopologyTertiary | null>(
    props.initialTopology
  )
  useTopologySubscription('UP_TO_TERTIARY_PROPS', props.topologyId, setTopology)

  const tags = useTags('PRIMARY_PROPS', false, props.topologyId !== null)

  const tagIds = React.useMemo(() => tags?.map((tag) => tag.id) ?? [], [tags])

  const tagCodeForId = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.id, tag.code])),
    [tags]
  )

  const tagIdForCode = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.code, tag.id])),
    [tags]
  )

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToEvents(
      {
        filter: {
          types: ['UPDATE_TOPOLOGY', 'DELETE_TOPOLOGY', 'DELETE_TOPOLOGIES']
        }
      },
      (data) => {
        ;(() => {
          if (props.topologyId !== null) {
            for (const event of data) {
              if (selfId !== null && event.initiatorId !== selfId) {
                if (
                  event.type === 'UPDATE_TOPOLOGY' &&
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  (event as any).config?.resource?.id === props.topologyId
                ) {
                  notifier.showWarning(
                    `редактируемая топология изменена другим пользователем`
                  )
                } else if (
                  (event.type === 'DELETE_TOPOLOGY' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resource?.id === props.topologyId) ||
                  (event.type === 'DELETE_TOPOLOGIES' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resources?.some?.(
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      (resource: any) => resource?.id === props.topologyId
                    ))
                ) {
                  notifier.showWarning(
                    `редактируемая топология удалена другим пользователем`
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
  }, [props.topologyId, notifier, selfId])

  const submitAction = React.useCallback(
    async (validatedData: UpdateTopologyFormData) => {
      if (props.topologyId === null) {
        throw new Error('отсутствует идентификатор топологии')
      } else if (topology === null) {
        throw new Error(
          `отсутствует доступ к текущим характеристикам редактируемой топологии`
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

        return await serverConnector.updateTopology({
          id: props.topologyId,
          code: prepareRequired(topology.code, validatedData.code),
          name: prepareOptional(topology.name, validatedData.name),
          numInCommonTopology: prepareOptional(
            topology.numInCommonTopology,
            validatedData.numInCommonTopology
          ),
          commonTopologyId: prepareRequired(
            topology.commonTopologyId,
            validatedData.commonTopologyId
          ),
          vertexNames: prepareArr(
            topology.vertexNames,
            validatedData.vertexNames
          ),
          description: prepareText(topology.description, descriptionText),
          remark: prepareText(topology.remark, remarkText),
          tagIds: prepareArr(topology.tagIds, [
            ...(tagIds ?? []),
            ...recentlyCreatedTagIds,
            ...newCreatedTagIds
          ])
        })
      }
    },
    [props.topologyId, notifier, topology, tagIdForCode]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: UpdateTopologyFormData,
      updateTopologyResult: DtoWithoutEnums<UpdateTopologySuccessResultDto>
    ) => {
      notifier.showSuccess(`топология «${topology?.code}» изменена`)
      props.onSuccessUpdateTopology?.(updateTopologyResult)
    },
    [props.onSuccessUpdateTopology, notifier, topology]
  )

  const initialFormData: UpdateTopologyFormData = React.useMemo(
    () => ({
      code: topology?.code ?? '',
      name: topology?.name ?? undefined,
      numInCommonTopology: topology?.numInCommonTopology ?? undefined,
      commonTopologyId: topology?.commonTopologyId,
      vertexNames: topology?.vertexNames,
      descriptionText: topology?.description?.text,
      remarkText: topology?.remark?.text,
      tagIds: topology?.tagIds
    }),
    [topology]
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
  } = useForm<
    UpdateTopologyFormData,
    DtoWithoutEnums<UpdateTopologySuccessResultDto>
  >({
    INITIAL_FORM_DATA: initialFormData,
    validator: updateTopologyFormValidator,
    clearTrigger: topology?.id,
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

  const setIsActive = React.useCallback(
    (value: boolean | ((prevState: boolean) => boolean)) => {
      if (value === false) {
        props.setTopologyId(null)
      } else {
        throw new Error()
      }
    },
    [props.setTopologyId]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title={`изменить топологию «${topology?.code}»`}
      submitButtonTitle="изменить"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'к текущим значениям'
      }}
      isActive={props.topologyId !== null}
      setIsActive={setIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="code"
          label="код"
          value={data.code}
          helperText={
            errors?.code ?? UPDATE_TOPOLOGY_FORM_PROPS_JOINED.code ?? ' '
          }
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? UPDATE_TOPOLOGY_FORM_PROPS_JOINED.name ?? ' '
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
            UPDATE_TOPOLOGY_FORM_PROPS_JOINED.commonTopologyId ??
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
            UPDATE_TOPOLOGY_FORM_PROPS_JOINED.vertexNames ??
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
            UPDATE_TOPOLOGY_FORM_PROPS_JOINED.numInCommonTopology ??
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
            UPDATE_TOPOLOGY_FORM_PROPS_JOINED.descriptionText ??
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
              addMes(UPDATE_TOPOLOGY_FORM_PROPS_JOINED.tagIds)
              addMes(UPDATE_TOPOLOGY_FORM_PROPS_JOINED.tagCodesToCreate)
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
            UPDATE_TOPOLOGY_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
