// Project
import { allRequirementModifiers, allRequirementOrigins } from '@common/enums'
import type { CreateRequirementSuccessResultDto } from '@common/dtos/server-api/requirements.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import type { RequirementPrimary, TestPrimary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useTags, useDocuments, useFragments } from '~/hooks/resources'
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
  createTagsAndGetIds,
  FormAutocompleteFreeItemsMultipleSelect,
  FormAutocompleteMultipleSelect,
  FormAutocompleteSingleSelect,
  FormBlock,
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
const EMPTY_FRAGMENT_IDS_ARR: number[] = []
const EMPTY_REQUIREMENT_IDS_ARR: number[] = []

const CREATE_REQUIREMENT_FORM_PROPS_JOINED =
  createRequirementFormValidator.getPromptsJoined()

export interface CreateRequirementFormDialogProps {
  requirements: RequirementPrimary[] | null
  tests: TestPrimary[] | null
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessCreateRequirement?: (
    createRequirementResult: DtoWithoutEnums<CreateRequirementSuccessResultDto>
  ) => void
  onCancelClick?: () => void
}

export function CreateRequirementFormDialog(
  props: CreateRequirementFormDialogProps
) {
  const notifier = useNotifier()

  const tags = useTags('PRIMARY_PROPS', false, props.createModeIsActive)
  const documents = useDocuments(
    'PRIMARY_PROPS',
    false,
    props.createModeIsActive
  )
  const fragments = useFragments(
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

  const submitAction = React.useCallback(
    async (validatedData: CreateRequirementFormData) => {
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

      const newCreatedTagIds = await createTagsAndGetIds(
        tagIdForCode,
        tagCodesToCreate,
        notifier
      )

      return await serverConnector.createRequirement({
        ...truncatedData,
        modifier: truncatedData.modifier!,
        origin: truncatedData.origin!,
        testId: truncatedData.testId,
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
      data: CreateRequirementFormData,
      createRequirementResult: DtoWithoutEnums<CreateRequirementSuccessResultDto>
    ) => {
      notifier.showSuccess(`требование «${data.code}» создано`)
      props.onSuccessCreateRequirement?.(createRequirementResult)
    },
    [props.onSuccessCreateRequirement, notifier]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleStrSelectChange,
    handleAutocompleteSingleSelectChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange
  } = useForm<
    CreateRequirementFormData,
    DtoWithoutEnums<CreateRequirementSuccessResultDto>
  >({
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

  const documentCodeForId = React.useMemo(
    () =>
      new Map(
        (documents ?? []).map((document) => [document.id, document.code])
      ),
    [documents]
  )

  const fragmentIds = React.useMemo(
    () => fragments?.map((fragment) => fragment.id) ?? [],
    [fragments]
  )

  const fragmentTitleForId = React.useMemo(
    () =>
      new Map(
        (fragments ?? []).map((fragment) => [
          fragment.id,
          `${documentCodeForId.get(fragment.documentId) ?? '?'} - ${fragment.innerCode}`
        ])
      ),
    [documentCodeForId, fragments]
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

  const testIds = React.useMemo(
    () => props.tests?.map((test) => test.id) ?? [],
    [props.tests]
  )

  const testCodeForId = React.useMemo(
    () => new Map((props.tests ?? []).map((test) => [test.id, test.code])),
    [props.tests]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title="создать требование"
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
        <FormNumField
          required
          name="rate"
          label="атомарный коэффициент (для атомарных требований)"
          value={data.rate}
          helperText={
            errors?.rate ?? CREATE_REQUIREMENT_FORM_PROPS_JOINED.rate ?? ' '
          }
          error={!!errors?.rate}
          onChange={handleTextFieldChange}
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
      <FormBlock title="покрытие (для атомарных требований)">
        <FormAutocompleteSingleSelect
          name="testId"
          label="тест"
          possibleValues={testIds}
          titleForValue={testCodeForId}
          value={data.testId ?? null}
          helperText={
            errors?.testId ?? CREATE_REQUIREMENT_FORM_PROPS_JOINED.testId ?? ' '
          }
          error={!!errors?.testId}
          onChange={handleAutocompleteSingleSelectChange}
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
