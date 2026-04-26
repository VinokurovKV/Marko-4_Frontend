// Project
import type { CommonTopologyPrimary } from '~/types'
import { usePopupPreviewVisibilitySettings } from '~/hooks/popup-preview-visibility'
import { GridRefCell } from '../cells/grid-ref-cell'
import { CommonTopologyHoverPreview } from '~/components/topologies/common-topology-hover-preview'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

export function useCommonTopologyCol(
  commonTopologies: CommonTopologyPrimary[] | null | undefined
) {
  const { settings } = usePopupPreviewVisibilitySettings()

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
          hoverPreview={
            settings.commonTopology
              ? {
                  renderContent: (_active, onReadyChange) => (
                    <CommonTopologyHoverPreview
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      key={params.row.commonTopologyId as number}
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      commonTopologyId={params.row.commonTopologyId as number}
                      text={params.value}
                      onReadyChange={onReadyChange}
                    />
                  )
                }
              : undefined
          }
        />
      ),
      minWidth: 140,
      flex: 1
    }),
    [commonTopologyCodeForId, settings.commonTopology]
  )

  return col
}
