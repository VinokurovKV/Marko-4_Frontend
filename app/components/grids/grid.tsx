// Project
import { useDialogs } from '~/providers/dialogs'
import { type ProjGridToolbarProps, ProjGridToolbar } from './grid-toolbar'
import { type ProjGridFooterProps, ProjGridFooter } from './grid-footer'
// React
import * as React from 'react'
// Material UI
import { styled } from '@mui/material/styles'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type {
  GridColDef,
  GridColumnVisibilityModel,
  GridInitialState,
  GridRowSelectionModel,
  GridValidRowModel
} from '@mui/x-data-grid'
import {
  type DataGridProps,
  type GridRowParams,
  useGridApiRef,
  DataGrid
} from '@mui/x-data-grid'
import { ruRU as ruRuDataGrid } from '@mui/x-data-grid/locales'
// Other
import capitalize from 'capitalize'
import { debounce } from 'lodash'

const ROW_HEIGHT = 32 // 36
const TOOLBAR_INPUT_HEIGHT = 28 // 32
const PAGE_SIZE_OPTIONS = [10, 25, 100]
const LS_GRID_STATE_KEY_SUFFIX = 'DATA_GRID_STATE'
const gridInitialState: GridInitialState = {
  pagination: {
    paginationModel: { pageSize: 25, page: 0 }
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
      // borderLeft: `1px solid ${theme.palette.divider}`
    },
    '& .MuiDataGrid-toolbar .MuiInputBase-root': {
      height: TOOLBAR_INPUT_HEIGHT
    },
    '&.navigation-mode .MuiDataGrid-row': {
      cursor: 'pointer',
      ':hover': {
        backgroundColor:
          theme.palette.mode === 'light'
            ? 'rgb(239, 244, 251)'
            : 'rgb(40, 47, 54)'
      }
    }
  },
  theme.applyStyles('light', {
    '& .MuiDataGrid-toolbar, & .MuiDataGrid-columnHeaders .MuiDataGrid-filler, & .MuiDataGrid-columnHeader, .MuiToolbar-root':
      {
        backgroundColor: theme.palette.grey.A100
      }
  })
])

export interface GridProps extends Pick<DataGridProps, 'rowSpanning'> {
  localSaveKey: string
  title?: string
  cols: GridColDef<GridValidRowModel>[]
  rows: GridValidRowModel[]
  defaultHiddenFields?: string[]
  navigationMode: boolean
  selectedRowId?: number
  navigationModeOnRowClick?: (rowId: number) => void
  compactFooter?: boolean
  onChangeModeClick?: () => void
  create?: {
    createModeIsActive: boolean
    setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  }
  import?: {
    importModeIsActive: boolean
    setImportModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  }
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

// Расширенный тип для хранения состояния с вертикальной прокруткой
interface ExtendedGridState extends GridInitialState {
  scrollTop?: number
}

export function Grid(props: GridProps) {
  const LS_GRID_STATE_KEY = `${props.localSaveKey}_${LS_GRID_STATE_KEY_SUFFIX}`

  const dialogs = useDialogs()

  const apiRef = useGridApiRef()

  const [initialState, setInitialState] = React.useState<ExtendedGridState>()

  const [deleteModeIsActive, setDeleteModeIsActive] = React.useState(false)

  const [rowSelectionModel, setRowSelectionModel] =
    React.useState<GridRowSelectionModel>(
      props.selectedRowId !== undefined
        ? {
            type: 'include',
            ids: new Set([props.selectedRowId])
          }
        : defaultRowSelectionModel
    )

  // Храним последнюю сохраненную позицию прокрутки
  const lastSavedScrollTop = React.useRef<number | undefined>(undefined)
  const observerRef = React.useRef<MutationObserver | null>(null)

  React.useEffect(() => {
    setRowSelectionModel(
      props.selectedRowId !== undefined
        ? {
            type: 'include',
            ids: new Set([props.selectedRowId])
          }
        : defaultRowSelectionModel
    )
  }, [props.selectedRowId, setRowSelectionModel])

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

  // Сохранение снапшота с вертикальной прокруткой
  const saveSnapshot = React.useCallback(() => {
    if (apiRef?.current?.exportState && localStorage) {
      const currentState = apiRef.current.exportState()

      // Получаем текущую позицию вертикальной прокрутки
      const scrollPosition = apiRef.current.getScrollPosition()

      const extendedState: ExtendedGridState = {
        ...currentState,
        scrollTop: scrollPosition.top
      }

      localStorage.setItem(LS_GRID_STATE_KEY, JSON.stringify(extendedState))
      lastSavedScrollTop.current = scrollPosition.top
    }
  }, [apiRef, LS_GRID_STATE_KEY])

  // Сохранение прокрутки при её изменении с debounce
  React.useEffect(() => {
    if (!apiRef.current) return

    // Создаем debounced функцию для сохранения
    const debouncedSaveScroll = debounce(() => {
      if (apiRef.current) {
        const scrollPosition = apiRef.current.getScrollPosition()
        const currentState = apiRef.current.exportState()
        const extendedState: ExtendedGridState = {
          ...currentState,
          scrollTop: scrollPosition.top
        }
        localStorage.setItem(LS_GRID_STATE_KEY, JSON.stringify(extendedState))
        lastSavedScrollTop.current = scrollPosition.top
      }
    }, 300)

    const handleScroll = () => {
      debouncedSaveScroll()
    }

    // Находим контейнер с прокруткой
    const virtualScroller =
      apiRef.current.rootElementRef?.current?.querySelector(
        '.MuiDataGrid-virtualScroller'
      )
    if (virtualScroller) {
      virtualScroller.addEventListener('scroll', handleScroll)
      return () => {
        virtualScroller.removeEventListener('scroll', handleScroll)
        debouncedSaveScroll.cancel()
      }
    }
  }, [apiRef, LS_GRID_STATE_KEY])

  // Восстановление вертикальной прокрутки
  const restoreScrollPosition = React.useCallback(() => {
    // Используем сохраненную позицию из initialState или из lastSavedScrollTop
    const targetScrollTop =
      initialState?.scrollTop !== undefined
        ? initialState.scrollTop
        : lastSavedScrollTop.current

    // Проверяем, что значение определено (включая 0)
    if (apiRef.current && targetScrollTop !== undefined) {
      // Используем requestAnimationFrame для синхронизации с рендером
      requestAnimationFrame(() => {
        if (apiRef.current) {
          apiRef.current.scroll({
            top: targetScrollTop
          })
        }
      })
    }
  }, [apiRef, initialState])

  // Восстанавливаем прокрутку при изменении rows (ререндеринге)
  React.useEffect(() => {
    if (!apiRef.current || !props.rows.length) return

    // Небольшая задержка для гарантии, что виртуальный скроллер обновился
    const timeoutId = setTimeout(() => {
      restoreScrollPosition()
    }, 50)

    return () => clearTimeout(timeoutId)
  }, [props.rows, apiRef, restoreScrollPosition])

  // Восстанавливаем прокрутку после монтирования виртуального скроллера
  React.useEffect(() => {
    if (!apiRef.current) return

    const virtualScroller =
      apiRef.current.rootElementRef?.current?.querySelector(
        '.MuiDataGrid-virtualScroller'
      )

    if (virtualScroller) {
      restoreScrollPosition()
    } else {
      // Очищаем предыдущий observer если есть
      if (observerRef.current) {
        observerRef.current.disconnect()
      }

      // Ждем появления виртуального скроллера
      observerRef.current = new MutationObserver(() => {
        const scroller = apiRef.current?.rootElementRef?.current?.querySelector(
          '.MuiDataGrid-virtualScroller'
        )
        if (scroller) {
          restoreScrollPosition()
          if (observerRef.current) {
            observerRef.current.disconnect()
          }
        }
      })

      if (apiRef.current.rootElementRef?.current) {
        observerRef.current.observe(apiRef.current.rootElementRef.current, {
          childList: true,
          subtree: true
        })
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [apiRef, restoreScrollPosition])

  React.useLayoutEffect(() => {
    const stateFromLocalStorageUnparsed =
      localStorage?.getItem(LS_GRID_STATE_KEY)
    if (stateFromLocalStorageUnparsed !== null) {
      const stateFromLocalStorage = JSON.parse(
        stateFromLocalStorageUnparsed
      ) as ExtendedGridState
      const pageSize =
        stateFromLocalStorage.pagination?.paginationModel?.pageSize
      if (
        pageSize !== undefined &&
        PAGE_SIZE_OPTIONS.includes(pageSize) === false
      ) {
        if (!stateFromLocalStorage.pagination) {
          stateFromLocalStorage.pagination = {}
        }
        if (!stateFromLocalStorage.pagination.paginationModel) {
          stateFromLocalStorage.pagination.paginationModel = {
            pageSize: PAGE_SIZE_OPTIONS[PAGE_SIZE_OPTIONS.length - 1],
            page: 0
          }
        } else {
          stateFromLocalStorage.pagination.paginationModel.pageSize =
            PAGE_SIZE_OPTIONS[PAGE_SIZE_OPTIONS.length - 1]
        }
      }
      setInitialState(stateFromLocalStorage)
      if (stateFromLocalStorage.scrollTop !== undefined) {
        lastSavedScrollTop.current = stateFromLocalStorage.scrollTop
      }
    } else {
      const columnVisibilityModel: GridColumnVisibilityModel = {}
      for (const field of props.defaultHiddenFields ?? []) {
        columnVisibilityModel[field] = false
      }
      setInitialState({
        ...gridInitialState,
        columns: {
          columnVisibilityModel: columnVisibilityModel
        }
      })
    }

    window.addEventListener('beforeunload', saveSnapshot)

    return () => {
      saveSnapshot()
    }
  }, [props.navigationMode, props.defaultHiddenFields, saveSnapshot])

  const handleRowClick = React.useCallback(
    (event: GridRowParams<any>) => {
      if (props.navigationMode) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        props.navigationModeOnRowClick?.(event.row.id)
      }
    },
    [props.navigationMode, props.navigationModeOnRowClick]
  )

  const handleCreateClick = React.useCallback(() => {
    if (props.create) {
      const { createModeIsActive, setCreateModeIsActive } = props.create
      const newCreateModeIsActive = !createModeIsActive
      setCreateModeIsActive(newCreateModeIsActive)
    }
  }, [props.create?.createModeIsActive, props.create?.setCreateModeIsActive])

  const handleImportClick = React.useCallback(() => {
    if (props.import) {
      const { importModeIsActive, setImportModeIsActive } = props.import
      const newImportModeIsActive = !importModeIsActive
      setImportModeIsActive(newImportModeIsActive)
    }
  }, [props.import?.importModeIsActive, props.import?.setImportModeIsActive])

  const handleDeleteManyClick = React.useCallback(() => {
    const newDeleteModeIsActive = !deleteModeIsActive
    setDeleteModeIsActive(newDeleteModeIsActive)
    setRowSelectionModel(defaultRowSelectionModel)
  }, [deleteModeIsActive, setDeleteModeIsActive, setRowSelectionModel])

  const footerProps: ProjGridFooterProps = React.useMemo(
    () => ({
      withSelectedRowCount: deleteModeIsActive,
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
          const confirmed = await dialogs.confirm(
            capitalize(confirmText, true),
            {
              severity: 'error',
              okText: 'Удалить',
              cancelText: 'Отменить'
            }
          )
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
      setRowSelectionModel,
      dialogs,
      props.deleteMany
    ]
  )

  if (initialState === undefined) {
    return <CircularProgress />
  }

  return (
    <Stack spacing={1.5} p={0} sx={{ height: '100%', overflow: 'hidden' }}>
      {props.title !== undefined ? (
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold'
          }}
        >
          {capitalize(props.title, true)}
        </Typography>
      ) : null}
      <DataGridStyled
        localeText={
          props.compactFooter === true
            ? {
                ...ruRuDataGrid.components.MuiDataGrid.defaultProps.localeText,
                paginationRowsPerPage: ''
              }
            : undefined
        }
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
              navigationMode: props.navigationMode,
              changeModeButton:
                props.onChangeModeClick !== undefined
                  ? {
                      active: props.navigationMode,
                      onClick: props.onChangeModeClick
                    }
                  : undefined,
              createButton: props.create
                ? {
                    active: props.create.createModeIsActive,
                    onClick: handleCreateClick
                  }
                : undefined,
              importButton: props.import
                ? {
                    active: props.import.importModeIsActive,
                    onClick: handleImportClick
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
        onRowClick={handleRowClick}
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={(newRowSelectionModel) => {
          setRowSelectionModel(newRowSelectionModel)
        }}
        className={props.navigationMode ? 'navigation-mode' : undefined}
        rowSpanning={props.rowSpanning}
        showCellVerticalBorder
        rowBufferPx={1000}
      />
    </Stack>
  )
}
