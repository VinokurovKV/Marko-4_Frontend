// Project
import { allImportExistingResourceModes } from '@common/enums'
import type { ImportSuccessResultDto } from '@common/dtos/server-api/import.dto'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import {
  type ImportDataFormData,
  INITIAL_IMPORT_DATA_FORM_DATA,
  importDataFormValidator
} from '~/data/forms/resources/import-data'
import {
  FormBlock,
  FormCheckbox,
  FormDialog,
  FormFileUpload,
  FormSelect,
  useForm
} from '../common'
// React
import * as React from 'react'

const IMPORT_DATA_FORM_PROPS_JOINED = importDataFormValidator.getPromptsJoined()

export interface ImportDataFormDialogProps {
  importModeIsActive: boolean
  setImportModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessImportData?: (result: {
    severity: 'success' | 'warning'
    summary: string
    result: ImportSuccessResultDto
  }) => void
  onCancelClick?: () => void
}

function getImportExistingResourceModeTitle(value: string): string {
  switch (value) {
    case 'IGNORE':
      return 'игнорировать'
    case 'RECREATE':
      return 'заменить'
    default:
      return value.toLowerCase()
  }
}

function getTotalResourcesCount(
  result: ImportSuccessResultDto | null | undefined
): number {
  if (result === null || result === undefined || typeof result !== 'object') {
    return 0
  }
  const allKeys = Object.keys(result) as (keyof ImportSuccessResultDto)[]
  return allKeys.reduce((sum, key) => {
    const value = result[key]
    return sum + (Array.isArray(value) ? value.length : 0)
  }, 0)
}

function getArrayLen(
  result: ImportSuccessResultDto,
  key: keyof ImportSuccessResultDto
): number {
  const value = result[key]
  return Array.isArray(value) ? value.length : 0
}

export function ImportDataFormDialog(props: ImportDataFormDialogProps) {
  const notifier = useNotifier()
  const resourceFields = React.useMemo(
    () =>
      [
        'roles',
        'users',
        'tags',
        'documents',
        'fragments',
        'requirements',
        'commonTopologies',
        'topologies',
        'dbcs',
        'testTemplates',
        'tests',
        'subgroups',
        'groups',
        'devices'
      ] as const,
    []
  )

  const submitAction = React.useCallback(
    async (validatedData: ImportDataFormData) => {
      const { config, ...main } = validatedData
      const importResult = await serverConnector.import(main, config!)
      const totalResources = getTotalResourcesCount(importResult)
      const createdTests = getArrayLen(importResult, 'createdTestCodes')
      const recreatedTests = getArrayLen(importResult, 'recreatedTestCodes')
      const ignoredTests = getArrayLen(importResult, 'ignoredTestCodes')
      const failedTests = getArrayLen(importResult, 'failedTestCodes')
      const createdRequirements = getArrayLen(
        importResult,
        'createdRequirementCodes'
      )
      const recreatedRequirements = getArrayLen(
        importResult,
        'recreatedRequirementCodes'
      )
      const ignoredRequirements = getArrayLen(
        importResult,
        'ignoredRequirementCodes'
      )
      const failedRequirements = getArrayLen(
        importResult,
        'failedRequirementCodes'
      )

      const summary =
        `импорт завершен: обработано ресурсов ${totalResources}; ` +
        `тесты (создано ${createdTests}, пересоздано ${recreatedTests}, ` +
        `игнорировано ${ignoredTests}, ошибки ${failedTests}); ` +
        `требования (создано ${createdRequirements}, пересоздано ${recreatedRequirements}, ` +
        `игнорировано ${ignoredRequirements}, ошибки ${failedRequirements})`

      const severity =
        failedTests > 0 || failedRequirements > 0 ? 'warning' : 'success'

      if (severity === 'warning') {
        notifier.showWarning(summary)
      } else {
        notifier.showSuccess(summary)
      }
      return {
        summary,
        severity,
        result: importResult
      } as const
    },
    [notifier]
  )

  const {
    formInternal,
    data,
    errors,
    handleFieldChange,
    handleCheckboxChange,
    handleFileUploadChange,
    handleStrSelectChange
  } = useForm<
    ImportDataFormData,
    {
      severity: 'success' | 'warning'
      summary: string
      result: ImportSuccessResultDto
    }
  >({
    INITIAL_FORM_DATA: INITIAL_IMPORT_DATA_FORM_DATA,
    validator: importDataFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: (_, submitActionResult) => {
      props.onSuccessImportData?.(submitActionResult)
    }
  })

  const addAllIsChecked = React.useMemo(
    () => resourceFields.every((field) => data[field] === true),
    [data, resourceFields]
  )

  const handleAddAllChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.checked) {
        resourceFields.forEach((field) => {
          handleFieldChange(field, true)
        })
      }
    },
    [handleFieldChange, resourceFields]
  )

  const handleClear = React.useCallback(() => {
    formInternal.clear()
    resourceFields.forEach((field) => {
      handleFieldChange(field, false)
    })
  }, [formInternal, handleFieldChange, resourceFields])

  return (
    <FormDialog
      formInternal={formInternal}
      title="импортировать данные"
      submitButtonTitle="импортировать"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'очистить',
        onClick: handleClear
      }}
      isActive={props.importModeIsActive}
      setIsActive={props.setImportModeIsActive}
    >
      <FormBlock title="импортируемые данные">
        <FormFileUpload
          required
          name="config"
          label="загружаемые данные"
          extensions={['zip']}
          value={data.config}
          helperText={
            errors?.config ?? IMPORT_DATA_FORM_PROPS_JOINED.config ?? ' '
          }
          error={!!errors?.config}
          onChange={handleFileUploadChange}
        />
      </FormBlock>
      <FormBlock title="параметры импорта">
        <FormSelect
          required
          name="importExistingResourceMode"
          label="существующие ресурсы"
          value={data.importExistingResourceMode}
          items={allImportExistingResourceModes.map((item) => ({
            value: item,
            title: getImportExistingResourceModeTitle(item)
          }))}
          onChange={handleStrSelectChange}
        />
        <FormCheckbox
          name="importAllByDefault"
          label="импортировать все ресурсы по умолчанию"
          checked={data.importAllByDefault}
          onChange={handleCheckboxChange}
        />
      </FormBlock>
      <FormBlock title="импортируемые ресурсы">
        <FormCheckbox
          name="addAll"
          label="добавить все"
          checked={addAllIsChecked}
          onChange={handleAddAllChange}
        />
        <FormCheckbox
          name="roles"
          label="роли"
          checked={data.roles}
          onChange={handleCheckboxChange}
        />
        <FormCheckbox
          name="users"
          label="пользователи"
          checked={data.users}
          onChange={handleCheckboxChange}
        />
        <FormCheckbox
          name="tags"
          label="теги"
          checked={data.tags}
          onChange={handleCheckboxChange}
        />
        <FormCheckbox
          name="documents"
          label="документы"
          checked={data.documents}
          onChange={handleCheckboxChange}
        />
        <FormCheckbox
          name="fragments"
          label="фрагменты"
          checked={data.fragments}
          onChange={handleCheckboxChange}
        />
        <FormCheckbox
          name="requirements"
          label="требования"
          checked={data.requirements}
          onChange={handleCheckboxChange}
        />
        <FormCheckbox
          name="commonTopologies"
          label="общие топологии"
          checked={data.commonTopologies}
          onChange={handleCheckboxChange}
        />
        <FormCheckbox
          name="topologies"
          label="топологии"
          checked={data.topologies}
          onChange={handleCheckboxChange}
        />
        <FormCheckbox
          name="dbcs"
          label="базовые конфигурации"
          checked={data.dbcs}
          onChange={handleCheckboxChange}
        />
        <FormCheckbox
          name="testTemplates"
          label="шаблоны тестов"
          checked={data.testTemplates}
          onChange={handleCheckboxChange}
        />
        <FormCheckbox
          name="tests"
          label="тесты"
          checked={data.tests}
          onChange={handleCheckboxChange}
        />
        <FormCheckbox
          name="subgroups"
          label="подгруппы"
          checked={data.subgroups}
          onChange={handleCheckboxChange}
        />
        <FormCheckbox
          name="groups"
          label="группы"
          checked={data.groups}
          onChange={handleCheckboxChange}
        />
        <FormCheckbox
          name="devices"
          label="устройства"
          checked={data.devices}
          onChange={handleCheckboxChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
