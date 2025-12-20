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

export function useMustAndShouldCoverageRateCol() {
  const col: GridColDef = React.useMemo(
    () => ({
      field: 'mustAndShouldCoverageRate',
      headerName: 'Покр. обяз. и рекоменд. треб.',
      type: 'string',
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <Center>
          <PercentBar fraction={params.value ?? ''} />
        </Center>
      ),
      minWidth: 210,
      flex: 1
    }),
    []
  )

  return col
}
