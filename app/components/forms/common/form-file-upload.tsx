// Project
import { ProjButton } from '~/components/buttons/button'
import { useNotifier } from '~/providers/notifier'
import { FormHelperTextStyled } from './form-helper-text'
// React
import * as React from 'react'
// Material UI
import ClearIcon from '@mui/icons-material/Clear'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { styled, useTheme } from '@mui/material/styles'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

export interface FormFileUploadProps {
  name: string
  label: string
  value?: File
  onChange: (event: { name: string; value: File | undefined }) => void
  required?: boolean
  helperText?: string
  error?: boolean
  extensions?: string[]
}

const InputLabelStyled = styled(InputLabel)({
  '&': {
    transform: 'translate(14px, 42px) scale(0.85)'
  },
  '&:not(.Mui-focused):not(.MuiFormLabel-filled)': {
    opacity: 0.55
  }
})

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1
})

export function FormFileUpload(props: FormFileUploadProps) {
  const theme = useTheme()
  const palette = theme.palette
  const mode = palette.mode
  const notifier = useNotifier()

  const [dragOver, setDragOver] = React.useState(false)

  const handleDragEnter: React.DragEventHandler<HTMLDivElement> =
    React.useCallback(
      (event) => {
        event.preventDefault()
        setDragOver(true)
      },
      [setDragOver]
    )

  const handleDragOver: React.DragEventHandler<HTMLDivElement> =
    React.useCallback(
      (event) => {
        event.preventDefault()
        setDragOver(true)
      },
      [setDragOver]
    )

  const handleDragLeave: React.DragEventHandler<HTMLDivElement> =
    React.useCallback(
      (event) => {
        event.preventDefault()
        setDragOver(false)
      },
      [setDragOver]
    )

  const handleDragEnd: React.DragEventHandler<HTMLDivElement> =
    React.useCallback(
      (event) => {
        event.preventDefault()
        setDragOver(false)
      },
      [setDragOver]
    )

  const handleDrop: React.DragEventHandler<HTMLDivElement> = React.useCallback(
    (event) => {
      event.preventDefault()
      setDragOver(false)
      const files = event.dataTransfer.files
      if (files.length === 0) {
        notifier.showWarning(
          'перенесенный объект не является файлом и был проигнорирован'
        )
      } else if (files.length > 1) {
        notifier.showWarning(
          `перенесенные файлы (${files.length}) были проигнорированы, поскольку поле допускает загрузку только одного файла`
        )
      } else {
        props.onChange({
          name: props.name,
          value: files[0]
        })
      }
    },
    [props.name, props.onChange, setDragOver]
  )

  const handleChange: React.ChangeEventHandler<HTMLInputElement> =
    React.useCallback(
      (event) => {
        if (event.target.files && event.target.files[0]) {
          props.onChange({
            name: props.name,
            value: event.target.files[0]
          })
        }
      },
      [props.name, props.onChange]
    )

  const handleClearClick = React.useCallback(() => {
    void (() => {
      props.onChange({
        name: props.name,
        value: undefined
      })
    })()
  }, [props.name, props.onChange])

  const accept = React.useMemo(
    () =>
      props.extensions !== undefined
        ? props.extensions.map((extension) => `.${extension}`).join(', ')
        : undefined,
    [props.extensions]
  )

  const label = `${props.label}${props.required ? '\u2009*' : ''}`

  return (
    <FormControl size="small" sx={{ m: 1, minWidth: 120 }}>
      <Paper
        variant="outlined"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnd={handleDragEnd}
        onDrop={handleDrop}
        sx={{
          border: `1.5px dashed ${mode === 'light' ? (dragOver ? palette.grey.A700 : palette.grey['A400']) : dragOver ? palette.grey['50'] : palette.grey['600']}`,
          paddingX: '20px',
          paddingY: '35px',
          textAlign: 'right',
          cursor: 'pointer',
          background:
            mode === 'light'
              ? dragOver
                ? palette.grey['A200']
                : palette.grey['50']
              : dragOver
                ? palette.grey['800']
                : 'inherit',
          borderColor: props.error ? palette.error.main : undefined
        }}
      >
        <Typography
          variant="button"
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translate(-50%, 3px)',
            fontSize: '0.55rem',
            opacity: 0.55,
            userSelect: 'none'
          }}
        >
          перетащите или загрузите
        </Typography>
        <InputLabelStyled
          color={props.error ? 'error' : undefined}
          sx={{ color: props.error ? theme.palette.error.main : undefined }}
        >
          {label}
        </InputLabelStyled>
        <ProjButton
          component="label"
          role={undefined}
          variant="outlined"
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
        >
          Загрузить
          <VisuallyHiddenInput
            type="file"
            accept={accept}
            onChange={handleChange}
          />
        </ProjButton>
        {props.value ? (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={0.7}
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translate(-50%, 8px)',
              width: '95%'
            }}
          >
            <Typography
              sx={{
                fontSize: '0.85rem',
                opacity: 0.55,
                color: props.error ? theme.palette.error.main : undefined
              }}
            >
              загружен файл:{' '}
            </Typography>
            <Typography
              color="success"
              sx={{
                fontSize: '0.85rem',
                fontWeight: 'bold',
                color: props.error ? theme.palette.error.main : undefined,
                maxInlineSize: '270px',
                // lineClamp: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {props.value.name}
            </Typography>
            <Tooltip title="Удалить">
              <IconButton
                size="small"
                onClick={handleClearClick}
                sx={{
                  transform: 'translateX(-5px)'
                }}
              >
                <ClearIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          </Stack>
        ) : null}
      </Paper>
      <FormHelperTextStyled
        sx={{ color: props.error ? theme.palette.error.main : undefined }}
      >
        {props.helperText ?? ' '}
      </FormHelperTextStyled>
    </FormControl>
  )
}
