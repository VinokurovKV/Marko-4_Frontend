// Project
import { ProjButton } from '../buttons/button'
// React
import * as React from 'react'
// Material UI
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import Typography from '@mui/material/Typography'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'

export interface PdfSearchBoxProps {
  initialValue?: string
  totalMatches: number
  activeMatchIndex: number
  isSearchPending: boolean
  onSubmit: (value: string) => void
  onPrevious: () => void
  onNext: () => void
  onClear: () => void
}

export const PdfSearchBox = React.memo(function PdfSearchBox({
  initialValue = '',
  totalMatches,
  activeMatchIndex,
  isSearchPending,
  onSubmit,
  onPrevious,
  onNext,
  onClear
}: PdfSearchBoxProps) {
  const [inputValue, setInputValue] = React.useState(initialValue)
  const [open, setOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const trimmedInputValue = inputValue.trim()
  const trimmedInitialValue = initialValue.trim()
  const isSubmittedValue = trimmedInputValue === trimmedInitialValue

  React.useEffect(() => {
    setInputValue(initialValue)
  }, [initialValue])

  React.useEffect(() => {
    if (!open) return

    const t = window.setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)

    return () => window.clearTimeout(t)
  }, [open])

  const closeSearch = React.useCallback(() => {
    setOpen(false)
  }, [])

  return (
    <ClickAwayListener onClickAway={closeSearch}>
      <Box
        sx={(theme) => ({
          position: 'relative',
          display: 'inline-flex',
          zIndex: open ? theme.zIndex.modal + 1 : 'auto'
        })}
      >
        <ProjButton
          variant={open ? 'contained' : 'outlined'}
          title="Поиск по документу"
          aria-label="Поиск по документу"
          onClick={() => setOpen((prev) => !prev)}
          sx={{ minWidth: 0, px: 1 }}
        >
          <SearchIcon fontSize="small" />
        </ProjButton>

        {open && (
          <Paper
            elevation={6}
            sx={(theme) => ({
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              zIndex: theme.zIndex.modal + 2,
              p: 1,
              width: 300,
              borderRadius: 2,
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? 'hsl(220, 35%, 3%)'
                  : 'hsl(220, 35%, 97%)'
            })}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                inputRef={inputRef}
                size="small"
                fullWidth
                placeholder="Поиск..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()

                    if (!trimmedInputValue) return

                    if (!isSubmittedValue) {
                      onSubmit(trimmedInputValue)
                      return
                    }

                    if (isSearchPending) {
                      return
                    }

                    if (totalMatches > 0) {
                      if (e.shiftKey) {
                        onPrevious()
                      } else {
                        onNext()
                      }
                    }
                  }

                  if (e.key === 'Escape') {
                    e.preventDefault()
                    setInputValue('')
                    onClear()
                    setOpen(false)
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: inputValue ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        aria-label="Очистить поиск"
                        onClick={() => {
                          setInputValue('')
                          onClear()
                          inputRef.current?.focus()
                        }}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined
                }}
              />

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1
                }}
              >
                <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
                  {trimmedInputValue
                    ? isSubmittedValue && isSearchPending
                      ? 'Поиск...'
                      : totalMatches > 0
                        ? `${activeMatchIndex} из ${totalMatches}`
                        : 'Совпадений нет'
                    : 'Введите текст'}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    aria-label="Предыдущее совпадение"
                    onClick={() => {
                      if (!trimmedInputValue) return

                      if (!isSubmittedValue) {
                        onSubmit(trimmedInputValue)
                        return
                      }

                      if (isSearchPending) return

                      if (totalMatches > 0) {
                        onPrevious()
                      }
                    }}
                    disabled={!trimmedInputValue || isSearchPending}
                  >
                    <NavigateBeforeIcon fontSize="small" />
                  </IconButton>

                  <IconButton
                    size="small"
                    aria-label="Следующее совпадение"
                    onClick={() => {
                      if (!trimmedInputValue) return

                      if (!isSubmittedValue) {
                        onSubmit(trimmedInputValue)
                        return
                      }

                      if (isSearchPending) return

                      if (totalMatches > 0) {
                        onNext()
                      }
                    }}
                    disabled={!trimmedInputValue || isSearchPending}
                  >
                    <NavigateNextIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  )
})
