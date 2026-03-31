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
import Icon from '@mui/material/Icon'

export interface PdfSearchBoxProps {
  initialValue?: string
  caseSensitive: boolean
  wholeWord: boolean
  totalMatches: number
  activeMatchIndex: number
  isSearchPending: boolean
  onSubmit: (value: string) => void
  onCaseSensitiveChange: (value: boolean) => void
  onWholeWordChange: (value: boolean) => void
  onPrevious: () => void
  onNext: () => void
  onClear: () => void
}

const SymbolIcon = ({ children }: { children: React.ReactNode }) => (
  <Icon
    sx={{
      fontFamily: '"Material Symbols Outlined"',
      fontSize: 20,
      fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
      fontFeatureSettings: "'liga'",
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    {children}
  </Icon>
)

export const PdfSearchBox = React.memo(function PdfSearchBox({
  initialValue = '',
  caseSensitive,
  wholeWord,
  totalMatches,
  activeMatchIndex,
  isSearchPending,
  onSubmit,
  onCaseSensitiveChange,
  onWholeWordChange,
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
  const hasMatches = totalMatches > 0

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
              width: 'min(350px, calc(100vw - 32px))',
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

                    if (isSearchPending && !hasMatches) {
                      return
                    }

                    if (hasMatches) {
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
                  gap: 1,
                  minWidth: 0
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    whiteSpace: 'nowrap',
                    flex: '1 1 auto',
                    minWidth: 0
                  }}
                >
                  {trimmedInputValue
                    ? isSubmittedValue && isSearchPending
                      ? hasMatches
                        ? `${activeMatchIndex} из ${totalMatches} (поиск продолжается...)`
                        : 'Поиск...'
                      : hasMatches
                        ? `${activeMatchIndex} из ${totalMatches}`
                        : 'Совпадений нет'
                    : 'Введите текст'}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    flexShrink: 0
                  }}
                >
                  <ProjButton
                    variant={caseSensitive ? 'contained' : 'outlined'}
                    title="Учитывать регистр"
                    aria-label="Учитывать регистр"
                    onClick={() => onCaseSensitiveChange(!caseSensitive)}
                    sx={{ minWidth: 0, px: 1, py: 0.25 }}
                  >
                    <SymbolIcon>match_case</SymbolIcon>
                  </ProjButton>

                  <ProjButton
                    variant={wholeWord ? 'contained' : 'outlined'}
                    title="Искать слово целиком"
                    aria-label="Искать слово целиком"
                    onClick={() => onWholeWordChange(!wholeWord)}
                    sx={{ minWidth: 0, px: 1, py: 0.25 }}
                  >
                    <SymbolIcon>match_word</SymbolIcon>
                  </ProjButton>

                  <IconButton
                    size="small"
                    aria-label="Предыдущее совпадение"
                    onClick={() => {
                      if (!trimmedInputValue) return

                      if (!isSubmittedValue) {
                        onSubmit(trimmedInputValue)
                        return
                      }

                      if (isSearchPending && !hasMatches) return

                      if (hasMatches) {
                        onPrevious()
                      }
                    }}
                    disabled={
                      !trimmedInputValue || (!hasMatches && isSearchPending)
                    }
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

                      if (isSearchPending && !hasMatches) return

                      if (hasMatches) {
                        onNext()
                      }
                    }}
                    disabled={
                      !trimmedInputValue || (!hasMatches && isSearchPending)
                    }
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
