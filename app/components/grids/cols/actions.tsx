// Project
import { useDialogs } from '~/providers/dialogs'
// React
import * as React from 'react'
// Material UI
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
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
            key={item.title}
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
  cancel?: {
    displayCondition?: (rowId: number) => boolean
    action: (rowId: number) => Promise<void>
  }
  abort?: {
    displayCondition?: (rowId: number) => boolean
    action: (rowId: number) => Promise<void>
  }
  pause?: {
    displayCondition?: (rowId: number) => boolean
    action: (rowId: number) => Promise<void>
  }
  unpause?: {
    displayCondition?: (rowId: number) => boolean
    action: (rowId: number) => Promise<void>
  }
  delete?: {
    displayCondition?: (rowId: number) => boolean
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

  const handleCancelClick = React.useCallback(
    async (rowId: number) => {
      if (props.cancel?.action !== undefined) {
        await props.cancel.action(rowId)
      }
    },
    [props.cancel]
  )

  const handleAbortClick = React.useCallback(
    async (rowId: number) => {
      if (props.abort?.action !== undefined) {
        await props.abort.action(rowId)
      }
    },
    [props.abort]
  )

  const handlePauseClick = React.useCallback(
    async (rowId: number) => {
      if (props.pause?.action !== undefined) {
        await props.pause.action(rowId)
      }
    },
    [props.pause]
  )

  const handleUnpauseClick = React.useCallback(
    async (rowId: number) => {
      if (props.unpause?.action !== undefined) {
        await props.unpause.action(rowId)
      }
    },
    [props.unpause]
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
        ...(props.pause !== undefined &&
        (props.pause.displayCondition === undefined ||
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          props.pause.displayCondition(row.id))
          ? [
              <Tooltip title="Приостановить">
                <GridActionsCellItem
                  icon={<PauseIcon />}
                  label="Приостановить"
                  onClick={() => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                    void handlePauseClick(row.id)
                  }}
                />
              </Tooltip>
            ]
          : []),
        ...(props.unpause !== undefined &&
        (props.unpause.displayCondition === undefined ||
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          props.unpause.displayCondition(row.id))
          ? [
              <Tooltip title="Возобновить">
                <GridActionsCellItem
                  icon={<PlayArrowIcon />}
                  label="Возобновить"
                  onClick={() => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                    void handleUnpauseClick(row.id)
                  }}
                />
              </Tooltip>
            ]
          : []),
        ...(props.cancel !== undefined &&
        (props.cancel.displayCondition === undefined ||
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          props.cancel.displayCondition(row.id))
          ? [
              <Tooltip title="Отменить">
                <GridActionsCellItem
                  icon={<StopIcon />}
                  label="Отменить"
                  onClick={() => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                    void handleCancelClick(row.id)
                  }}
                />
              </Tooltip>
            ]
          : []),
        ...(props.abort !== undefined &&
        (props.abort.displayCondition === undefined ||
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          props.abort.displayCondition(row.id))
          ? [
              <Tooltip title="Прервать">
                <GridActionsCellItem
                  icon={<StopIcon />}
                  label="Прервать"
                  onClick={() => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                    void handleAbortClick(row.id)
                  }}
                />
              </Tooltip>
            ]
          : []),
        ...(props.delete !== undefined &&
        (props.delete.displayCondition === undefined ||
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          props.delete.displayCondition(row.id))
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
      props.cancel,
      props.abort,
      props.pause,
      props.unpause,
      props.delete,
      handleExportClick,
      handleCancelClick,
      handleAbortClick,
      handlePauseClick,
      handleUnpauseClick,
      handleDeleteClick
    ]
  )
  return col
}
