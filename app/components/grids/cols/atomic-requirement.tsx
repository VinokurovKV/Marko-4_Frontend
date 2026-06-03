// Project
import type { RequirementPrimary } from '~/types'
import { usePopupPreviewVisibilitySettings } from '~/hooks/popup-preview-visibility'
import { GridRefCell } from '../cells/grid-ref-cell'
import { RequirementHoverPreview } from '~/components/requirements/requirement-hover-preview'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

export function useAtomicRequirementCol(
  requirements: RequirementPrimary[] | null | undefined
) {
  const { settings } = usePopupPreviewVisibilitySettings()

  const requirementNameForId = React.useMemo(
    () =>
      new Map(
        requirements?.map((requirement) => [
          requirement.id,
          capitalize(requirement.code, true)
        ]) ?? []
      ),
    [requirements]
  )

  const col: GridColDef = React.useMemo(
    () => ({
      field: 'atomicRequirementId',
      headerName: 'Атом. требование',
      type: 'singleSelect',
      valueOptions: Array.from(requirementNameForId.values()).toSorted(),
      valueGetter: (requirementId) => requirementNameForId.get(requirementId),
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          text={params.value}
          hrefPrefix="/requirements"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          hrefPath={params.row.atomicRequirementId}
          hoverPreview={
            settings.requirement &&
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            typeof params.row.atomicRequirementId === 'number'
              ? {
                  renderContent: (active, onReadyChange) => (
                    <RequirementHoverPreview
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      key={params.row.atomicRequirementId as number}
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      requirementId={params.row.atomicRequirementId as number}
                      active={active}
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
    [requirementNameForId]
  )

  return col
}
