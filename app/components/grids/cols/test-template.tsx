// Project
import type { TestTemplatePrimary } from '~/types'
import { GridRefCell } from '../cells/grid-ref-cell'
import { TestTemplateHoverPreview } from '~/components/test-templates/test-template-hover-preview'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

export function useTestTemplateCol(
  testTemplates: TestTemplatePrimary[] | null | undefined
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
          hoverPreview={
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            typeof params.row.testTemplateId === 'number'
              ? {
                  renderContent: (active) => (
                    <TestTemplateHoverPreview
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      testTemplateId={params.row.testTemplateId as number}
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
    [testTemplateCodeForId]
  )

  return col
}
