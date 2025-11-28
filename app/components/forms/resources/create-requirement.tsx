// Project
import { allRequirementModifiers, allRequirementOrigins } from '@common/enums'
import type { ReadTagsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/tags.dto'
import type { ReadDocumentsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/documents.dto'
import type { ReadFragmentsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/fragments.dto'
import type { ReadRequirementsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/requirements.dto'
import type { CreateRequirementSuccessResultDto } from '@common/dtos/server-api/requirements.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import {
  localizationForRequirementModifier,
  localizationForRequirementOrigin
} from '~/localization'
import {
  type CreateRequirementFormData,
  INITIAL_CREATE_REQUIREMENT_FORM_DATA,
  createRequirementFormValidator
} from '~/data/forms/resources/create-requirement'
import type { FormSelectProps } from '../common/form-select'
import {
  useForm,
  FormAutocompleteFreeItemsMultipleSelect,
  FormAutocompleteMultipleSelect,
  FormBlock,
  FormDialog,
  FormMultilineTextField,
  FormSelect,
  FormTextField
} from '../common'
// React
import * as React from 'react'

const EMPTY_TAG_IDS_ARR: number[] = []
const EMPTY_TAG_CODES_ARR: string[] = []
const EMPTY_FRAGMENT_IDS_ARR: number[] = []
const EMPTY_REQUIREMENT_IDS_ARR: number[] = []

type Tag = DtoWithoutEnums<ReadTagsWithPrimaryPropsSuccessResultItemDto>
type Document =
  DtoWithoutEnums<ReadDocumentsWithPrimaryPropsSuccessResultItemDto>
type Fragment =
  DtoWithoutEnums<ReadFragmentsWithPrimaryPropsSuccessResultItemDto>
type Requirement =
  DtoWithoutEnums<ReadRequirementsWithPrimaryPropsSuccessResultItemDto>

const CREATE_REQUIREMENT_FORM_PROPS_JOINED =
  createRequirementFormValidator.getPromptsJoined()

export interface CreateRequirementFormDialogProps {
  tags: Tag[] | null
  documents: Document[] | null
  fragments: Fragment[] | null
  requirements: Requirement[] | null
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessCreateRequirement?: (
    createRequirementResult: CreateRequirementSuccessResultDto
  ) => void
  onCancelClick?: () => void
}

export function CreateRequirementFormDialog(
  props: CreateRequirementFormDialogProps
) {
  const notifier = useNotifier()

  const submitAction = React.useCallback(
    async (validatedData: CreateRequirementFormData) => {
      const {
        descriptionText,
        remarkText,
        tagIds,
        tagCodesToCreate,
        ...truncatedData
      } = validatedData

      const createdTagIds = (
        await Promise.allSettled(
          (tagCodesToCreate ?? []).map((tagCodeToCreate) =>
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

      return await serverConnector.createRequirement({
        ...truncatedData,
        modifier: truncatedData.modifier!,
        origin: truncatedData.origin!,
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
          (tagIds ?? []).length + createdTagIds.length > 0
            ? [...(tagIds ?? []), ...createdTagIds]
            : undefined
      })
    },
    []
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: CreateRequirementFormData,
      createRequirementResult: CreateRequirementSuccessResultDto
    ) => {
      notifier.showSuccess(`требование '${data.code}' создано`)
      props.onSuccessCreateRequirement?.(createRequirementResult)
    },
    [props.onSuccessCreateRequirement]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleStrSelectChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange
  } = useForm<CreateRequirementFormData, CreateRequirementSuccessResultDto>({
    INITIAL_FORM_DATA: INITIAL_CREATE_REQUIREMENT_FORM_DATA,
    validator: createRequirementFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const modifierSelectItems: FormSelectProps<string>['items'] = React.useMemo(
    () =>
      allRequirementModifiers.map((modifier) => ({
        value: modifier,
        title: localizationForRequirementModifier.get(modifier) ?? modifier
      })),
    []
  )

  const originSelectItems: FormSelectProps<string>['items'] = React.useMemo(
    () =>
      allRequirementOrigins.map((origin) => ({
        value: origin,
        title: localizationForRequirementOrigin.get(origin) ?? origin
      })),
    []
  )

  const tagIds = React.useMemo(
    () => props.tags?.map((tag) => tag.id) ?? [],
    [props.tags]
  )

  const tagCodeForId = React.useMemo(
    () => new Map((props.tags ?? []).map((tag) => [tag.id, tag.code])),
    [props.tags]
  )

  const documentCodeForId = React.useMemo(
    () =>
      new Map(
        (props.documents ?? []).map((document) => [document.id, document.code])
      ),
    [props.documents]
  )

  const fragmentIds = React.useMemo(
    () => props.fragments?.map((fragment) => fragment.id) ?? [],
    [props.fragments]
  )

  const fragmentTitleForId = React.useMemo(
    () =>
      new Map(
        (props.fragments ?? []).map((fragment) => [
          fragment.id,
          `${documentCodeForId.get(fragment.documentId) ?? '?'} - ${fragment.innerCode}`
        ])
      ),
    [documentCodeForId, props.fragments]
  )

  const requirementIds = React.useMemo(
    () => props.requirements?.map((requirement) => requirement.id) ?? [],
    [props.requirements]
  )

  const requirementCodeForId = React.useMemo(
    () =>
      new Map(
        (props.requirements ?? []).map((requirement) => [
          requirement.id,
          requirement.code
        ])
      ),
    [props.requirements]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title="создать требование"
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
            errors?.code ?? CREATE_REQUIREMENT_FORM_PROPS_JOINED.code ?? ' '
          }
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? CREATE_REQUIREMENT_FORM_PROPS_JOINED.name ?? ' '
          }
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormSelect
          required
          name="modifier"
          label="модификатор"
          items={modifierSelectItems}
          value={data.modifier ?? ''}
          helperText={
            errors?.modifier ??
            CREATE_REQUIREMENT_FORM_PROPS_JOINED.modifier ??
            ' '
          }
          error={!!errors?.modifier}
          onChange={handleStrSelectChange}
        />
        <FormSelect
          required
          name="origin"
          label="происхождение"
          items={originSelectItems}
          value={data.origin ?? ''}
          helperText={
            errors?.origin ?? CREATE_REQUIREMENT_FORM_PROPS_JOINED.origin ?? ' '
          }
          error={!!errors?.origin}
          onChange={handleStrSelectChange}
        />
        <FormAutocompleteMultipleSelect
          name="fragmentIds"
          label="фрагменты документов"
          possibleValues={fragmentIds}
          titleForValue={fragmentTitleForId}
          values={data.fragmentIds ?? EMPTY_FRAGMENT_IDS_ARR}
          helperText={
            errors?.fragmentIds ??
            CREATE_REQUIREMENT_FORM_PROPS_JOINED.fragmentIds ??
            ' '
          }
          error={!!errors?.fragmentIds}
          onChange={handleAutocompleteMultipleSelectChange}
        />
      </FormBlock>
      <FormBlock title="связи с другими требованиями">
        <FormAutocompleteMultipleSelect
          name="parentRequirementIds"
          label="родительские требования"
          possibleValues={requirementIds}
          titleForValue={requirementCodeForId}
          values={data.parentRequirementIds ?? EMPTY_REQUIREMENT_IDS_ARR}
          helperText={
            errors?.parentRequirementIds ??
            CREATE_REQUIREMENT_FORM_PROPS_JOINED.parentRequirementIds ??
            ' '
          }
          error={!!errors?.parentRequirementIds}
          onChange={handleAutocompleteMultipleSelectChange}
        />
        <FormAutocompleteMultipleSelect
          name="childRequirementIds"
          label="дочерние требования"
          possibleValues={requirementIds}
          titleForValue={requirementCodeForId}
          values={data.childRequirementIds ?? EMPTY_REQUIREMENT_IDS_ARR}
          helperText={
            errors?.childRequirementIds ??
            CREATE_REQUIREMENT_FORM_PROPS_JOINED.childRequirementIds ??
            ' '
          }
          error={!!errors?.childRequirementIds}
          onChange={handleAutocompleteMultipleSelectChange}
        />
      </FormBlock>
      <FormBlock title="дополнительная информация">
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            CREATE_REQUIREMENT_FORM_PROPS_JOINED.descriptionText ??
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
              addMes(CREATE_REQUIREMENT_FORM_PROPS_JOINED.tagIds)
              addMes(CREATE_REQUIREMENT_FORM_PROPS_JOINED.tagCodesToCreate)
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
            CREATE_REQUIREMENT_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
