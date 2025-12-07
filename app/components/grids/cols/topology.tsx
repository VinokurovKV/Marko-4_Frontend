// Project
import type { ReadTopologiesWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/topologies.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

type Topology =
  DtoWithoutEnums<ReadTopologiesWithPrimaryPropsSuccessResultItemDto>

export function useTopologyCol(topologies: Topology[] | null | undefined) {
  const topologyCodeForId = React.useMemo(
    () =>
      new Map(
        topologies?.map((topology) => [
          topology.id,
          capitalize(topology.code, true)
        ]) ?? []
      ),
    [topologies]
  )

  const col: GridColDef = React.useMemo(
    () => ({
      field: 'topologyId',
      headerName: 'Топология',
      type: 'singleSelect',
      valueOptions: Array.from(topologyCodeForId.values()).toSorted(),
      valueGetter: (topologyId) => topologyCodeForId.get(topologyId),
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          text={params.value}
          hrefPrefix="/topologies"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          hrefPath={params.row.topologyId}
        />
      ),
      minWidth: 150,
      flex: 1
    }),
    []
  )

  return col
}
