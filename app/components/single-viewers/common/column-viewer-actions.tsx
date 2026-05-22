// Material UI
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
// React
import * as React from 'react'

export interface ColumnViewerActionsProps {
  onUpdateClick?: () => Promise<void>
  onCancelClick?: () => Promise<void>
  onAbortClick?: () => Promise<void>
  onPauseClick?: () => Promise<void>
  onUnpauseClick?: () => Promise<void>
  onDeleteClick?: () => Promise<void>
}

export function ColumnViewerActions({
  onUpdateClick,
  onCancelClick,
  onAbortClick,
  onPauseClick,
  onUnpauseClick,
  onDeleteClick
}: ColumnViewerActionsProps) {
  const handleUpdateClick = React.useCallback(() => {
    void onUpdateClick?.()
  }, [onUpdateClick])
  const handleCancelClick = React.useCallback(() => {
    void onCancelClick?.()
  }, [onCancelClick])
  const handleAbortClick = React.useCallback(() => {
    void onAbortClick?.()
  }, [onAbortClick])
  const handlePauseClick = React.useCallback(() => {
    void onPauseClick?.()
  }, [onPauseClick])
  const handleUnpauseClick = React.useCallback(() => {
    void onUnpauseClick?.()
  }, [onUnpauseClick])
  const handleDeleteClick = React.useCallback(() => {
    void onDeleteClick?.()
  }, [onDeleteClick])
  return (
    <>
      <Stack m={-2.0} p={0}>
        <Stack direction="row" alignItems="center" spacing={0} pl={1.5}>
          {onUpdateClick ? (
            <Tooltip title="Изменить">
              <IconButton onClick={handleUpdateClick} size="medium">
                <EditIcon />
              </IconButton>
            </Tooltip>
          ) : null}
          {onCancelClick ? (
            <Tooltip title="Отменить">
              <IconButton onClick={handleCancelClick} size="medium">
                <StopIcon />
              </IconButton>
            </Tooltip>
          ) : null}
          {onAbortClick ? (
            <Tooltip title="Прервать">
              <IconButton onClick={handleAbortClick} size="medium">
                <StopIcon />
              </IconButton>
            </Tooltip>
          ) : null}
          {onPauseClick ? (
            <Tooltip title="Приостановить">
              <IconButton onClick={handlePauseClick} size="medium">
                <PauseIcon />
              </IconButton>
            </Tooltip>
          ) : null}
          {onUnpauseClick ? (
            <Tooltip title="Возобновить">
              <IconButton onClick={handleUnpauseClick} size="medium">
                <PlayArrowIcon />
              </IconButton>
            </Tooltip>
          ) : null}
          {onDeleteClick ? (
            <Tooltip title="Удалить">
              <IconButton onClick={handleDeleteClick} size="medium">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      </Stack>
    </>
  )
}
