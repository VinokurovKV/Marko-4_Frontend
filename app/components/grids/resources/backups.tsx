// Project
import { downloadFileFromBlob, formatDateTime } from '~/utilities'
import { serverConnector } from '~/server-connector'
import { ServerConnectorBadRequestError } from '~/server-connector/error'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { type GridProps, Grid } from '../grid'
import { type ActionsColProps, useActionsCol } from '../cols'
import { CreateBackupFormDialog } from '~/components/forms/resources/create-backup'
// React
import * as React from 'react'
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

interface BackupRow extends GridValidRowModel {
  id: number
  backupName: string
  createdAt: Date | null
}

function parseBackupDate(backupName: string): Date | null {
  const match = backupName.match(
    /^backup-(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})$/
  )
  if (match === null) {
    return null
  }
  const [, y, m, d, h, min, s] = match
  const parsed = new Date(`${y}-${m}-${d}T${h}:${min}:${s}Z`)
  return isNaN(parsed.getTime()) ? null : parsed
}

export interface BackupsGridProps {
  backups: string[]
}

function isNonexistentBackupBadRequest(error: unknown) {
  if (error instanceof ServerConnectorBadRequestError === false) {
    return false
  }

  const object = error.object as
    | {
        errorReasons?: { type?: string }[]
      }
    | undefined

  return (
    object?.errorReasons?.some(
      (reason) => reason?.type === 'NONEXISTENT_BACKUP'
    ) === true
  )
}

export function BackupsGrid({ backups }: BackupsGridProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)
  const rightsSet = React.useMemo(
    () =>
      meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet,
    [meta]
  )

  const rows = React.useMemo(
    () =>
      backups.map((backupName, index) => ({
        id: index,
        backupName,
        createdAt: parseBackupDate(backupName)
      })) as BackupRow[],
    [backups]
  )

  const actionsColProps: ActionsColProps = React.useMemo(
    () => ({
      export: {
        action: async (rowId) => {
          const backupName = rows.find((item) => item.id === rowId)?.backupName
          if (backupName === undefined) {
            return
          }
          try {
            const data = await serverConnector.downloadBackup({ backupName })
            downloadFileFromBlob(data, `${backupName}.zip`)
          } catch (error) {
            notifier.showError(
              error,
              `не удалось скачать резервную копию «${backupName}»`
            )
          }
        }
      },
      restore: rightsSet.has('REPLICATOR')
        ? {
            action: async (rowId: number) => {
              const backupName = rows.find(
                (item) => item.id === rowId
              )?.backupName
              if (backupName === undefined) {
                return
              }
              try {
                await serverConnector.restoreBackup({ backupName })
                notifier.showSuccess(
                  `резервная копия «${backupName}» восстановлена`
                )
              } catch (error) {
                if (isNonexistentBackupBadRequest(error)) {
                  notifier.showError(
                    `не удалось восстановить резервную копию «${backupName}»: неполные или поврежденные данные`
                  )
                  return
                }
                notifier.showError(
                  error,
                  `не удалось восстановить резервную копию «${backupName}»`
                )
              }
            }
          }
        : undefined,
      delete: rightsSet.has('REPLICATOR')
        ? {
            prepareConfirmMessage: (rowId) => {
              const backupName = rows.find(
                (item) => item.id === rowId
              )?.backupName
              return `удалить резервную копию «${backupName ?? ''}»?`
            },
            action: async (rowId) => {
              const backupName = rows.find(
                (item) => item.id === rowId
              )?.backupName
              if (backupName === undefined) {
                return
              }
              try {
                await serverConnector.deleteBackup({ backupName })
                notifier.showSuccess(`резервная копия «${backupName}» удалена`)
              } catch (error) {
                notifier.showError(
                  error,
                  `не удалось удалить резервную копию «${backupName}»`
                )
              }
            }
          }
        : undefined
    }),
    [notifier, rightsSet, rows]
  )
  const actionsCol = useActionsCol(actionsColProps)

  const cols: GridColDef[] = React.useMemo(
    () => [
      {
        field: 'backupName',
        headerName: 'Название',
        minWidth: 280,
        flex: 1.2
      },
      {
        field: 'createdAt',
        headerName: 'Создан',
        minWidth: 180,
        flex: 0.8,
        valueFormatter: (value: Date | null) =>
          value === null ? 'неизвестно' : formatDateTime(value)
      },
      {
        field: 'origin',
        headerName: 'Тип',
        minWidth: 160,
        flex: 0.7,
        valueGetter: (_, row: BackupRow) =>
          row.backupName.startsWith('backup-')
            ? 'автосгенерированный'
            : 'пользовательский'
      },
      actionsCol
    ],
    [actionsCol]
  )

  const createProps: GridProps['create'] = React.useMemo(
    () => ({
      createModeIsActive,
      setCreateModeIsActive
    }),
    [createModeIsActive]
  )

  const cancelCreateForm = React.useCallback(() => {
    setCreateModeIsActive(false)
  }, [])

  return (
    <>
      <Grid
        localSaveKey="BACKUPS"
        cols={cols}
        rows={rows}
        navigationMode={false}
        defaultHiddenFields={[]}
        create={createProps}
        deleteMany={undefined}
      />
      <CreateBackupFormDialog
        createModeIsActive={createModeIsActive}
        setCreateModeIsActive={setCreateModeIsActive}
        onSuccessCreateBackup={cancelCreateForm}
        onCancelClick={cancelCreateForm}
      />
    </>
  )
}
