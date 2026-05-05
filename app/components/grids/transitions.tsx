// Project
import type { VersionedResourceType } from '@common/enums'
import { versionResourceTypeToPlural } from '@common/enums'
import type { Transition } from '~/types'
import { Grid } from './grid'
import {
  useActionCol,
  useTimeCol,
  useTransitionNumCol,
  useTransitionTypeCol
} from './cols'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { type GridColDef, type GridValidRowModel } from '@mui/x-data-grid'
// Other
import * as changeCase from 'change-case'

export interface TransitionsGridProps {
  resourceType: VersionedResourceType
  resourceId: number
  transitions: Transition[]
  navigationMode?: boolean
  navigationModeSelectedTransitionNum?: number
}

export function TransitionsGrid(props: TransitionsGridProps) {
  const navigationMode = props.navigationMode ?? false
  const navigate = useNavigate()

  const rows: GridValidRowModel[] = props.transitions.map((transition) => ({
    id: transition.transitionNum,
    ...transition
  }))

  const readCols = [
    useTransitionNumCol(
      'transitionNum',
      true,
      `/history/${changeCase.kebabCase(versionResourceTypeToPlural[props.resourceType])}/${props.resourceId}`,
      navigationMode
    ),
    useTimeCol(),
    useTransitionTypeCol(),
    useActionCol()
  ]

  const navigationModeReadCols = React.useMemo(
    () => [readCols[0], readCols[1]],
    [readCols]
  )

  const cols: GridColDef[] = React.useMemo(
    () => [...(navigationMode ? navigationModeReadCols : readCols)],
    [navigationMode, readCols, navigationModeReadCols]
  )

  const defaultHiddenFields = React.useMemo(
    () => [] as (keyof Transition)[],
    []
  )

  const handleNavigationModeRowClick = React.useCallback(
    (rowId: number) => {
      const pathPrefix = `/history/${changeCase.kebabCase(versionResourceTypeToPlural[props.resourceType])}/${props.resourceId}`
      void navigate(
        props.navigationModeSelectedTransitionNum !== rowId
          ? `${pathPrefix}/${rowId}`
          : pathPrefix
      )
    },
    [
      props.resourceType,
      props.resourceId,
      props.navigationModeSelectedTransitionNum,
      navigate
    ]
  )

  return (
    <>
      <Grid
        localSaveKey="TRANSITIONS"
        cols={cols}
        rows={rows}
        defaultHiddenFields={defaultHiddenFields}
        navigationMode={navigationMode}
        selectedRowId={
          navigationMode ? props.navigationModeSelectedTransitionNum : undefined
        }
        navigationModeOnRowClick={handleNavigationModeRowClick}
        compactFooter={navigationMode}
      />
    </>
  )
}
