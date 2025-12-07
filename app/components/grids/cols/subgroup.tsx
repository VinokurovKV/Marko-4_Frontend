// Project
import type { ReadSubgroupsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/subgroups.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

type Subgroup =
  DtoWithoutEnums<ReadSubgroupsWithPrimaryPropsSuccessResultItemDto>

export function useSubgroupCol(subgroups: Subgroup[] | null | undefined) {
  const subgroupCodeForId = React.useMemo(
    () =>
      new Map(
        subgroups?.map((subgroup) => [
          subgroup.id,
          capitalize(subgroup.code, true)
        ]) ?? []
      ),
    [subgroups]
  )

  const col: GridColDef = React.useMemo(
    () => ({
      field: 'subgroupId',
      headerName: 'Подгруппа',
      type: 'singleSelect',
      valueOptions: Array.from(subgroupCodeForId.values()).toSorted(),
      valueGetter: (subgroupId) => subgroupCodeForId.get(subgroupId),
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          text={params.value}
          hrefPrefix="/subgroups"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          hrefPath={params.row.subgroupId}
        />
      ),
      minWidth: 150,
      flex: 1
    }),
    []
  )

  return col
}
