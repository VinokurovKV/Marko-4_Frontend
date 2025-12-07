// Project
import type { ReadTestTemplatesWithPrimaryPropsSuccessResultItemDto } from '@common/dtos/server-api/test-templates.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

type TestTemplate =
  DtoWithoutEnums<ReadTestTemplatesWithPrimaryPropsSuccessResultItemDto>

export function useTestTemplateCol(
  testTemplates: TestTemplate[] | null | undefined
) {
  const testTemplateCodeForId = React.useMemo(
    () =>
      new Map(
        testTemplates?.map((testTemplate) => [
          testTemplate.id,
          capitalize(testTemplate.code, true)
        ]) ?? []
      ),
    [testTemplates]
  )

  const col: GridColDef = React.useMemo(
    () => ({
      field: 'testTemplateId',
      headerName: 'Шаблон',
      type: 'singleSelect',
      valueOptions: Array.from(testTemplateCodeForId.values()).toSorted(),
      valueGetter: (testTemplateId) =>
        testTemplateCodeForId.get(testTemplateId),
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          text={params.value}
          hrefPrefix="/test-templates"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          hrefPath={params.row.testTemplateId}
        />
      ),
      minWidth: 150,
      flex: 1
    }),
    []
  )

  return col
}
