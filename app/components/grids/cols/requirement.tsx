// Project
import type { ReadRequirementsWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/requirements.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

type Requirement =
  DtoWithoutEnums<ReadRequirementsWithPrimaryPropsSuccessResultItemDto>

export function useRequirementCol(
  requirements: Requirement[] | null | undefined
) {
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
      field: 'requirementId',
      headerName: 'Требование',
      type: 'singleSelect',
      valueOptions: Array.from(requirementNameForId.values()).toSorted(),
      valueGetter: (requirementId) => requirementNameForId.get(requirementId),
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          text={params.value}
          hrefPrefix="/requirements"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          hrefPath={params.row.requirementId}
        />
      ),
      minWidth: 150,
      flex: 1
    }),
    []
  )

  return col
}
