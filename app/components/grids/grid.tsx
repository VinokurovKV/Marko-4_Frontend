// Project
import { useDialogs } from '~/providers/dialogs'
import { type ProjGridToolbarProps, ProjGridToolbar } from './grid-toolbar'
import { type ProjGridFooterProps, ProjGridFooter } from './grid-footer'
// React
import * as React from 'react'
// Material UI
import { styled } from '@mui/material/styles'
import CircularProgress from '@mui/material/CircularProgress'
import type {
  GridColDef,
  GridColumnVisibilityModel,
  GridInitialState,
  GridRowSelectionModel,
  GridValidRowModel
} from '@mui/x-data-grid'
import { type DataGridProps, useGridApiRef, DataGrid } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

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
  defaultHiddenFields?: string[]
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  create?: {}
  deleteMany?: {
    prepareConfirmMessage?: (rowIds: number[]) => string
    /* Method must throws if action is unsuccessful */
    action: (rowIds: number[]) => Promise<void>
  }
}

const defaultRowSelectionModel: GridRowSelectionModel = {
  type: 'include',
  ids: new Set()
}

export function Grid(props: GridProps) {
  const LS_GRID_STATE_KEY = `${props.localSaveKey}_${LS_GRID_STATE_KEY_SUFFIX}`

  const dialogs = useDialogs()

  const apiRef = useGridApiRef()

  const [initialState, setInitialState] = React.useState<GridInitialState>()

  const [createModeIsActive, setCreateModeIsActive] = React.useState(false)
  const [deleteModeIsActive, setDeleteModeIsActive] = React.useState(false)

  const [rowSelectionModel, setRowSelectionModel] =
    React.useState<GridRowSelectionModel>(defaultRowSelectionModel)

  React.useEffect(() => {
    const rowIdsSet = new Set(props.rows.map((row) => row.id as number))
    setRowSelectionModel((model) => ({
      ...model,
      ids: (() => {
        const selectedIds = new Set<number>()
        for (const id of model.ids as Set<number>) {
          if (rowIdsSet.has(id)) {
            selectedIds.add(id)
          }
        }
        return selectedIds
      })()
    }))
  }, [props.rows, setRowSelectionModel])

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
      const columnVisibilityModel: GridColumnVisibilityModel = {}
      for (const field of props.defaultHiddenFields ?? []) {
        columnVisibilityModel[field] = false
      }
      setInitialState({
        ...gridInitialState,
        columns: {
          // material ui data-grid bag fix
          columnVisibilityModel: columnVisibilityModel
        }
      })
    }

    window.addEventListener('beforeunload', saveSnapshot)

    return () => {
      saveSnapshot()
    }
  }, [props.defaultHiddenFields, saveSnapshot])

  const handleCreateClick = React.useCallback(() => {
    const newCreateModeIsActive = !createModeIsActive
    setCreateModeIsActive(newCreateModeIsActive)
  }, [createModeIsActive, setCreateModeIsActive])

  const handleDeleteManyClick = React.useCallback(() => {
    const newDeleteModeIsActive = !deleteModeIsActive
    setDeleteModeIsActive(newDeleteModeIsActive)
    setRowSelectionModel(defaultRowSelectionModel)
  }, [deleteModeIsActive, setDeleteModeIsActive, setRowSelectionModel])

  const footerProps: ProjGridFooterProps = React.useMemo(
    () => ({
      deleteBar: {
        active: deleteModeIsActive && rowSelectionModel.ids.size > 0,
        onCancelClick: () => {
          setDeleteModeIsActive(false)
          setRowSelectionModel(defaultRowSelectionModel)
        },
        onDeleteClick: async () => {
          const ids = Array.from(rowSelectionModel.ids) as number[]
          const confirmText =
            props.deleteMany?.prepareConfirmMessage?.(ids) ?? 'удалить?'
          const confirmed = await dialogs.confirm(capitalize(confirmText), {
            severity: 'error',
            okText: 'Удалить',
            cancelText: 'Отменить'
          })
          if (confirmed) {
            if (props.deleteMany?.action !== undefined) {
              try {
                await props.deleteMany.action(ids)
                setDeleteModeIsActive(false)
                setRowSelectionModel(defaultRowSelectionModel)
              } catch {
                //
              }
            }
          }
        }
      }
    }),
    [
      deleteModeIsActive,
      setDeleteModeIsActive,
      rowSelectionModel,
      setRowSelectionModel
    ]
  )

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
      slots={
        {
          toolbar: ProjGridToolbar,
          footer: ProjGridFooter
        } as unknown as DataGridProps['slots']
      }
      slotProps={
        {
          toolbar: {
            createButton: props.create
              ? {
                  active: createModeIsActive,
                  onClick: handleCreateClick
                }
              : undefined,
            deleteManyButton: props.deleteMany
              ? {
                  active: deleteModeIsActive,
                  onClick: handleDeleteManyClick
                }
              : undefined
          } satisfies ProjGridToolbarProps,
          footer: footerProps
        } as DataGridProps['slotProps']
      }
      columnHeaderHeight={ROW_HEIGHT}
      rowHeight={ROW_HEIGHT}
      checkboxSelection={deleteModeIsActive}
      disableRowSelectionExcludeModel
      disableRowSelectionOnClick={deleteModeIsActive}
      keepNonExistentRowsSelected
      rowSelectionModel={rowSelectionModel}
      onRowSelectionModelChange={(newRowSelectionModel) => {
        setRowSelectionModel(newRowSelectionModel)
      }}
    />
  )
}
