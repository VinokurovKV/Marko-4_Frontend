// Project
import { allRequirementModifiers, allRequirementOrigins } from '@common/enums'
import type { UpdateRequirementSuccessResultDto } from '@common/dtos/server-api/requirements.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import type {
  RequirementPrimary,
  TestPrimary,
  RequirementTertiary
} from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useRequirementSubscription } from '~/hooks/resources'
import { useTags, useDocuments, useFragments } from '~/hooks/resources'
import {
  localizationForRequirementModifier,
  localizationForRequirementOrigin
} from '~/localization'
import {
  type UpdateRequirementFormData,
  updateRequirementFormValidator
} from '~/data/forms/resources/update-requirement'
import type { FormSelectProps } from '../common/form-select'
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
  FormSelect,
  FormTextField
} from '../common'
// React
import * as React from 'react'

const EMPTY_TAG_IDS_ARR: number[] = []
const EMPTY_TAG_CODES_ARR: string[] = []
const EMPTY_FRAGMENT_IDS_ARR: number[] = []
const EMPTY_REQUIREMENT_IDS_ARR: number[] = []

const UPDATE_REQUIREMENT_FORM_PROPS_JOINED =
  updateRequirementFormValidator.getPromptsJoined()

export interface UpdateRequirementFormDialogProps {
  requirements: RequirementPrimary[] | null
  tests: TestPrimary[] | null
  requirementId: number | null
  setRequirementId: React.Dispatch<React.SetStateAction<number | null>>
  initialRequirement: RequirementTertiary | null
  onSuccessUpdateRequirement?: (
    updateRequirementResult: DtoWithoutEnums<UpdateRequirementSuccessResultDto>
  ) => void
  onCancelClick?: () => void
}

export function UpdateRequirementFormDialog(
  props: UpdateRequirementFormDialogProps
) {
  const notifier = useNotifier()
  const meta = useMeta()
  const selfId = React.useMemo(
    () => (meta.status !== 'AUTHENTICATED' ? null : meta.selfMeta.id),
    [meta]
  )

  const [requirement, setRequirement] =
    React.useState<RequirementTertiary | null>(props.initialRequirement)
  useRequirementSubscription(
    'UP_TO_TERTIARY_PROPS',
    props.requirementId,
    setRequirement
  )

  const tags = useTags('PRIMARY_PROPS', false, props.requirementId !== null)
  const documents = useDocuments(
    'PRIMARY_PROPS',
    false,
    props.requirementId !== null
  )
  const fragments = useFragments(
    'PRIMARY_PROPS',
    false,
    props.requirementId !== null
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

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToEvents(
      {
        filter: {
          types: [
            'UPDATE_REQUIREMENT',
            'DELETE_REQUIREMENT',
            'DELETE_REQUIREMENT'
          ]
        }
      },
      (data) => {
        ;(() => {
          if (props.requirementId !== null) {
            for (const event of data) {
              if (selfId !== null && event.initiatorId !== selfId) {
                if (
                  event.type === 'UPDATE_REQUIREMENT' &&
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  (event as any).config?.resource?.id === props.requirementId
                ) {
                  notifier.showWarning(
                    `редактируемое требование изменено другим пользователем`
                  )
                } else if (
                  (event.type === 'DELETE_REQUIREMENT' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resource?.id ===
                      props.requirementId) ||
                  (event.type === 'DELETE_REQUIREMENT' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resources?.some?.(
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      (resource: any) => resource?.id === props.requirementId
                    ))
                ) {
                  notifier.showWarning(
                    `редактируемое требование удалено другим пользователем`
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
  }, [props.requirementId, notifier, selfId])

  const submitAction = React.useCallback(
    async (validatedData: UpdateRequirementFormData) => {
      if (props.requirementId === null) {
        throw new Error('отсутствует идентификатор требования')
      } else if (requirement === null) {
        throw new Error(
          `отсутствует доступ к текущим характеристикам редактируемого требования`
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

        return await serverConnector.updateRequirement({
          id: props.requirementId,
          code: prepareRequired(requirement.code, validatedData.code),
          name: prepareOptional(requirement.name, validatedData.name),
          modifier: prepareRequired(
            requirement.modifier,
            validatedData.modifier
          ),
          origin: prepareRequired(requirement.origin, validatedData.origin),
          rate: prepareRequired(requirement.rate, validatedData.rate),
          testId: prepareRequired(requirement.testId, validatedData.testId),
          description: prepareText(requirement.description, descriptionText),
          remark: prepareText(requirement.remark, remarkText),
          tagIds: prepareArr(requirement.tagIds, [
            ...(tagIds ?? []),
            ...recentlyCreatedTagIds,
            ...newCreatedTagIds
          ]),
          fragmentIds: prepareArr(
            requirement.fragmentIds,
            validatedData.fragmentIds
          ),
          childRequirementIds: prepareArr(
            requirement.childRequirementIds,
            validatedData.childRequirementIds
          ),
          parentRequirementIds: prepareArr(
            requirement.parentRequirementIds,
            validatedData.parentRequirementIds
          )
        })
      }
    },
    [props.requirementId, notifier, requirement, tagIdForCode]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: UpdateRequirementFormData,
      updateRequirementResult: DtoWithoutEnums<UpdateRequirementSuccessResultDto>
    ) => {
      notifier.showSuccess(`требование «${requirement?.code}» изменено`)
      props.onSuccessUpdateRequirement?.(updateRequirementResult)
    },
    [props.onSuccessUpdateRequirement, notifier]
  )

  const initialFormData: UpdateRequirementFormData = React.useMemo(
    () => ({
      code: requirement?.code ?? '',
      name: requirement?.name ?? undefined,
      modifier: requirement?.modifier,
      origin: requirement?.origin,
      rate: requirement?.rate ?? 1,
      testId: requirement?.testId ?? undefined,
      descriptionText: requirement?.description?.text,
      remarkText: requirement?.remark?.text,
      tagIds: requirement?.tagIds,
      fragmentIds: requirement?.fragmentIds,
      childRequirementIds: requirement?.childRequirementIds,
      parentRequirementIds: requirement?.parentRequirementIds
    }),
    [requirement]
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
    UpdateRequirementFormData,
    DtoWithoutEnums<UpdateRequirementSuccessResultDto>
  >({
    INITIAL_FORM_DATA: initialFormData,
    validator: updateRequirementFormValidator,
    clearTrigger: requirement?.id,
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

  const setIsActive = React.useCallback(
    (value: boolean | ((prevState: boolean) => boolean)) => {
      if (value === false) {
        props.setRequirementId(null)
      } else {
        throw new Error()
      }
    },
    [props.setRequirementId]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title={`изменить требование «${requirement?.code}»`}
      submitButtonTitle="изменить"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'к текущим значениям'
      }}
      isActive={props.requirementId !== null}
      setIsActive={setIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="code"
          label="код"
          value={data.code}
          helperText={
            errors?.code ?? UPDATE_REQUIREMENT_FORM_PROPS_JOINED.code ?? ' '
          }
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? UPDATE_REQUIREMENT_FORM_PROPS_JOINED.name ?? ' '
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
            UPDATE_REQUIREMENT_FORM_PROPS_JOINED.modifier ??
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
            errors?.origin ?? UPDATE_REQUIREMENT_FORM_PROPS_JOINED.origin ?? ' '
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
            errors?.rate ?? UPDATE_REQUIREMENT_FORM_PROPS_JOINED.rate ?? ' '
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
            UPDATE_REQUIREMENT_FORM_PROPS_JOINED.fragmentIds ??
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
            UPDATE_REQUIREMENT_FORM_PROPS_JOINED.parentRequirementIds ??
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
            UPDATE_REQUIREMENT_FORM_PROPS_JOINED.childRequirementIds ??
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
            errors?.testId ?? UPDATE_REQUIREMENT_FORM_PROPS_JOINED.testId ?? ' '
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
            UPDATE_REQUIREMENT_FORM_PROPS_JOINED.descriptionText ??
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
              addMes(UPDATE_REQUIREMENT_FORM_PROPS_JOINED.tagIds)
              addMes(UPDATE_REQUIREMENT_FORM_PROPS_JOINED.tagCodesToCreate)
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
            UPDATE_REQUIREMENT_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
