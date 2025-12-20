// Project
import { PercentBar } from '~/components/percent-bar'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { styled } from '@mui/material/styles'

const Center = styled('div')({
  height: '100%',
  display: 'flex',
  alignItems: 'center'
})

export function useOnlyMayCoverageRateCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'onlyMayCoverageRate',
      headerName: 'Покр. необяз. треб.',
      type: 'string',
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <Center>
          <PercentBar fraction={params.value ?? ''} />
        </Center>
      ),
      minWidth: 140,
      flex: 1
    }),
    []
  )

  return col
}
