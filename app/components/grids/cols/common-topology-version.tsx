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

export function useCommonTopologyVersionCol(
  commonTopologies: CommonTopologyPrimary[] | null | undefined
) {
  const { settings } = usePopupPreviewVisibilitySettings()

  const commonTopologyCodeForId = React.useMemo(() => {
    const map = new Map(
      commonTopologies?.map((commonTopology) => [
        commonTopology.id,
        capitalize(commonTopology.code, true)
      ]) ?? []
    )
    map.set(-1, 'УДАЛЕНА')
    return map
  }, [commonTopologies])

  const col: GridColDef = React.useMemo(
    () => ({
      field: 'commonTopology',
      headerName: 'Общая топология',
      type: 'singleSelect',
      valueOptions: Array.from(commonTopologyCodeForId.values()).toSorted(),
      valueGetter: (commonTopology: any) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        commonTopologyCodeForId.get(commonTopology.id) ??
        commonTopologyCodeForId.get(-1),
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          text={params.value}
          hrefPrefix="/common-topologies"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          hrefPath={`${params.row.commonTopology.id}`}
          hoverPreview={
            settings.commonTopology
              ? {
                  renderContent: (_active, onReadyChange) => (
                    <CommonTopologyHoverPreview
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      key={params.row.commonTopology.id as number}
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      commonTopologyId={params.row.commonTopology.id as number}
                      text={params.value}
                      onReadyChange={onReadyChange}
                    />
                  )
                }
              : undefined
          }
          // hrefPath={`${params.row.commonTopology.id}/versions/${params.row.commonTopology.transitionNum}`}
        />
      ),
      minWidth: 140,
      flex: 1
    }),
    [commonTopologyCodeForId, settings.commonTopology]
  )

  return col
}
