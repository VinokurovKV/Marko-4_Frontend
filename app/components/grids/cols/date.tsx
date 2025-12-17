// TODO: bag with useDateCol filtering (1-day delta, here too: https://mui.com/x/react-data-grid/custom-columns/), only for date, not for datetime

// Project
import { formatDate, formatDateTime } from '~/utilities'
// React
import * as React from 'react'
// Material UI
import useEnhancedEffect from '@mui/utils/useEnhancedEffect'
import type {
  GridColDef,
  GridColTypeDef,
  GridFilterInputValueProps,
  GridRenderEditCellParams
} from '@mui/x-data-grid'
import {
  getGridDateOperators,
  useGridApiContext,
  GRID_DATE_COL_DEF,
  GRID_DATETIME_COL_DEF
} from '@mui/x-data-grid'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
// Other
import dayjs from 'dayjs'

const dateColumnType: GridColTypeDef<Date, string> = {
  ...GRID_DATE_COL_DEF,
  resizable: false,
  renderEditCell: (params) => {
    return <GridEditDateCell {...params} />
  },
  filterOperators: getGridDateOperators(false).map((item) => ({
    ...item,
    InputComponent: GridFilterDateInput,
    InputComponentProps: { showTime: false }
  })),
  valueFormatter: (value) => {
    if (value) {
      return formatDate(value)
    }
    return ''
  }
}

function GridEditDateCell({
  id,
  field,
  value,
  colDef,
  hasFocus
}: GridRenderEditCellParams<any, Date | null, string>) {
  const apiRef = useGridApiContext()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const Component = colDef.type === 'dateTime' ? DateTimePicker : DatePicker

  const handleChange = (newValue: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    apiRef.current.setEditCellValue({ id, field, value: newValue })
  }

  useEnhancedEffect(() => {
    if (hasFocus) {
      inputRef.current!.focus()
    }
  }, [hasFocus])

  return (
    <Component
      value={value ? dayjs(value) : value}
      autoFocus
      onChange={handleChange}
      slotProps={{
        textField: {
          inputRef,
          variant: 'standard',
          fullWidth: true,
          sx: {
            padding: '0 9px',
            justifyContent: 'center'
          },
          InputProps: {
            disableUnderline: true,
            sx: { fontSize: 'inherit' }
          }
        }
      }}
    />
  )
}

function GridFilterDateInput(
  props: GridFilterInputValueProps & { showTime?: boolean }
) {
  const { item, showTime, applyValue, apiRef } = props

  const Component = showTime ? DateTimePicker : DatePicker

  const handleFilterChange = (newValue: unknown) => {
    applyValue({ ...item, value: newValue })
  }

  return (
    <Component
      value={
        item.value
          ? // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            dayjs(new Date(item.value))
          : null /* item.value ? new Date(item.value) : null */
      }
      autoFocus
      label={apiRef.current.getLocaleText('filterPanelInputLabel')}
      slotProps={{ textField: { size: 'small' } }}
      onChange={handleFilterChange}
    />
  )
}

/**
 * `dateTime` column
 */

const dateTimeColumnType: GridColTypeDef<Date, string> = {
  ...GRID_DATETIME_COL_DEF,
  resizable: false,
  renderEditCell: (params) => {
    return <GridEditDateCell {...params} />
  },
  filterOperators: getGridDateOperators(true).map((item) => ({
    ...item,
    InputComponent: GridFilterDateInput,
    InputComponentProps: { showTime: true }
  })),
  valueFormatter: (value) => {
    if (value) {
      return formatDateTime(value)
    }
    return ''
  }
}

export interface DateColProps {
  field: string
  headerName: string
  minWidth?: number
  flex?: number
}

export function useDateCol(props: DateColProps) {
  const col: GridColDef = React.useMemo(
    () => ({
      field: props.field,
      headerName: props.headerName,
      ...dateColumnType,
      minWidth: props.minWidth,
      flex: props.flex
    }),
    [props.field, props.headerName, props.minWidth, props.flex]
  )
  return col
}

export function useDateTimeCol(props: DateColProps) {
  const col: GridColDef = React.useMemo(
    () => ({
      field: props.field,
      headerName: props.headerName,
      ...dateTimeColumnType,
      minWidth: props.minWidth,
      flex: props.flex
    }),
    [props.field, props.headerName, props.minWidth, props.flex]
  )
  return col
}
