// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  HorizontalTwoPartsContainer,
  LayoutScreenContainer
} from '../containers'
import { ProjButton } from '../buttons/button'
import { ImportDataFormDialog } from '../forms/resources/import-data'
import { ExportDataFormDialog } from '../forms/resources/export-data'
import type { ImportSuccessResultDto } from '@common/dtos/server-api/import.dto'
// React
import * as React from 'react'
// Material UI
import ImportExportIcon from '@mui/icons-material/ImportExport'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

const RESOURCE_ITEMS = [
  { title: 'Роли', base: 'RoleNames' },
  { title: 'Пользователи', base: 'UserLogins' },
  { title: 'Теги', base: 'TagCodes' },
  { title: 'Документы', base: 'DocumentCodes' },
  { title: 'Фрагменты', base: 'FragmentCodePairs' },
  { title: 'Требования', base: 'RequirementCodes' },
  { title: 'Общие топологии', base: 'CommonTopologyCodes' },
  { title: 'Топологии', base: 'TopologyCodes' },
  { title: 'Базовые конфигурации', base: 'DbcCodes' },
  { title: 'Шаблоны тестов', base: 'TestTemplateCodes' },
  { title: 'Тесты', base: 'TestCodes' },
  { title: 'Подгруппы', base: 'SubgroupCodes' },
  { title: 'Группы', base: 'GroupCodes' },
  { title: 'Устройства', base: 'DeviceCodes' }
] as const

function getArrayLength(
  result: ImportSuccessResultDto,
  key: keyof ImportSuccessResultDto
): number {
  const value = result[key]
  return Array.isArray(value) ? value.length : 0
}

export function DataTransferScreen() {
  const [importModeIsActive, setImportModeIsActive] = React.useState(false)
  const [exportModeIsActive, setExportModeIsActive] = React.useState(false)
  const [technicalReport, setTechnicalReport] = React.useState<{
    type: 'IMPORT' | 'EXPORT'
    severity: 'success' | 'warning'
    summary: string
    importResult?: ImportSuccessResultDto
    exportResourceCounts?: Record<string, number>
  } | null>(null)

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'данные системы',
        href: '/data-transfer',
        Icon: ImportExportIcon
      }
    ],
    []
  )

  const summaryRows = React.useMemo(() => {
    if (
      technicalReport === null ||
      technicalReport.type !== 'IMPORT' ||
      technicalReport.importResult === undefined
    ) {
      return null
    }
    const importResult = technicalReport.importResult
    const rows = RESOURCE_ITEMS.map((item) => {
      const created = getArrayLength(
        importResult,
        `created${item.base}` as keyof ImportSuccessResultDto
      )
      const replaced = getArrayLength(
        importResult,
        `recreated${item.base}` as keyof ImportSuccessResultDto
      )
      const ignored = getArrayLength(
        importResult,
        `ignored${item.base}` as keyof ImportSuccessResultDto
      )
      const failed = getArrayLength(
        importResult,
        `failed${item.base}` as keyof ImportSuccessResultDto
      )
      return {
        title: item.title,
        created,
        replaced,
        ignored,
        failed,
        total: created + replaced + ignored + failed
      }
    }).filter((row) => row.total > 0)
    const allResources = rows.reduce((sum, row) => sum + row.total, 0)
    const allCreated = rows.reduce((sum, row) => sum + row.created, 0)
    const allReplaced = rows.reduce((sum, row) => sum + row.replaced, 0)
    const allIgnored = rows.reduce((sum, row) => sum + row.ignored, 0)
    const allFailed = rows.reduce((sum, row) => sum + row.failed, 0)
    return {
      rows,
      allResources,
      allCreated,
      allReplaced,
      allIgnored,
      allFailed
    }
  }, [technicalReport])

  const exportSummaryRows = React.useMemo(() => {
    if (
      technicalReport === null ||
      technicalReport.type !== 'EXPORT' ||
      technicalReport.exportResourceCounts === undefined
    ) {
      return null
    }
    const rows = Object.entries(technicalReport.exportResourceCounts)
      .map(([title, count]) => ({ title, count }))
      .filter((row) => row.count > 0)
    const allResources = rows.reduce((sum, row) => sum + row.count, 0)
    return { rows, allResources }
  }, [technicalReport])

  return (
    <>
      <LayoutScreenContainer
        title="загрузка и выгрузка данных системы"
        breadcrumbsItems={breadcrumbsItems}
      >
        <HorizontalTwoPartsContainer proportions="ONE_TWO">
          <Paper
            variant="outlined"
            sx={{ p: 2.5, width: '100%', maxWidth: '420px', height: '100%' }}
          >
            <Stack spacing={1.8}>
              <ProjButton
                variant="contained"
                sx={{ height: 42, fontSize: '0.98rem' }}
                onClick={() => {
                  setImportModeIsActive(true)
                }}
              >
                импорт
              </ProjButton>
              <ProjButton
                variant="contained"
                sx={{ height: 42, fontSize: '0.98rem' }}
                onClick={() => {
                  setExportModeIsActive(true)
                }}
              >
                экспорт
              </ProjButton>
            </Stack>
          </Paper>
          <Paper
            variant="outlined"
            sx={{ p: 2.5, width: '100%', height: '100%', overflowY: 'auto' }}
          >
            {technicalReport !== null ? (
              <Stack spacing={1.2} sx={{ position: 'relative' }}>
                <IconButton
                  size="small"
                  sx={{ position: 'absolute', top: 0, right: 0 }}
                  onClick={() => {
                    setTechnicalReport(null)
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, textAlign: 'center' }}
                >
                  {technicalReport.type === 'IMPORT'
                    ? 'Импорт завершён'
                    : 'Экспорт завершён'}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  Статус:{' '}
                  {technicalReport.severity === 'warning'
                    ? 'с предупреждениями'
                    : 'успех'}
                </Typography>
                {technicalReport.type === 'IMPORT' && summaryRows !== null ? (
                  <>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      Все ресурсы: {summaryRows.allResources} (создано{' '}
                      {summaryRows.allCreated}, заменено{' '}
                      {summaryRows.allReplaced}, проигнорировано{' '}
                      {summaryRows.allIgnored}, ошибки {summaryRows.allFailed})
                    </Typography>
                    {summaryRows.rows.map((row) => (
                      <Typography key={row.title} variant="body1">
                        {row.title}: {row.total} (создано {row.created},
                        заменено {row.replaced}, проигнорировано {row.ignored},
                        ошибки {row.failed})
                      </Typography>
                    ))}
                  </>
                ) : technicalReport.type === 'EXPORT' &&
                  exportSummaryRows !== null ? (
                  <>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      Все ресурсы: {exportSummaryRows.allResources}
                    </Typography>
                    {exportSummaryRows.rows.map((row) => (
                      <Typography key={row.title} variant="body1">
                        {row.title}: {row.count} (экспортировано {row.count})
                      </Typography>
                    ))}
                  </>
                ) : null}
              </Stack>
            ) : (
              <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                Здесь будет отображена техническая информация после завершения
                работы с данными
              </Typography>
            )}
          </Paper>
        </HorizontalTwoPartsContainer>
      </LayoutScreenContainer>
      <ImportDataFormDialog
        importModeIsActive={importModeIsActive}
        setImportModeIsActive={setImportModeIsActive}
        onSuccessImportData={(result) => {
          setTechnicalReport({
            type: 'IMPORT',
            severity: result.severity,
            summary: result.summary,
            importResult: result.result
          })
          setImportModeIsActive(false)
        }}
        onCancelClick={() => {
          setImportModeIsActive(false)
        }}
      />
      <ExportDataFormDialog
        exportModeIsActive={exportModeIsActive}
        setExportModeIsActive={setExportModeIsActive}
        onSuccessExportData={(result) => {
          setTechnicalReport({
            type: 'EXPORT',
            severity: result.severity,
            summary: result.summary,
            exportResourceCounts: result.resourceCounts
          })
          setExportModeIsActive(false)
        }}
        onCancelClick={() => {
          setExportModeIsActive(false)
        }}
      />
    </>
  )
}
