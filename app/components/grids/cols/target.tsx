// Project
import type { ActionType } from '@common/enums'
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

type Mode = 'HISTORY' | 'ACTIVE'

export function getTargetHrefForAction(
  actionType: ActionType,
  targetId?: number
): string | undefined {
  if (targetId === undefined) {
    return undefined
  }
  switch (actionType) {
    case 'CREATE_ROLE':
    case 'UPDATE_ROLE':
    case 'DELETE_ROLE_UNSAFE':
    case 'DELETE_ROLE':
    case 'DELETE_ROLES_UNSAFE':
    case 'DELETE_ROLES':
      return `roles/${targetId}`
    case 'CREATE_USER':
    case 'UPDATE_USER':
    case 'DELETE_USER':
    case 'DELETE_USERS':
      return `users/${targetId}`
    case 'CREATE_TAG':
    case 'UPDATE_TAG':
    case 'DELETE_TAG':
    case 'DELETE_TAGS':
      return `tags/${targetId}`
    case 'CREATE_DOCUMENT':
    case 'UPDATE_DOCUMENT':
    case 'DELETE_DOCUMENT_UNSAFE':
    case 'DELETE_DOCUMENT':
    case 'DELETE_DOCUMENTS_UNSAFE':
    case 'DELETE_DOCUMENTS':
      return `documents/${targetId}`
    case 'CREATE_FRAGMENT':
    case 'UPDATE_FRAGMENT':
    case 'DELETE_FRAGMENT':
    case 'DELETE_FRAGMENTS':
      return `fragments/${targetId}`
    case 'CREATE_REQUIREMENT':
    case 'UPDATE_REQUIREMENT':
    case 'DELETE_REQUIREMENT':
    case 'DELETE_REQUIREMENTS':
      return `requirements/${targetId}`
    case 'CREATE_COMMON_TOPOLOGY':
    case 'UPDATE_COMMON_TOPOLOGY':
    case 'DELETE_COMMON_TOPOLOGY_UNSAFE':
    case 'DELETE_COMMON_TOPOLOGY':
    case 'DELETE_COMMON_TOPOLOGIES_UNSAFE':
    case 'DELETE_COMMON_TOPOLOGIES':
      return `common-topologies/${targetId}`
    case 'CREATE_TOPOLOGY':
    case 'UPDATE_TOPOLOGY':
    case 'DELETE_TOPOLOGY':
    case 'DELETE_TOPOLOGIES':
      return `topologies/${targetId}`
    case 'CREATE_DSEF':
    case 'UPDATE_DSEF':
    case 'DELETE_DSEF':
    case 'DELETE_DSEFS':
      return `dsefs/${targetId}`
    case 'CREATE_DBC':
    case 'UPDATE_DBC':
    case 'DELETE_DBC':
    case 'DELETE_DBCS':
      return `dbcs/${targetId}`
    case 'CREATE_TEST_TEMPLATE':
    case 'UPDATE_TEST_TEMPLATE':
    case 'DELETE_TEST_TEMPLATE':
    case 'DELETE_TEST_TEMPLATES':
      return `test-templates/${targetId}`
    case 'CREATE_TEST':
    case 'UPDATE_TEST':
    case 'DELETE_TEST':
    case 'DELETE_TESTS':
      return `tests/${targetId}`
    case 'CREATE_SUBGROUP':
    case 'UPDATE_SUBGROUP':
    case 'DELETE_SUBGROUP':
    case 'DELETE_SUBGROUPS':
      return `subgroups/${targetId}`
    case 'CREATE_GROUP':
    case 'UPDATE_GROUP':
    case 'DELETE_GROUP':
    case 'DELETE_GROUPS':
      return `groups/${targetId}`
    case 'CREATE_DEVICE':
    case 'UPDATE_DEVICE':
    case 'DELETE_DEVICE':
    case 'DELETE_DEVICES':
      return `devices/${targetId}`
    case 'CREATE_TASK':
    case 'UPDATE_TASK':
    case 'CANCEL_TASK':
    case 'ABORT_TASK':
    case 'PAUSE_TASK':
    case 'UNPAUSE_TASK':
    case 'DELETE_TASK':
    case 'DELETE_TASKS':
      return `tasks/${targetId}`
    case 'CREATE_TASK_TEMPLATE':
    case 'UPDATE_TASK_TEMPLATE':
    case 'DELETE_TASK_TEMPLATE':
    case 'DELETE_TASK_TEMPLATES':
      return `task-templates/${targetId}`
    case 'LAUNCH_TEST':
    case 'FINISH_TEST_AS_PASSED':
    case 'FINISH_TEST_AS_FAILED':
    case 'FINISH_TEST_AS_ERROR':
    case 'CREATE_TEST_REPORT_MESSAGE':
    case 'CREATE_TEST_REPORT_MESSAGES':
    case 'CREATE_TEST_REPORT_ITEM':
    case 'CREATE_TEST_REPORT_ITEMS':
    case 'DELETE_TEST_REPORT_ITEM_UNSAFE':
    case 'DELETE_TEST_REPORT_ITEMS_UNSAFE':
      return `tests/${targetId}`
    case 'CREATE_SLICE':
    case 'UPDATE_SLICE':
    case 'DELETE_SLICE':
    case 'DELETE_SLICES':
      return `slices/${targetId}`
    default:
      return undefined
  }
}

export function prepareTargetForAction(
  targetId: number | undefined,
  actionType: ActionType,
  targetStrId: string | undefined,
  mode: Mode,
  withoutStaticText?: boolean
) {
  const href = getTargetHrefForAction(actionType, targetId)
  const text =
    mode === 'HISTORY' && withoutStaticText !== true
      ? href !== undefined
        ? 'ПЕРЕЙТИ'
        : ''
      : (targetStrId ?? (targetId !== undefined ? `[ID:${targetId}]` : ''))
  return { targetId, href, targetStrId, text }
}

function prepare(row: any, mode: Mode) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  return prepareTargetForAction(row.targetId, row.type, row.targetStrId, mode)
}

export function useTargetCol(mode: Mode) {
  const col: GridColDef = React.useMemo(
    () => ({
      field: `targetId-${mode}`,
      headerName: mode === 'HISTORY' ? 'История объекта' : 'Объект',
      valueGetter: (val, row) => prepare(row, mode).text,
      renderCell: (params: GridRenderCellParams<any, number>) => {
        const { href, text } = prepare(params.row, mode)
        return (
          <GridRefCell
            text={text}
            hrefPrefix={mode == 'HISTORY' ? '/history' : ''}
            hrefPath={href ?? ''}
            disableRef={href === undefined}
          />
        )
      },
      minWidth: 150,
      flex: 1
    }),
    [mode]
  )
  return col
}
