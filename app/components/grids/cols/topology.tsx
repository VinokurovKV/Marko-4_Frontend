// Project
import type { TopologySecondary } from '~/types'
import { GridRefCell } from '../cells/grid-ref-cell'
import { TopologyHoverPreview } from '~/components/topologies/topology-hover-preview'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

export function useTopologyCol(
  topologies: TopologySecondary[] | null | undefined
) {
  const topologyForId = React.useMemo(
    () =>
      new Map<number, TopologySecondary>(
        topologies?.map((topology) => [topology.id, topology]) ?? []
      ),
    [topologies]
  )

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
      renderCell: (
        params: GridRenderCellParams<{ topologyId: number }, string>
      ) => {
        const topology = topologyForId.get(params.row.topologyId)

        return (
          <GridRefCell
            text={params.value}
            hrefPrefix="/topologies"
            hrefPath={params.row.topologyId}
            hoverPreview={
              topology !== undefined && topology.commonTopologyId !== undefined
                ? {
                    renderContent: () => (
                      <TopologyHoverPreview
                        topologyId={topology.id}
                        text={topology.code}
                      />
                    )
                  }
                : undefined
            }
          />
        )
      },
      minWidth: 140,
      flex: 1
    }),
    [topologyCodeForId, topologyForId]
  )

  return col
}
