// Project
import type { ReadGroupsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/groups.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

type Group = DtoWithoutEnums<ReadGroupsWithPrimaryPropsSuccessResultItemDto>

export function useGroupCol(groups: Group[] | null | undefined) {
  const groupCodeForId = React.useMemo(
    () =>
      new Map(
        groups?.map((group) => [group.id, capitalize(group.code, true)]) ?? []
      ),
    [groups]
  )

  const col: GridColDef = React.useMemo(
    () => ({
      field: 'groupId',
      headerName: 'Группа',
      type: 'singleSelect',
      valueOptions: Array.from(groupCodeForId.values()).toSorted(),
      valueGetter: (groupId) => groupCodeForId.get(groupId),
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          text={params.value}
          hrefPrefix="/hierarchy/groups"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          hrefPath={params.row.groupId}
        />
      ),
      minWidth: 140,
      flex: 1
    }),
    [groupCodeForId]
  )

  return col
}
