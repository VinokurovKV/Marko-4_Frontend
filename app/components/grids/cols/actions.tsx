// Project
import { useDialogs } from '~/providers/dialogs'
// React
import * as React from 'react'
// Material UI
import DeleteIcon from '@mui/icons-material/Delete'
import Tooltip from '@mui/material/Tooltip'
import type { GridColDef } from '@mui/x-data-grid'
import { GridActionsCellItem } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

export interface ActionsColProps {
  delete?: {
    prepareConfirmMessage?: (rowId: number) => string
    /* Method must throws if action is unsuccessful */
    action: (rowId: number) => Promise<void>
  }
}

export function useActionsCol(props: ActionsColProps) {
  const dialogs = useDialogs()

  const handleDeleteClick = React.useCallback(
    async (rowId: number) => {
      const confirmText =
        props.delete?.prepareConfirmMessage?.(rowId) ?? 'удалить?'
      const confirmed = await dialogs.confirm(capitalize(confirmText), {
        severity: 'error',
        okText: 'Удалить',
        cancelText: 'Отменить'
      })
      if (confirmed) {
        if (props.delete?.action !== undefined) {
          try {
            await props.delete.action(rowId)
          } catch {
            //
          }
        }
      }
    },
    [props.delete]
  )

  const col: GridColDef = React.useMemo(
    () => ({
      field: 'actions',
      type: 'actions',
      headerName: 'Действия',
      hideable: false,
      disableColumnMenu: true,
      getActions: ({ row }) => [
        ...(props.delete !== undefined
          ? [
              <Tooltip title="Удалить">
                <GridActionsCellItem
                  icon={<DeleteIcon />}
                  label="Удалить"
                  onClick={() => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                    void handleDeleteClick(row.id)
                  }}
                />
              </Tooltip>
            ]
          : [])
      ],
      minWidth: 100,
      flex: 0.01
    }),
    [handleDeleteClick]
  )
  return col
}
