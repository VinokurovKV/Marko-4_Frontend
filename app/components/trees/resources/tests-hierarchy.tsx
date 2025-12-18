// Project
import type { TestSecondary, SubgroupSecondary, GroupPrimary } from '~/types'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { alpha, styled } from '@mui/material/styles'
import { useRichTreeViewApiRef } from '@mui/x-tree-view/hooks'
import type { TreeViewBaseItem } from '@mui/x-tree-view/models'
import { RichTreeView } from '@mui/x-tree-view/RichTreeView'
import { TreeItem, treeItemClasses } from '@mui/x-tree-view/TreeItem'
import Stack from '@mui/material/Stack'
// import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

const RichTreeViewStyled = styled(RichTreeView)(({ theme }) => [
  {
    '&': {
      padding: '10px',
      border: `1px solid ${
        theme.palette.mode === 'light'
          ? theme.palette.grey[300]
          : theme.palette.grey.A700
      }`,
      borderRadius: '5px',
      backgroundColor:
        theme.palette.mode === 'light'
          ? 'white'
          : theme.palette.background.default
    },
    '& .MuiTreeItem-content[data-focused]': {
      backgroundColor:
        theme.palette.mode === 'light'
          ? 'rgba(25, 118, 210, 0.08) !important'
          : 'rgba(144, 202, 249, 0.16) !important'
    }
  }
])

export interface TestsHierarchyTreeProps {
  tests: TestSecondary[]
  subgroups: SubgroupSecondary[]
  groups: GroupPrimary[]
  selectedTestId?: number
  selectedSubgroupId?: number
  selectedGroupId?: number
}

export function TestsHierarchyTree({
  tests,
  subgroups,
  groups: groupsUnsorted,
  selectedTestId,
  selectedSubgroupId,
  selectedGroupId
}: TestsHierarchyTreeProps) {
  const navigate = useNavigate()

  const apiRef = useRichTreeViewApiRef()

  const testForId = React.useMemo(
    () => new Map(tests.map((test) => [test.id, test])),
    [tests]
  )

  const subgroupForId = React.useMemo(
    () => new Map(subgroups.map((subgroup) => [subgroup.id, subgroup])),
    [subgroups]
  )

  const subgroupsForGroupId = React.useMemo(() => {
    const subgroupsForGroupId = new Map<number, SubgroupSecondary[]>()
    for (const subgroup of subgroups) {
      const groupId = subgroup.groupId
      if (groupId !== null) {
        if (subgroupsForGroupId.has(groupId) === false) {
          subgroupsForGroupId.set(groupId, [])
        }
        subgroupsForGroupId.get(groupId)!.push(subgroup)
      }
    }
    for (const groupId of subgroupsForGroupId.keys()) {
      const sorted = subgroupsForGroupId
        .get(groupId)!
        .toSorted((subgroup_1, subgroup_2) =>
          subgroup_1.code.localeCompare(subgroup_2.code)
        )
      subgroupsForGroupId.set(groupId, sorted)
    }
    return subgroupsForGroupId
  }, [subgroups])

  const testsForSubgroupId = React.useMemo(() => {
    const testsForSubgroupId = new Map<number, TestSecondary[]>()
    for (const test of tests) {
      const subgroupId = test.subgroupId
      if (subgroupId !== null) {
        if (testsForSubgroupId.has(subgroupId) === false) {
          testsForSubgroupId.set(subgroupId, [])
        }
        testsForSubgroupId.get(subgroupId)!.push(test)
      }
    }
    for (const subgroupId of testsForSubgroupId.keys()) {
      const sorted = testsForSubgroupId
        .get(subgroupId)!
        .toSorted((test_1, test_2) => test_1.code.localeCompare(test_2.code))
      testsForSubgroupId.set(subgroupId, sorted)
    }
    return testsForSubgroupId
  }, [tests])

  const orphanTests = React.useMemo(
    () =>
      tests
        .filter((test) => test.subgroupId === null)
        .toSorted((test_1, test_2) => test_1.code.localeCompare(test_2.code)),
    [tests]
  )

  const orphanSubgroups = React.useMemo(
    () =>
      subgroups
        .filter((subgroup) => subgroup.groupId === null)
        .toSorted((subgroup_1, subgroup_2) =>
          subgroup_1.code.localeCompare(subgroup_2.code)
        ),
    [subgroups]
  )

  const groups = React.useMemo(
    () =>
      groupsUnsorted.toSorted((group_1, group_2) =>
        group_1.code.localeCompare(group_2.code)
      ),
    [groupsUnsorted]
  )

  const highlightedTestId = React.useMemo(
    () => selectedTestId ?? null,
    [selectedTestId]
  )

  const highlightedSubgroupId = React.useMemo(
    () =>
      selectedSubgroupId !== undefined
        ? selectedSubgroupId
        : selectedTestId !== undefined
          ? (testForId.get(selectedTestId)?.subgroupId ?? null)
          : null,
    [selectedTestId, selectedSubgroupId]
  )

  const highlightedGroupId = React.useMemo(() => {
    if (selectedGroupId !== undefined) {
      return selectedGroupId
    } else if (selectedSubgroupId !== undefined) {
      return subgroupForId.get(selectedSubgroupId)?.groupId ?? null
    } else if (selectedTestId !== undefined) {
      const subgroupId = testForId.get(selectedTestId)?.subgroupId ?? null
      return subgroupId !== null
        ? (subgroupForId.get(subgroupId)?.groupId ?? null)
        : null
    } else {
      return null
    }
  }, [selectedTestId, selectedSubgroupId, selectedGroupId])

  const defaultExpandedItems = React.useMemo(
    () => [
      ...(orphanTests.some((test) => test.id === highlightedTestId)
        ? ['default-group', 'default-subgroup']
        : []),
      ...(orphanSubgroups.some(
        (subgroup) => subgroup.id === highlightedSubgroupId
      )
        ? ['default-group']
        : []),
      ...(() => {
        if (highlightedTestId !== null) {
          const subgroupId =
            testForId.get(highlightedTestId)?.subgroupId ?? null
          return subgroupId !== null ? [`subgroup-${subgroupId}`] : []
        } else {
          return []
        }
      })(),
      ...(() => {
        if (highlightedSubgroupId !== null) {
          const groupId =
            subgroupForId.get(highlightedSubgroupId)?.groupId ?? null
          return groupId !== null ? [`group-${groupId}`] : []
        } else {
          return []
        }
      })()
    ],
    [
      testForId,
      subgroupForId,
      orphanTests,
      orphanSubgroups,
      highlightedTestId,
      highlightedSubgroupId,
      highlightedGroupId
    ]
  )

  const selectedItem = React.useMemo(
    () =>
      selectedTestId !== undefined
        ? `test-${selectedTestId}`
        : selectedSubgroupId !== undefined
          ? `subgroup-${selectedSubgroupId}`
          : selectedGroupId !== undefined
            ? `group-${selectedGroupId}`
            : undefined,
    [selectedTestId, selectedSubgroupId, selectedGroupId]
  )

  React.useEffect(() => {
    if (selectedItem !== undefined) {
      apiRef.current?.focusItem(null, selectedItem)
    }
  }, [selectedItem])

  const items: TreeViewBaseItem[] = React.useMemo(
    () => [
      ...(orphanTests.length > 0 || orphanSubgroups.length > 0
        ? [
            {
              id: 'default-group',
              label: 'Группа по умолчанию',
              children: [
                ...(orphanTests.length > 0
                  ? [
                      {
                        id: 'default-subgroup',
                        label: 'Подгруппа по умолчанию',
                        children: orphanTests.map((test) => ({
                          id: `test-${test.id}`,
                          label: capitalize(test.code, true)
                        }))
                      }
                    ]
                  : []),
                ...orphanSubgroups.map((subgroup) => ({
                  id: `subgroup-${subgroup.id}`,
                  label: capitalize(subgroup.code, true),
                  children: (testsForSubgroupId.get(subgroup.id) ?? []).map(
                    (test) => ({
                      id: `test-${test.id}`,
                      label: capitalize(test.code, true)
                    })
                  )
                }))
              ]
            }
          ]
        : []),
      ...groups.map((group) => ({
        id: `group-${group.id}`,
        label: capitalize(group.code, true),
        children: (subgroupsForGroupId.get(group.id) ?? []).map((subgroup) => ({
          id: `subgroup-${subgroup.id}`,
          label: capitalize(subgroup.code, true),
          children: (testsForSubgroupId.get(subgroup.id) ?? []).map((test) => ({
            id: `test-${test.id}`,
            label: capitalize(test.code, true)
          }))
        }))
      }))
    ],
    [
      subgroupsForGroupId,
      testsForSubgroupId,
      orphanTests,
      orphanSubgroups,
      groups
    ]
  )

  const CustomTreeItem = styled(TreeItem)(({ theme }) => ({
    color: theme.palette.grey[200],
    [`& .${treeItemClasses.content}`]: {
      borderRadius: theme.spacing(0.5),
      borderBottom: `0.9px solid ${
        theme.palette.mode === 'light'
          ? theme.palette.grey[200]
          : theme.palette.grey[800]
      }`,
      padding: theme.spacing(0.9, 1),
      margin: theme.spacing(0.2, 0),
      [`& .${treeItemClasses.label}`]: {
        fontSize: '0.8rem',
        fontWeight: 500
      }
    },
    // [`& .${treeItemClasses.iconContainer}`]: {
    //   borderRadius: '50%',
    //   backgroundColor: theme.palette.primary.dark,
    //   padding: theme.spacing(0.0, 1.6), // theme.spacing(0, 1.2),
    //   ...theme.applyStyles('light', {
    //     backgroundColor: alpha(theme.palette.primary.main, 0.25)
    //   }),
    //   ...theme.applyStyles('dark', {
    //     color: theme.palette.primary.contrastText
    //   })
    // },
    [`& .${treeItemClasses.groupTransition}`]: {
      marginLeft: 15,
      paddingLeft: 10, // 18,
      borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`
    },
    ...theme.applyStyles('light', {
      color: theme.palette.grey[800]
    })
  }))

  const [expandedItems, setExpandedItems] =
    React.useState<string[]>(defaultExpandedItems)

  const handleSelectedItemsChange = React.useCallback(
    (event: React.SyntheticEvent | null, itemIds: string | string[] | null) => {
      const itemId =
        itemIds === null
          ? null
          : typeof itemIds === 'string'
            ? itemIds
            : itemIds.length === 1
              ? itemIds[0]
              : null
      if (itemId === null) {
        void navigate(`/hierarchy`)
      } else if (itemId.startsWith('test')) {
        const testId = Number(itemId.split('-')[1])
        if (testId !== selectedTestId) {
          void navigate(`/hierarchy/tests/${testId}`)
        }
      } else if (itemId.startsWith('subgroup')) {
        const subgroupId = Number(itemId.split('-')[1])
        if (subgroupId !== selectedSubgroupId) {
          void navigate(`/hierarchy/subgroups/${subgroupId}`)
        }
      } else if (itemId.startsWith('group')) {
        const groupId = Number(itemId.split('-')[1])
        if (groupId !== selectedGroupId) {
          void navigate(`/hierarchy/groups/${groupId}`)
        }
      } else {
        void navigate(`/hierarchy`)
      }
    },
    [selectedTestId, selectedSubgroupId, selectedGroupId, navigate]
  )

  const handleExpandedItemsChange = (
    event: React.SyntheticEvent | null,
    itemIds: string[]
  ) => {
    apiRef.current?.focusItem(event, 'default-group')
    setExpandedItems(itemIds)
  }

  console.log(selectedItem)

  return (
    <Stack spacing={1.5} p={0} sx={{ height: '100%', overflow: 'hidden' }}>
      <RichTreeViewStyled
        apiRef={apiRef}
        items={items}
        expansionTrigger="iconContainer"
        selectedItems={selectedItem ?? null}
        onSelectedItemsChange={handleSelectedItemsChange}
        expandedItems={expandedItems}
        onExpandedItemsChange={handleExpandedItemsChange}
        slots={{ item: CustomTreeItem }}
        sx={{ height: '100%', overflow: 'auto' }}
      />
    </Stack>
  )
}
