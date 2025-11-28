// Project
import type { ReadTagsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/tags.dto'
import type { ReadDocumentsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/documents.dto'
import type { ReadFragmentsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/fragments.dto'
import type { ReadRequirementsWithUpToSecondaryPropsSuccessResultItemDto } from '@common/dtos/server-api/requirements.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import {
  useDocumentsSubscription,
  useFragmentsSubscription,
  useRequirementsSubscription,
  useTagsSubscription
} from '~/hooks/subscriptions'
import { CreateRequirementFormDialog } from '~/components/forms/resources/create-requirement'
import { type GridProps, Grid } from '../grid'
import {
  type ActionsColProps,
  useActionsCol,
  useChildRequirementsCountCol,
  useCodeCol,
  useCoveragesCountCol,
  useFragmentsCountCol,
  useNameCol,
  useParentRequirementsCountCol,
  useRequirementModifierCol,
  useRequirementOriginCol
} from '../cols'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

const MAX_REQUIREMENTS_IN_MESSAGES = 3

type Tag = DtoWithoutEnums<ReadTagsWithPrimaryPropsSuccessResultItemDto>
type Document =
  DtoWithoutEnums<ReadDocumentsWithPrimaryPropsSuccessResultItemDto>
type Fragment =
  DtoWithoutEnums<ReadFragmentsWithPrimaryPropsSuccessResultItemDto>
type Requirement =
  DtoWithoutEnums<ReadRequirementsWithUpToSecondaryPropsSuccessResultItemDto>

export interface RequirementsGridProps {
  initialTags: Tag[] | null
  initialDocuments: Document[] | null
  initialFragments: Fragment[] | null
  initialRequirements: Requirement[]
}

export function RequirementsGrid(props: RequirementsGridProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const rightsSet =
    meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet

  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)

  const [tags, setTags] = React.useState<Tag[] | null>(props.initialTags)
  const [documents, setDocuments] = React.useState<Document[] | null>(
    props.initialDocuments
  )
  const [fragments, setFragments] = React.useState<Fragment[] | null>(
    props.initialFragments
  )
  const [requirements, setRequirements] = React.useState<Requirement[]>(
    props.initialRequirements
  )

  useTagsSubscription('PRIMARY_PROPS', setTags)
  useDocumentsSubscription('PRIMARY_PROPS', setDocuments)
  useFragmentsSubscription('PRIMARY_PROPS', setFragments)
  useRequirementsSubscription('UP_TO_SECONDARY_PROPS', setRequirements)

  const requirementCodeForId = React.useMemo(
    () =>
      new Map(
        requirements.map((requirement) => [requirement.id, requirement.code])
      ),
    [requirements]
  )

  const rows: GridValidRowModel[] = requirements

  const readCols = [
    useCodeCol('id', true, '/requirements'),
    useNameCol(),
    useRequirementModifierCol(),
    useRequirementOriginCol(),
    useFragmentsCountCol(),
    useParentRequirementsCountCol(),
    useChildRequirementsCountCol(),
    useCoveragesCountCol()
  ]

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      delete: rightsSet.has('DELETE_REQUIREMENT')
        ? {
            prepareConfirmMessage: (rowId) =>
              `удалить требование '${requirementCodeForId.get(rowId) ?? ''}'?`,
            action: async (rowId) => {
              try {
                await serverConnector.deleteRequirement({
                  id: rowId
                })
                notifier.showSuccess(
                  `требование '${requirementCodeForId.get(rowId) ?? ''}' удалено`
                )
              } catch (error) {
                notifier.showError(error)
              }
            }
          }
        : undefined
    }),
    [rightsSet, requirementCodeForId]
  )

  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => [
      ...readCols,
      ...(rightsSet.has('UPDATE_REQUIREMENT') ||
      rightsSet.has('DELETE_REQUIREMENT')
        ? [actionsCol]
        : [])
    ],
    [rightsSet, readCols, actionsCol]
  )

  const defaultHiddenFields = React.useMemo(
    () => ['fragmentsCount', 'coveragesCount'] as (keyof Requirement)[],
    []
  )

  const createProps: GridProps['create'] = React.useMemo(
    () =>
      rightsSet.has('CREATE_REQUIREMENT')
        ? {
            createModeIsActive: createModeIsActive,
            setCreateModeIsActive: setCreateModeIsActive
          }
        : undefined,
    [rightsSet, createModeIsActive, setCreateModeIsActive]
  )

  const getDisplayedRequirementCodes = React.useCallback(
    (ids: number[]) => {
      return ids
        .slice(0, MAX_REQUIREMENTS_IN_MESSAGES)
        .map((id) => requirementCodeForId.get(id) ?? '')
    },
    [requirementCodeForId]
  )

  const deleteManyProps: GridProps['deleteMany'] = React.useMemo(
    () =>
      rightsSet.has('DELETE_REQUIREMENT')
        ? {
            prepareConfirmMessage: (rowIds) => {
              const displayedRequirementCodes =
                getDisplayedRequirementCodes(rowIds)
              const count = rowIds.length
              const hiddenCount = count - displayedRequirementCodes.length
              return `удалить требовани${count === 1 ? 'е' : 'я'}${displayedRequirementCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''}?`
            },
            action: async (rowIds) => {
              const displayedRequirementCodes =
                getDisplayedRequirementCodes(rowIds)
              try {
                await serverConnector.deleteRequirements({
                  ids: rowIds
                })
                const count = rowIds.length
                const hiddenCount = count - displayedRequirementCodes.length
                notifier.showSuccess(
                  `требовани${count === 1 ? 'е' : 'я'}${displayedRequirementCodes.map((code) => ` '${code}'`).join()}${hiddenCount > 0 ? ` и еще ${hiddenCount}` : ''} удален${count === 1 ? 'о' : 'ы'}`
                )
              } catch (error) {
                notifier.showError(error)
                throw error
              }
            }
          }
        : undefined,
    [rightsSet, getDisplayedRequirementCodes]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [setCreateModeIsActive])

  return (
    <>
      <Grid
        localSaveKey="REQUIREMENTS"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        create={createProps}
        deleteMany={deleteManyProps}
      />
      <CreateRequirementFormDialog
        tags={tags}
        documents={documents}
        fragments={fragments}
        requirements={requirements}
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateRequirement={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
