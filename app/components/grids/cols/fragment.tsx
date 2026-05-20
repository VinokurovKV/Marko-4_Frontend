// Project
import type { FragmentPrimary } from '~/types'
// React
import * as React from 'react'
// Material UI
import type { GridColDef } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

export function useFragmentCol(
  fragments: FragmentPrimary[] | null | undefined
) {
  const fragmentInnerCodeForId = React.useMemo(
    () =>
      new Map(
        fragments?.map((fragment) => [
          fragment.id,
          capitalize(fragment.innerCode, true)
        ]) ?? []
      ),
    [fragments]
  )

  const col: GridColDef = React.useMemo(
    () => ({
      field: 'fragmentId',
      headerName: 'Фрагмент',
      valueGetter: (fragmentId) => fragmentInnerCodeForId.get(fragmentId),
      minWidth: 140,
      flex: 1
    }),
    [fragmentInnerCodeForId]
  )

  return col
}
