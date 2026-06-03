// Project
import { downloadFileFromBlob, formatDateTime } from '~/utilities'
import { serverConnector } from '~/server-connector'
import { ServerConnectorBadRequestError } from '~/server-connector/error'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { type GridProps, Grid } from '../grid'
import { type ActionsColProps, useActionsCol } from '../cols'
import { CreateBackupFormDialog } from '~/components/forms/resources/create-backup'
import { FormPassField } from '~/components/forms/common'
import { ProjButton } from '~/components/buttons/button'
// React
import * as React from 'react'
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'
// Material UI
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

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

function isIncorrectPassBadRequest(error: unknown) {
  if (error instanceof ServerConnectorBadRequestError === false) {
    return false
  }

  const object = error.object as
    | {
        message?: string | string[]
        errorReasons?: { type?: string }[]
      }
    | undefined

  const messages =
    typeof object?.message === 'string'
      ? [object.message]
      : Array.isArray(object?.message)
        ? object.message
        : []

  return (
    messages.includes('Incorrect pass') ||
    object?.errorReasons?.some(
      (reason) => reason?.type === 'Incorrect pass'
    ) === true
  )
}

export function BackupsGrid({ backups }: BackupsGridProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)
  const [restoreBackupName, setRestoreBackupName] = React.useState<
    string | null
  >(null)
  const [restorePass, setRestorePass] = React.useState('')
  const [restorePassConfirm, setRestorePassConfirm] = React.useState('')
  const [restoreSubmitAttempted, setRestoreSubmitAttempted] =
    React.useState(false)
  const [restorePassError, setRestorePassError] = React.useState<string | null>(
    null
  )
  const [restoreIsSubmitting, setRestoreIsSubmitting] = React.useState(false)
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

  const restorePassIsEmpty = restorePass.length === 0
  const restorePassConfirmIsEmpty = restorePassConfirm.length === 0
  const restorePassesAreDifferent =
    restorePassIsEmpty === false &&
    restorePassConfirmIsEmpty === false &&
    restorePass !== restorePassConfirm
  const restoreCanBeSubmitted =
    restoreBackupName !== null &&
    restorePassIsEmpty === false &&
    restorePassConfirmIsEmpty === false &&
    restorePassesAreDifferent === false

  const clearRestoreDialog = React.useCallback(() => {
    setRestorePass('')
    setRestorePassConfirm('')
    setRestoreSubmitAttempted(false)
    setRestorePassError(null)
  }, [])

  const closeRestoreDialog = React.useCallback(() => {
    if (restoreIsSubmitting) {
      return
    }
    setRestoreBackupName(null)
    clearRestoreDialog()
  }, [clearRestoreDialog, restoreIsSubmitting])

  const handleRestoreConfirm = React.useCallback(async () => {
    setRestoreSubmitAttempted(true)

    if (restoreCanBeSubmitted === false || restoreBackupName === null) {
      return
    }

    setRestoreIsSubmitting(true)
    try {
      await serverConnector.restoreBackup({
        backupName: restoreBackupName,
        pass: restorePass
      })
      notifier.showSuccess(
        `резервная копия «${restoreBackupName}» восстановлена`
      )
      setRestoreBackupName(null)
      clearRestoreDialog()
    } catch (error) {
      if (isIncorrectPassBadRequest(error)) {
        setRestorePassError('неверный пароль')
        return
      }
      if (isNonexistentBackupBadRequest(error)) {
        notifier.showError(
          `не удалось восстановить резервную копию «${restoreBackupName}»: неполные или поврежденные данные`
        )
        return
      }
      notifier.showError(
        error,
        `не удалось восстановить резервную копию «${restoreBackupName}»`
      )
    } finally {
      setRestoreIsSubmitting(false)
    }
  }, [
    clearRestoreDialog,
    notifier,
    restoreBackupName,
    restoreCanBeSubmitted,
    restorePass
  ])

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
            action: (rowId: number) => {
              const backupName = rows.find(
                (item) => item.id === rowId
              )?.backupName
              if (backupName === undefined) {
                return Promise.resolve()
              }
              setRestoreBackupName(backupName)
              return Promise.resolve()
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
        flex: 1
      },
      {
        field: 'createdAt',
        headerName: 'Время создания',
        minWidth: 180,
        flex: 1,
        valueFormatter: (value: Date | null) =>
          value === null ? 'неизвестно' : formatDateTime(value)
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
      <Dialog
        open={restoreBackupName !== null}
        onClose={closeRestoreDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Typography
            color="warning.main"
            sx={{ fontSize: '1.2rem', fontWeight: 700, textAlign: 'center' }}
          >
            Восстановление резервной копии
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="warning">
              Вы точно уверены, что хотите восстановить резервную копию
              {restoreBackupName !== null ? ` «${restoreBackupName}»` : ''}?
            </Alert>
            <Typography color="textSecondary" sx={{ textAlign: 'center' }}>
              Текущие данные системы будут заменены данными из резервной копии.
            </Typography>
            <FormPassField
              required
              name="restorePass"
              label="пароль"
              value={restorePass}
              helperText={
                restorePassError ??
                (restoreSubmitAttempted && restorePassIsEmpty
                  ? 'укажите пароль'
                  : ' ')
              }
              error={
                restorePassError !== null ||
                (restoreSubmitAttempted && restorePassIsEmpty)
              }
              disabled={restoreIsSubmitting}
              onChange={(event) => {
                setRestorePassError(null)
                setRestorePass(event.target.value)
              }}
            />
            <FormPassField
              required
              name="restorePassConfirm"
              label="подтверждение пароля"
              value={restorePassConfirm}
              helperText={
                restoreSubmitAttempted && restorePassConfirmIsEmpty
                  ? 'подтвердите пароль'
                  : restoreSubmitAttempted && restorePassesAreDifferent
                    ? 'пароли не совпадают'
                    : ' '
              }
              error={
                restoreSubmitAttempted &&
                (restorePassConfirmIsEmpty || restorePassesAreDifferent)
              }
              disabled={restoreIsSubmitting}
              onChange={(event) => {
                setRestorePassConfirm(event.target.value)
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: 2 }}>
          <ProjButton
            variant="contained"
            loading={restoreIsSubmitting}
            disabled={restoreIsSubmitting}
            onClick={closeRestoreDialog}
          >
            отменить
          </ProjButton>
          <ProjButton
            variant="contained"
            color="warning"
            loading={restoreIsSubmitting}
            disabled={restoreIsSubmitting}
            onClick={() => {
              void handleRestoreConfirm()
            }}
          >
            восстановить
          </ProjButton>
        </DialogActions>
      </Dialog>
    </>
  )
}
