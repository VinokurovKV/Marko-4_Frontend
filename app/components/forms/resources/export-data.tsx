// Project
import type { ExportDataFormData } from '~/data/forms/resources/export-data'
import { INITIAL_EXPORT_DATA_FORM_DATA } from '~/data/forms/resources/export-data'
import { serverConnector } from '~/server-connector'
import { downloadFileFromBlob } from '~/utilities'
import { FormBlock, FormCheckbox, FormDialog, useForm } from '../common'
import { FormValidator } from '~/validation/form-validator'
// React
import * as React from 'react'
// Other
import JSZip from 'jszip'

export interface ExportDataFormDialogProps {
  exportModeIsActive: boolean
  setExportModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessExportData?: (result: {
    severity: 'success' | 'warning'
    summary: string
    resourceCounts: Record<string, number>
  }) => void
  onCancelClick?: () => void
}

async function readCountsFromZip(blob: Blob) {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer())
  const resources = [
    ['roles', 'роли'],
    ['users', 'пользователи'],
    ['tags', 'теги'],
    ['documents', 'документы'],
    ['fragments', 'фрагменты'],
    ['requirements', 'требования'],
    ['common-topologies', 'общие топологии'],
    ['topologies', 'топологии'],
    ['dbcs', 'базовые конфигурации'],
    ['test-templates', 'шаблоны тестов'],
    ['tests', 'тесты'],
    ['subgroups', 'подгруппы'],
    ['groups', 'группы'],
    ['devices', 'устройства']
  ] as const
  const allFiles = Object.keys(zip.files)
  const rootPrefix =
    allFiles
      .find((name) => name.endsWith('/resources/'))
      ?.replace('resources/', '') ?? ''
  const counts: Record<string, number> = {}
  for (const [resourceDir, title] of resources) {
    const path = `${rootPrefix}resources/${resourceDir}/main.json`
    const file = zip.file(path)
    if (file === null) {
      counts[title] = 0
      continue
    }
    try {
      const parsed: unknown = JSON.parse(await file.async('string'))
      counts[title] = Array.isArray(parsed) ? parsed.length : 0
    } catch {
      counts[title] = 0
    }
  }
  return counts
}

export function ExportDataFormDialog(props: ExportDataFormDialogProps) {
  const exportDataFormValidator = React.useMemo(
    () => new FormValidator<ExportDataFormData>({}),
    []
  )
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
    async (validatedData: ExportDataFormData) => {
      const blob = await serverConnector.export(validatedData)
      downloadFileFromBlob(
        blob,
        `export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.zip`
      )
      const resourceCounts = await readCountsFromZip(blob)
      const allResources = Object.values(resourceCounts).reduce(
        (sum, value) => sum + value,
        0
      )
      const summary = `экспорт завершен: обработано ресурсов ${allResources}`
      return {
        severity: 'success' as const,
        summary,
        resourceCounts
      }
    },
    []
  )

  const { formInternal, data, handleFieldChange, handleCheckboxChange } =
    useForm<
      ExportDataFormData,
      {
        severity: 'success' | 'warning'
        summary: string
        resourceCounts: Record<string, number>
      }
    >({
      INITIAL_FORM_DATA: INITIAL_EXPORT_DATA_FORM_DATA,
      validator: exportDataFormValidator,
      submitAction,
      onSuccessSubmit: (_, submitActionResult) => {
        props.onSuccessExportData?.(submitActionResult)
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
      title="экспортировать данные"
      submitButtonTitle="экспортировать"
      cancelButton={{ title: 'отменить', onClick: props.onCancelClick }}
      clearButton={{ title: 'очистить', onClick: handleClear }}
      isActive={props.exportModeIsActive}
      setIsActive={props.setExportModeIsActive}
    >
      <FormBlock title="параметры экспорта">
        <FormCheckbox
          name="exportAllByDefault"
          label="экспортировать все ресурсы по умолчанию"
          checked={data.exportAllByDefault}
          onChange={handleCheckboxChange}
        />
        <FormCheckbox
          name="includeLinksToNotExportedResources"
          label="добавлять связи с неэкспортируемыми ресурсами"
          checked={data.includeLinksToNotExportedResources}
          onChange={handleCheckboxChange}
        />
        <FormCheckbox
          name="includeUserCredentials"
          label="включать учетные данные пользователей"
          checked={data.includeUserCredentials ?? false}
          onChange={handleCheckboxChange}
        />
      </FormBlock>
      <FormBlock title="экспортируемые ресурсы">
        <FormCheckbox
          name="addAll"
          label="добавить все"
          checked={addAllIsChecked}
          onChange={handleAddAllChange}
        />
        {resourceFields.map((field) => (
          <FormCheckbox
            key={field}
            name={field}
            label={
              {
                roles: 'роли',
                users: 'пользователи',
                tags: 'теги',
                documents: 'документы',
                fragments: 'фрагменты',
                requirements: 'требования',
                commonTopologies: 'общие топологии',
                topologies: 'топологии',
                dbcs: 'базовые конфигурации',
                testTemplates: 'шаблоны тестов',
                tests: 'тесты',
                subgroups: 'подгруппы',
                groups: 'группы',
                devices: 'устройства'
              }[field]
            }
            checked={data[field]}
            onChange={handleCheckboxChange}
          />
        ))}
      </FormBlock>
    </FormDialog>
  )
}
