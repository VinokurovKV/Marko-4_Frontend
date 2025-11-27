// Project
import { useDialogs } from '~/providers/dialogs'
// React
import * as React from 'react'
// Material UI
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import Tooltip from '@mui/material/Tooltip'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import type { GridColDef } from '@mui/x-data-grid'
import { GridActionsCellItem } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

interface MenuItem {
  title: string
  action: (rowId: number) => Promise<void>
}

interface ExportMenuProps {
  rowId: number
  items: MenuItem[]
}

export function ExportMenu(props: ExportMenuProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLButtonElement>(null)

  return (
    <>
      <Tooltip title="Скачать">
        <GridActionsCellItem
          ref={ref}
          icon={<DownloadIcon />}
          label="Скачать"
          onClick={() => {
            setOpen((open) => !open)
          }}
        />
      </Tooltip>
      <Menu
        anchorEl={ref.current}
        open={open}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {props.items.map((item) => (
          <MenuItem
            onClick={() => {
              void item.action(props.rowId)
            }}
          >
            {item.title}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export interface ActionsColProps {
  export?: {
    action: (rowId: number) => Promise<void>
  }
  exportMenuItems?: MenuItem[]
  delete?: {
    prepareConfirmMessage?: (rowId: number) => string
    action: (rowId: number) => Promise<void>
  }
}

export function useActionsCol(props: ActionsColProps) {
  const dialogs = useDialogs()

  const handleExportClick = React.useCallback(
    async (rowId: number) => {
      if (props.export?.action !== undefined) {
        await props.export.action(rowId)
      }
    },
    [props.export]
  )

  const handleDeleteClick = React.useCallback(
    async (rowId: number) => {
      const confirmText =
        props.delete?.prepareConfirmMessage?.(rowId) ?? 'удалить?'
      const confirmed = await dialogs.confirm(capitalize(confirmText, true), {
        severity: 'error',
        okText: 'Удалить',
        cancelText: 'Отменить'
      })
      if (confirmed) {
        if (props.delete?.action !== undefined) {
          await props.delete.action(rowId)
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
        ...(props.export !== undefined
          ? [
              <Tooltip title="Скачать">
                <GridActionsCellItem
                  icon={<DownloadIcon />}
                  label="Скачать"
                  onClick={() => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                    void handleExportClick(row.id)
                  }}
                />
              </Tooltip>
            ]
          : []),
        ...(props.exportMenuItems !== undefined
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            [<ExportMenu rowId={row.id} items={props.exportMenuItems} />]
          : []),
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
    [
      props.export,
      props.exportMenuItems,
      props.delete,
      handleExportClick,
      handleDeleteClick
    ]
  )
  return col
}
