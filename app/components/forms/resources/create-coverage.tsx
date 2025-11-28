// Project
import { allCoverageTypes } from '@common/enums'
import type { ReadTagsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/tags.dto'
import type { ReadRequirementsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/requirements.dto'
import type { CreateCoverageSuccessResultDto } from '@common/dtos/server-api/coverages.dto'
import type { ReadTestsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/tests.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { localizationForCoverageType } from '~/localization'
import {
  type CreateCoverageFormData,
  INITIAL_CREATE_COVERAGE_FORM_DATA,
  createCoverageFormValidator
} from '~/data/forms/resources/create-coverage'
import type { FormSelectProps } from '../common/form-select'
import {
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
const EMPTY_TEST_IDS_ARR: number[] = []

type Tag = DtoWithoutEnums<ReadTagsWithPrimaryPropsSuccessResultItemDto>
type Requirement =
  DtoWithoutEnums<ReadRequirementsWithPrimaryPropsSuccessResultItemDto>
type Test = DtoWithoutEnums<ReadTestsWithPrimaryPropsSuccessResultItemDto>

const CREATE_COVERAGE_FORM_PROPS_JOINED =
  createCoverageFormValidator.getPromptsJoined()

export interface CreateCoverageFormDialogProps {
  tags: Tag[] | null
  requirements: Requirement[] | null
  tests: Test[] | null
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessCreateCoverage?: (
    createCoverageResult: CreateCoverageSuccessResultDto
  ) => void
  onCancelClick?: () => void
}

export function CreateCoverageFormDialog(props: CreateCoverageFormDialogProps) {
  const notifier = useNotifier()

  const submitAction = React.useCallback(
    async (validatedData: CreateCoverageFormData) => {
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

      return await serverConnector.createCoverage({
        ...truncatedData,
        requirementId: truncatedData.requirementId!,
        type: truncatedData.type!,
        coveragePercent: truncatedData.coveragePercent!,
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

  const onSuccessSubmit = React.useCallback(
    (
      data: CreateCoverageFormData,
      createCoverageResult: CreateCoverageSuccessResultDto
    ) => {
      notifier.showSuccess(
        `покрытие '${data.code}' требования '${requirementCodeForId.get(data.requirementId!) ?? ''}' создано`
      )
      props.onSuccessCreateCoverage?.(createCoverageResult)
    },
    [props.onSuccessCreateCoverage, requirementCodeForId]
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
  } = useForm<CreateCoverageFormData, CreateCoverageSuccessResultDto>({
    INITIAL_FORM_DATA: INITIAL_CREATE_COVERAGE_FORM_DATA,
    validator: createCoverageFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const typeSelectItems: FormSelectProps<string>['items'] = React.useMemo(
    () =>
      allCoverageTypes.map((type) => ({
        value: type,
        title: localizationForCoverageType.get(type) ?? type
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

  const requirementIds = React.useMemo(
    () => props.requirements?.map((requirement) => requirement.id) ?? [],
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
      title="создать покрытие требования"
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
            errors?.code ?? CREATE_COVERAGE_FORM_PROPS_JOINED.code ?? ' '
          }
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? CREATE_COVERAGE_FORM_PROPS_JOINED.name ?? ' '
          }
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormAutocompleteSingleSelect
          required
          name="requirementId"
          label="требование"
          possibleValues={requirementIds}
          titleForValue={requirementCodeForId}
          value={data.requirementId ?? null}
          helperText={
            errors?.requirementId ??
            CREATE_COVERAGE_FORM_PROPS_JOINED.requirementId ??
            ' '
          }
          error={!!errors?.requirementId}
          onChange={handleAutocompleteSingleSelectChange}
        />
        <FormSelect
          required
          name="type"
          label="тип"
          items={typeSelectItems}
          value={data.type ?? ''}
          helperText={
            errors?.type ?? CREATE_COVERAGE_FORM_PROPS_JOINED.type ?? ' '
          }
          error={!!errors?.type}
          onChange={handleStrSelectChange}
        />
        <FormAutocompleteMultipleSelect
          name="testIds"
          label="тесты"
          possibleValues={testIds}
          titleForValue={testCodeForId}
          values={data.testIds ?? EMPTY_TEST_IDS_ARR}
          helperText={
            errors?.testIds ?? CREATE_COVERAGE_FORM_PROPS_JOINED.testIds ?? ' '
          }
          error={!!errors?.testIds}
          onChange={handleAutocompleteMultipleSelectChange}
        />
        <FormNumField
          required
          name="coveragePercent"
          label="процент покрытия"
          value={data.coveragePercent ?? ''}
          helperText={
            errors?.coveragePercent ??
            CREATE_COVERAGE_FORM_PROPS_JOINED.coveragePercent ??
            ' '
          }
          error={!!errors?.coveragePercent}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
      <FormBlock title="дополнительная информация">
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            CREATE_COVERAGE_FORM_PROPS_JOINED.descriptionText ??
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
              addMes(CREATE_COVERAGE_FORM_PROPS_JOINED.tagIds)
              addMes(CREATE_COVERAGE_FORM_PROPS_JOINED.tagCodesToCreate)
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
            CREATE_COVERAGE_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
