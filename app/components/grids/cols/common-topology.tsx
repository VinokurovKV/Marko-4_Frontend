// Project
import type { ReadCommonTopologiesWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/common-topologies.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

type CommonTopology =
  DtoWithoutEnums<ReadCommonTopologiesWithPrimaryPropsSuccessResultItemDto>

export function useCommonTopologyCol(
  commonTopologies: CommonTopology[] | null | undefined
) {
  const commonTopologyCodeForId = React.useMemo(
    () =>
      new Map(
        commonTopologies?.map((commonTopology) => [
          commonTopology.id,
          capitalize(commonTopology.code, true)
        ]) ?? []
      ),
    [commonTopologies]
  )

  const col: GridColDef = React.useMemo(
    () => ({
      field: 'commonTopologyId',
      headerName: 'Общая топология',
      type: 'singleSelect',
      valueOptions: Array.from(commonTopologyCodeForId.values()).toSorted(),
      valueGetter: (commonTopologyId) =>
        commonTopologyCodeForId.get(commonTopologyId),
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          refObjectId={params.row.commonTopologyId}
          text={params.value}
          hrefPrefix="/common-topologies"
        />
      ),
      minWidth: 150,
      flex: 1
    }),
    []
  )

  return col
}
