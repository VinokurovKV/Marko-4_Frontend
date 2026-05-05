// Project
import type { ActionInfo, UserPrimary } from '~/types'
import { Grid } from './grid'
import { useIdCol, useTimeCol, useActionTypeCol, useInitiatorCol } from './cols'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'

export interface ActionsGridProps {
  actions: ActionInfo[]
  users: UserPrimary[] | null
  navigationMode?: boolean
  navigationModeSelectedRowId?: number
}

export function ActionsGrid(props: ActionsGridProps) {
  const navigationMode = props.navigationMode ?? false
  const navigate = useNavigate()

  const rows: GridValidRowModel[] = props.actions
  const readCols = [
    useIdCol('id', true, navigationMode),
    useTimeCol(),
    useActionTypeCol(),
    useInitiatorCol(props.users)
  ]

  const navigationModeReadCols = React.useMemo(
    () => [readCols[0], readCols[1], readCols[3]],
    [readCols]
  )

  const cols: GridColDef[] = React.useMemo(
    () => [...(navigationMode ? navigationModeReadCols : readCols)],
    [navigationMode, readCols, navigationModeReadCols]
  )

  const defaultHiddenFields = React.useMemo(
    () => [] as (keyof ActionInfo)[],
    []
  )

  const handleNavigationModeRowClick = React.useCallback(
    (rowId: number) => {
      void navigate(
        props.navigationModeSelectedRowId !== rowId
          ? `/actions/${rowId}`
          : '/actions'
      )
    },
    [props.navigationModeSelectedRowId, navigate]
  )

  return (
    <>
      <Grid
        localSaveKey="ACTIONS"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        navigationMode={navigationMode}
        selectedRowId={
          navigationMode ? props.navigationModeSelectedRowId : undefined
        }
        navigationModeOnRowClick={handleNavigationModeRowClick}
        compactFooter={navigationMode}
      />
    </>
  )
}
