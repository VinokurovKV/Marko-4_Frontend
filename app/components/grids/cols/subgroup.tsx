// Project
import type { SubgroupPrimary } from '~/types'
import { usePopupPreviewVisibilitySettings } from '~/hooks/popup-preview-visibility'
import { GridRefCell } from '../cells/grid-ref-cell'
import { SubgroupHoverPreview } from '~/components/subgroups/subgroup-hover-preview'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

export function useSubgroupCol(
  subgroups: SubgroupPrimary[] | null | undefined
) {
  const { settings } = usePopupPreviewVisibilitySettings()

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
          hrefPrefix="/hierarchy/subgroups"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          hrefPath={params.row.subgroupId}
          hoverPreview={
            settings.subgroup &&
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            typeof params.row.subgroupId === 'number'
              ? {
                  renderContent: (active) => (
                    <SubgroupHoverPreview
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      subgroupId={params.row.subgroupId as number}
                      active={active}
                      text={params.value}
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
    [subgroupCodeForId, settings.subgroup]
  )

  return col
}
