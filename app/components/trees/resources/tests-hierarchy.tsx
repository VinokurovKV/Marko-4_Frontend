// Project
import type { TestSecondary, SubgroupSecondary, GroupPrimary } from '~/types'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { alpha, styled } from '@mui/material/styles'
import { useRichTreeViewApiRef } from '@mui/x-tree-view/hooks'
import type { TreeViewDefaultItemModelProperties } from '@mui/x-tree-view/models'
import { RichTreeView } from '@mui/x-tree-view/RichTreeView'
import { TreeItem, treeItemClasses } from '@mui/x-tree-view/TreeItem'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
// Other
import capitalize from 'capitalize'

const TreeViewContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: '100%',
  width: '100%',
  border: `1px solid ${
    theme.palette.mode === 'light'
      ? theme.palette.grey[300]
      : theme.palette.grey.A700
  }`,
  borderRadius: '5px',
  backgroundColor:
    theme.palette.mode === 'light' ? 'white' : theme.palette.background.default,
  overflow: 'hidden'
}))

const RichTreeViewStyled = styled(RichTreeView)(({ theme }) => [
  {
    height: '100%',
    overflow: 'auto',
    padding: '10px',
    paddingBottom: '48px',
    '& .MuiTreeItem-content[data-focused]': {
      backgroundColor:
        theme.palette.mode === 'light'
          ? 'rgba(25, 118, 210, 0.08) !important'
          : 'rgba(144, 202, 249, 0.16) !important'
    }
  }
])

const ToolbarContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  right: 0,
  left: 0,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: alpha(theme.palette.background.paper, 0.95),
  backdropFilter: 'blur(8px)',
  borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`,
  borderBottomLeftRadius: '4px',
  borderBottomRightRadius: '4px',
  zIndex: 1,
  ...theme.applyStyles('dark', {
    backgroundColor: alpha(theme.palette.background.paper, 0.95)
  })
}))

const SearchField = styled(TextField)(({ theme }) => ({
  flex: 1,
  '& .MuiOutlinedInput-root': {
    fontSize: '0.875rem',
    '& fieldset': {
      borderColor: alpha(theme.palette.text.primary, 0.23)
    }
  }
}))

const ButtonGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5)
}))

export interface TestsHierarchyTreeProps {
  tests: TestSecondary[]
  subgroups: SubgroupSecondary[]
  groups: GroupPrimary[]
  selectedTestId?: number
  selectedSubgroupId?: number
  selectedGroupId?: number
}

const STORAGE_KEYS = {
  SEARCH_TEXT: 'tests-hierarchy-search-text',
  EXPANDED_ITEMS: 'tests-hierarchy-expanded-items'
}

const getAllItemIds = (
  items: TreeViewDefaultItemModelProperties[]
): string[] => {
  const ids: string[] = []

  const traverse = (item: TreeViewDefaultItemModelProperties) => {
    ids.push(item.id)
    if (item.children && Array.isArray(item.children)) {
      item.children.forEach(traverse)
    }
  }

  items.forEach(traverse)
  return ids
}

const filterTree = (
  items: TreeViewDefaultItemModelProperties[],
  searchText: string
): TreeViewDefaultItemModelProperties[] => {
  if (!searchText.trim()) {
    return items
  }

  const searchLower = searchText.toLowerCase()

  const filterNode = (
    node: TreeViewDefaultItemModelProperties
  ): TreeViewDefaultItemModelProperties | null => {
    const labelMatches = String(node.label).toLowerCase().includes(searchLower)

    let filteredChildren: TreeViewDefaultItemModelProperties[] = []
    if (node.children && Array.isArray(node.children)) {
      filteredChildren = node.children
        .map(filterNode)
        .filter(
          (child): child is TreeViewDefaultItemModelProperties => child !== null
        )
    }

    if (labelMatches || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : node.children
      }
    }

    return null
  }

  return items
    .map(filterNode)
    .filter((item): item is TreeViewDefaultItemModelProperties => item !== null)
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

  const [searchText, setSearchText] = React.useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SEARCH_TEXT)
      return saved || ''
    } catch {
      return ''
    }
  })

  const [expandedItems, setExpandedItems] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPANDED_ITEMS)
      if (saved) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsed = JSON.parse(saved)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Array.isArray(parsed) ? parsed : []
      }
    } catch {
      return []
    }
    return []
  })

  const [isInitialized, setIsInitialized] = React.useState(false)

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
      setTimeout(() => {
        apiRef.current?.focusItem(null, selectedItem)
      }, 0)
    }
  }, [selectedItem])

  const rawItems: TreeViewDefaultItemModelProperties[] = React.useMemo(
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

  const filteredItems = React.useMemo(
    () => filterTree(rawItems, searchText),
    [rawItems, searchText]
  )

  const items = React.useMemo(
    () => (searchText.trim() ? filteredItems : rawItems),
    [searchText, filteredItems, rawItems]
  )

  React.useEffect(() => {
    if (!isInitialized && items.length > 0) {
      if (expandedItems.length === 0 && !searchText.trim()) {
        setExpandedItems(defaultExpandedItems)
      } else if (searchText.trim()) {
        const allIds = getAllItemIds(items)
        setExpandedItems(allIds)
      }
      setIsInitialized(true)
    }
  }, [
    items,
    defaultExpandedItems,
    searchText,
    expandedItems.length,
    isInitialized
  ])

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SEARCH_TEXT, searchText)
    } catch {
      // ...
    }
  }, [searchText])

  React.useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(
          STORAGE_KEYS.EXPANDED_ITEMS,
          JSON.stringify(expandedItems)
        )
      } catch {
        // ...
      }
    }
  }, [expandedItems, isInitialized])

  React.useEffect(() => {
    if (isInitialized && searchText.trim()) {
      const allIds = getAllItemIds(items)
      setExpandedItems(allIds)
    }
  }, [searchText, items, isInitialized])

  const allItemIds = React.useMemo(() => getAllItemIds(items), [items])

  const handleExpandAll = () => {
    setExpandedItems(allItemIds)
  }

  const handleCollapseAll = () => {
    setExpandedItems([])
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value)
  }

  const handleClearSearch = () => {
    setSearchText('')
    if (!searchText.trim()) {
      setExpandedItems(defaultExpandedItems)
    }
  }

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

      if (itemId === 'default-group' || itemId === 'default-subgroup') {
        return
      }

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
      }
    },
    [selectedTestId, selectedSubgroupId, selectedGroupId, navigate]
  )

  const handleExpandedItemsChange = (
    event: React.SyntheticEvent | null,
    itemIds: string[]
  ) => {
    setExpandedItems(itemIds)
  }

  return (
    <Stack spacing={1.5} p={0} sx={{ height: '100%', overflow: 'hidden' }}>
      <TreeViewContainer>
        <RichTreeViewStyled
          apiRef={apiRef}
          items={items}
          expansionTrigger="iconContainer"
          selectedItems={selectedItem ?? null}
          onSelectedItemsChange={handleSelectedItemsChange}
          expandedItems={expandedItems}
          onExpandedItemsChange={handleExpandedItemsChange}
          slots={{ item: CustomTreeItem }}
        />
        <ToolbarContainer>
          <SearchField
            size="small"
            placeholder="Поиск..."
            value={searchText}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchText && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <ButtonGroup>
            <Tooltip title="Свернуть все" arrow>
              <IconButton
                onClick={handleCollapseAll}
                size="small"
                color="primary"
                aria-label="collapse all"
              >
                <UnfoldLessIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Развернуть все" arrow>
              <IconButton
                onClick={handleExpandAll}
                size="small"
                color="primary"
                aria-label="expand all"
              >
                <UnfoldMoreIcon />
              </IconButton>
            </Tooltip>
          </ButtonGroup>
        </ToolbarContainer>
      </TreeViewContainer>
    </Stack>
  )
}

const CustomTreeItem = styled(TreeItem)(({ theme }) => ({
  color: theme.palette.grey[200],
  [`& .${treeItemClasses.content}`]: {
    borderRadius: theme.spacing(0.5),
    borderBottom: `0.9px solid ${
      theme.palette.mode === 'light'
        ? theme.palette.grey[200]
        : theme.palette.grey[800]
    }`,
    padding: theme.spacing(0.9, 1.25),
    margin: theme.spacing(0.2, 0),
    [`& .${treeItemClasses.label}`]: {
      fontSize: '0.8rem',
      fontWeight: 500
    }
  },
  [`& .${treeItemClasses.groupTransition}`]: {
    marginLeft: 15,
    paddingLeft: 10,
    borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`
  },
  ...theme.applyStyles('light', {
    color: theme.palette.grey[800]
  })
}))
