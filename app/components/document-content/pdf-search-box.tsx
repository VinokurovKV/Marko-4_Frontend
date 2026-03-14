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

export interface PdfSearchBoxProps {
  initialValue?: string
  onSubmit: (value: string) => void
  onClear: () => void
}

export const PdfSearchBox = React.memo(function PdfSearchBox({
  initialValue = '',
  onSubmit,
  onClear
}: PdfSearchBoxProps) {
  const [inputValue, setInputValue] = React.useState(initialValue)
  const [open, setOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

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
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
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
              zIndex: 20,
              p: 1,
              width: 260,
              borderRadius: 2,
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? 'hsl(220, 35%, 10%)'
                  : 'hsl(220, 35%, 99%)'
            })}
          >
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
                  onSubmit(inputValue.trim())
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
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  )
})
