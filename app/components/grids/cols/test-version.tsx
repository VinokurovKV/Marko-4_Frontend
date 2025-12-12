// Project
import type { TestPrimary, TaskTertiary } from '~/types'
import { GridRefCell } from '../cells/grid-ref-cell'
// React
import * as React from 'react'
// Material UI
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'

export function useFlatTestVersionCol(
  tests: TestPrimary[] | null | undefined,
  task: TaskTertiary
) {
  const testCodeForId = React.useMemo(() => {
    const map = new Map(
      tests?.map((test) => [test.id, capitalize(test.code, true)]) ?? []
    )
    map.set(-1, 'УДАЛЕН')
    return map
  }, [tests])

  const testTransitionNumForId = React.useMemo(() => {
    const testTransitionNumForId = new Map<number, number>()
    const hierarchy = task.hierarchy
    for (const test of hierarchy.orphanTests) {
      testTransitionNumForId.set(test.id, test.transitionNum)
    }
    for (const subgroup of hierarchy.orphanSubgroups) {
      for (const test of subgroup.tests) {
        testTransitionNumForId.set(test.id, test.transitionNum)
      }
    }
    for (const group of hierarchy.groups) {
      for (const subgroup of group.subgroups) {
        for (const test of subgroup.tests) {
          testTransitionNumForId.set(test.id, test.transitionNum)
        }
      }
    }
    return testTransitionNumForId
  }, [task])

  const col: GridColDef = React.useMemo(
    () => ({
      field: 'testId',
      headerName: 'Тест',
      type: 'singleSelect',
      valueOptions: Array.from(testCodeForId.values()).toSorted(),
      valueGetter: (testId: number) =>
        testCodeForId.get(testId) ?? testCodeForId.get(-1),
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <GridRefCell
          text={params.value}
          hrefPrefix="/tests"
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
          hrefPath={`${params.row.testId}/versions/${testTransitionNumForId.get(params.row.testId) ?? -1}`}
        />
      ),
      minWidth: 140,
      flex: 1
    }),
    []
  )

  return col
}
