// Project
import type { CommonTopologyPrimary } from '~/types'
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

export function useCommonTopologyCol(
  commonTopologies: CommonTopologyPrimary[] | null | undefined
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
          text={params.value}
          hrefPrefix="/common-topologies"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          hrefPath={params.row.commonTopologyId}
        />
      ),
      minWidth: 140,
      flex: 1
    }),
    []
  )

  return col
}
