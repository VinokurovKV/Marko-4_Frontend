// Project
import { ProjGridToolbar } from './grid-toolbar'
// React
import * as React from 'react'
// Material UI
import { styled } from '@mui/material/styles'
import CircularProgress from '@mui/material/CircularProgress'
import type {
  GridColDef,
  GridInitialState,
  GridValidRowModel
} from '@mui/x-data-grid'
import { useGridApiRef, DataGrid } from '@mui/x-data-grid'

const ROW_HEIGHT = 36
const TOOLBAR_INPUT_HEIGHT = 32
const PAGE_SIZE_OPTIONS = [10, 25, 100]
const LS_GRID_STATE_KEY_SUFFIX = 'DATA_GRID_STATE'
const gridInitialState: GridInitialState = {
  pagination: {
    paginationModel: { pageSize: 10, page: 0 }
  }
}

const DataGridStyled = styled(DataGrid)(({ theme }) => [
  {
    '& .MuiDataGrid-toolbar, & .MuiDataGrid-footerContainer': {
      minHeight: ROW_HEIGHT
    },
    '& .MuiDataGrid-footerContainer .MuiToolbar-root': {
      minHeight: ROW_HEIGHT,
      height: ROW_HEIGHT
    },
    '& .MuiDataGrid-columnHeaderTitle': {
      fontWeight: 'bold'
    },
    '& .MuiDataGrid-cell + .MuiDataGrid-cell': {
      borderLeft: `1px solid ${theme.palette.divider}`
    },
    '& .MuiDataGrid-toolbar .MuiInputBase-root': {
      height: TOOLBAR_INPUT_HEIGHT
    }
  },
  theme.applyStyles('light', {
    '& .MuiDataGrid-toolbar, & .MuiDataGrid-columnHeaders .MuiDataGrid-filler, & .MuiDataGrid-columnHeader, .MuiToolbar-root':
      {
        backgroundColor: theme.palette.grey.A100
      }
  })
])

export interface GridProps {
  localSaveKey: string
  cols: GridColDef<GridValidRowModel>[]
  rows: GridValidRowModel[]
}

export function Grid(props: GridProps) {
  const LS_GRID_STATE_KEY = `${props.localSaveKey}_${LS_GRID_STATE_KEY_SUFFIX}`

  const apiRef = useGridApiRef()

  const [initialState, setInitialState] = React.useState<GridInitialState>()

  const saveSnapshot = React.useCallback(() => {
    if (apiRef?.current?.exportState && localStorage) {
      const currentState = apiRef.current.exportState()
      localStorage.setItem(LS_GRID_STATE_KEY, JSON.stringify(currentState))
    }
  }, [apiRef])

  React.useLayoutEffect(() => {
    const stateFromLocalStorageUnparsed =
      localStorage?.getItem(LS_GRID_STATE_KEY)
    if (stateFromLocalStorageUnparsed !== null) {
      const stateFromLocalStorage = JSON.parse(
        stateFromLocalStorageUnparsed
      ) as GridInitialState
      const pageSize =
        stateFromLocalStorage.pagination?.paginationModel?.pageSize
      if (
        pageSize !== undefined &&
        PAGE_SIZE_OPTIONS.includes(pageSize) === false
      ) {
        // material ui data-grid bag fix
        stateFromLocalStorage.pagination!.paginationModel!.pageSize =
          PAGE_SIZE_OPTIONS[PAGE_SIZE_OPTIONS.length - 1]
      }
      setInitialState(stateFromLocalStorage)
    } else {
      setInitialState(gridInitialState)
    }

    window.addEventListener('beforeunload', saveSnapshot)

    return () => {
      saveSnapshot()
    }
  }, [saveSnapshot])

  if (initialState === undefined) {
    return <CircularProgress />
  }

  return (
    <DataGridStyled
      apiRef={apiRef}
      columns={props.cols}
      rows={props.rows}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      initialState={initialState}
      showToolbar
      slots={{ toolbar: ProjGridToolbar }}
      columnHeaderHeight={ROW_HEIGHT}
      rowHeight={ROW_HEIGHT}
    />
  )
}
