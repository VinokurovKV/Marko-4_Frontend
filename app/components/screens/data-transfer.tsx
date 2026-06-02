// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  HorizontalTwoPartsContainer,
  LayoutScreenContainer
} from '../containers'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { ProjButton } from '../buttons/button'
import { downloadFileFromBlob } from '~/utilities'
import { ImportDataFormDialog } from '../forms/resources/import-data'
import { ExportDataFormDialog } from '../forms/resources/export-data'
import type { ImportSuccessResultDto } from '@common/dtos/server-api/import.dto'
import { ArchiveHistoryFormDialog } from '../forms/resources/archive-history'
// React
import * as React from 'react'
// Material UI
import ImportExportIcon from '@mui/icons-material/ImportExport'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

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

const LOG_DOWNLOAD_ITEMS: Array<{
  id: string
  title: string
  readLogs: () => Promise<Blob>
}> = [
  {
    id: 'storage-errors',
    title: 'Ошибки хранилища',
    readLogs: () => serverConnector.readStorageErrorsLogs()
  },
  {
    id: 'storage-ise-errors',
    title: 'ISE-ошибки хранилища',
    readLogs: () => serverConnector.readStorageIseErrorsLogs()
  },
  {
    id: 'ise-error-requests',
    title: 'Запросы, завершившиеся ISE',
    readLogs: () => serverConnector.readIseErrorRequestsLogs()
  },
  {
    id: 'error-requests',
    title: 'Запросы с ошибками',
    readLogs: () => serverConnector.readErrorRequestsLogs()
  },
  {
    id: 'requests',
    title: 'Все запросы',
    readLogs: () => serverConnector.readRequestsLogs()
  }
]

function getArrayLength(
  result: ImportSuccessResultDto,
  key: keyof ImportSuccessResultDto
): number {
  const value = result[key]
  return Array.isArray(value) ? value.length : 0
}

export function DataTransferScreen() {
  const notifier = useNotifier()
  const [importModeIsActive, setImportModeIsActive] = React.useState(false)
  const [exportModeIsActive, setExportModeIsActive] = React.useState(false)
  const [technicalReport, setTechnicalReport] = React.useState<{
    type: 'IMPORT' | 'EXPORT'
    severity: 'success' | 'warning'
    summary: string
    importResult?: ImportSuccessResultDto
    exportResourceCounts?: Record<string, number>
  } | null>(null)
  const [historyActionDialog, setHistoryActionDialog] = React.useState<{
    mode: 'ARCHIVE' | 'UNARCHIVE' | 'DELETE_ARCHIVED'
    processing: boolean
  } | null>(null)
  const [archiveHistoryModeIsActive, setArchiveHistoryModeIsActive] =
    React.useState(false)
  const [logsMenuAnchorEl, setLogsMenuAnchorEl] =
    React.useState<null | HTMLElement>(null)

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

  const handleHistoryActionConfirm = React.useCallback(async () => {
    if (historyActionDialog === null || historyActionDialog.processing) {
      return
    }
    setHistoryActionDialog((old) =>
      old !== null
        ? {
            ...old,
            processing: true
          }
        : old
    )
    try {
      if (historyActionDialog.mode === 'ARCHIVE') {
        // await serverConnector.archiveHistory({})
        // notifier.showSuccess('архивирование истории выполнено')
      } else if (historyActionDialog.mode === 'UNARCHIVE') {
        await serverConnector.unarchiveHistory()
        notifier.showSuccess('восстановление истории выполнено')
      } else if (historyActionDialog.mode === 'DELETE_ARCHIVED') {
        await serverConnector.deleteArchivedHistory()
        notifier.showSuccess('удаление архивированной истории выполнено')
      }
      setHistoryActionDialog(null)
    } catch (error) {
      notifier.showError(
        error,
        historyActionDialog.mode === 'ARCHIVE'
          ? 'не удалось архивировать историю'
          : historyActionDialog.mode === 'UNARCHIVE'
            ? 'не удалось восстановить историю'
            : 'не удалось удалить архивированную историю'
      )
      setHistoryActionDialog((old) =>
        old !== null
          ? {
              ...old,
              processing: false
            }
          : old
      )
    }
  }, [historyActionDialog, notifier])

  const cancelArchiveHistoryForm = React.useCallback(() => {
    setArchiveHistoryModeIsActive(false)
  }, [setArchiveHistoryModeIsActive])

  const logsMenuIsOpen = logsMenuAnchorEl !== null

  const handleLogsMenuOpen = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setLogsMenuAnchorEl(event.currentTarget)
    },
    []
  )

  const handleLogsMenuClose = React.useCallback(() => {
    setLogsMenuAnchorEl(null)
  }, [])

  const handleLogDownload = React.useCallback(
    async (item: (typeof LOG_DOWNLOAD_ITEMS)[number]) => {
      handleLogsMenuClose()
      try {
        const blob = await item.readLogs()
        const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
        downloadFileFromBlob(blob, `system-logs-${item.id}-${stamp}.txt`)
      } catch (error) {
        notifier.showError(error, `не удалось скачать лог «${item.title}»`)
      }
    },
    [handleLogsMenuClose, notifier]
  )

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
            <Stack spacing={1.2}>
              <ProjButton
                variant="contained"
                onClick={() => {
                  setImportModeIsActive(true)
                }}
              >
                импортировать данные
              </ProjButton>
              <ProjButton
                variant="contained"
                onClick={() => {
                  setExportModeIsActive(true)
                }}
              >
                экспортировать данные
              </ProjButton>
              <ProjButton
                variant="contained"
                onClick={() => {
                  setArchiveHistoryModeIsActive(true)
                  // setHistoryActionDialog({
                  //   mode: 'ARCHIVE',
                  //   processing: false
                  // })
                }}
              >
                архивировать историю
              </ProjButton>
              <ProjButton
                variant="contained"
                onClick={() => {
                  setHistoryActionDialog({
                    mode: 'UNARCHIVE',
                    processing: false
                  })
                }}
              >
                восстановить историю
              </ProjButton>
              <ProjButton
                variant="contained"
                onClick={() => {
                  setHistoryActionDialog({
                    mode: 'DELETE_ARCHIVED',
                    processing: false
                  })
                }}
              >
                удалить архивированную историю
              </ProjButton>
              <ProjButton variant="contained" onClick={handleLogsMenuOpen}>
                скачать логи системы
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
      <Dialog
        maxWidth="xs"
        fullWidth
        open={historyActionDialog !== null}
        disableEscapeKeyDown={historyActionDialog?.processing === true}
        onClose={(_, reason) => {
          if (
            historyActionDialog?.processing === true ||
            reason === 'backdropClick' ||
            reason === 'escapeKeyDown'
          ) {
            return
          }
          setHistoryActionDialog(null)
        }}
      >
        <DialogContent>
          <Typography sx={{ textAlign: 'center' }}>
            {historyActionDialog?.processing === true
              ? historyActionDialog.mode === 'ARCHIVE'
                ? 'Архивирование истории...'
                : historyActionDialog.mode === 'UNARCHIVE'
                  ? 'Восстановление истории...'
                  : 'Удаление архивированной истории...'
              : historyActionDialog?.mode === 'ARCHIVE'
                ? 'Архивировать историю'
                : historyActionDialog?.mode === 'UNARCHIVE'
                  ? 'Восстановить историю'
                  : 'Удалить архивированную историю'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <ProjButton
            variant="outlined"
            loading={historyActionDialog?.processing === true}
            disabled={historyActionDialog?.processing === true}
            onClick={() => {
              if (historyActionDialog?.processing === true) {
                return
              }
              setHistoryActionDialog(null)
            }}
          >
            закрыть
          </ProjButton>
          <ProjButton
            variant="contained"
            loading={historyActionDialog?.processing === true}
            disabled={historyActionDialog?.processing === true}
            onClick={() => {
              void handleHistoryActionConfirm()
            }}
          >
            {historyActionDialog?.mode === 'ARCHIVE'
              ? 'архивировать'
              : historyActionDialog?.mode === 'UNARCHIVE'
                ? 'восстановить'
                : 'удалить'}
          </ProjButton>
        </DialogActions>
      </Dialog>
      <ArchiveHistoryFormDialog
        archiveModeIsActive={archiveHistoryModeIsActive}
        setArchiveModeIsActive={setArchiveHistoryModeIsActive}
        onSuccessArchiveHistory={cancelArchiveHistoryForm}
        onCancelClick={cancelArchiveHistoryForm}
      />
      <Menu
        anchorEl={logsMenuAnchorEl}
        open={logsMenuIsOpen}
        onClose={handleLogsMenuClose}
      >
        {LOG_DOWNLOAD_ITEMS.map((item) => (
          <MenuItem
            key={item.id}
            onClick={() => {
              void handleLogDownload(item)
            }}
          >
            {item.title}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
