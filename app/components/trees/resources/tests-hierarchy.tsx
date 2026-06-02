// Project
import type { TestSecondary, SubgroupSecondary, GroupPrimary } from '~/types'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
import { startTransition } from 'react'
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

const TreeViewContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'disableStickyForSubgroups'
})<{ disableStickyForSubgroups?: boolean }>(
  ({ theme, disableStickyForSubgroups }) => ({
    position: 'relative',
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${
      theme.palette.mode === 'light'
        ? theme.palette.grey[300]
        : theme.palette.grey.A700
    }`,
    borderRadius: '5px',
    backgroundColor:
      theme.palette.mode === 'light'
        ? 'white'
        : theme.palette.background.default,
    overflow: 'hidden',
    ...(disableStickyForSubgroups && {
      '& .MuiTreeItem-root .MuiTreeItem-root > .MuiTreeItem-content': {
        position: 'relative !important',
        top: 'auto !important'
      }
    })
  })
)

const RichTreeViewStyled = styled(RichTreeView)(({ theme }) => [
  {
    flex: 1,
    overflow: 'auto',
    padding: '10px',

    '& .MuiTreeItem-groupTransition': {
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden'
    },

    '& .MuiTreeItem-iconContainer:not(:empty)': {
      width: 20,
      height: 20,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing(0.5),
      borderRadius: '50%',
      backgroundColor: alpha(theme.palette.action.hover, 0.15),
      transition: theme.transitions.create(['background-color', 'color']),
      '& svg': {
        fontSize: '0.9rem',
        color: theme.palette.text.secondary
      },
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.2),
        '& svg': {
          color: theme.palette.primary.main
        }
      }
    },

    '& > .MuiTreeItem-root > .MuiTreeItem-content': {
      position: 'sticky',
      top: 0,
      zIndex: 4,
      boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.05)}`,
      backgroundColor: theme.palette.mode === 'light' ? '#f3e5f5' : '#3e2723',
      '&[data-focused]': {
        backgroundColor: theme.palette.mode === 'light' ? '#ce93d8' : '#4a148c'
      },
      '&.Mui-selected': {
        backgroundColor: theme.palette.mode === 'light' ? '#ab47bc' : '#6a1b9a'
      }
    },

    '& .MuiTreeItem-root .MuiTreeItem-root > .MuiTreeItem-content': {
      position: 'sticky',
      top: '37.5px',
      zIndex: 3,
      boxShadow: `0 0.5px 1px ${alpha(theme.palette.common.black, 0.03)}`,
      backgroundColor: theme.palette.mode === 'light' ? '#e8eaf6' : '#2c3e50',
      '&[data-focused]': {
        backgroundColor: theme.palette.mode === 'light' ? '#c5cae9' : '#1a237e'
      },
      '&.Mui-selected': {
        backgroundColor: theme.palette.mode === 'light' ? '#9fa8da' : '#283593'
      }
    },

    '& .MuiTreeItem-root .MuiTreeItem-root .MuiTreeItem-root > .MuiTreeItem-content':
      {
        position: 'relative',
        top: '0',
        zIndex: 2,
        boxShadow: 'none',
        backgroundColor: theme.palette.mode === 'light' ? '#f7f7f7' : '#242424',
        '&[data-focused]': {
          backgroundColor:
            theme.palette.mode === 'light' ? '#e3f2fd' : '#0d47a1'
        },
        '&.Mui-selected': {
          backgroundColor:
            theme.palette.mode === 'light' ? '#bbdefb' : '#1565c0'
        }
      }
  }
])

const ToolbarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5, 1),
  backgroundColor: alpha(theme.palette.background.paper, 0.95),
  backdropFilter: 'blur(8px)',
  borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`,
  zIndex: 1000,
  ...theme.applyStyles('dark', {
    backgroundColor: alpha(theme.palette.background.paper, 0.95)
  })
}))

const SearchField = styled(TextField)(({ theme }) => ({
  flex: 1,
  '& .MuiOutlinedInput-root': {
    fontSize: '0.875rem',
    height: '30px',
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

const EMPTY_ARRAY: string[] = []

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
  if (!searchText.trim()) return items
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

const CustomTreeItem = styled((props: any) => {
  const { itemId, ...other } = props
  return (
    <TreeItem
      {...other}
      itemId={itemId}
      slotProps={{
        ...other.slotProps,
        root: {
          ...other.slotProps?.root,
          'data-id': itemId
        },
        iconContainer: {
          onMouseDown: (e: React.MouseEvent) => {
            e.stopPropagation()
            e.preventDefault()
          },
          ...other.slotProps?.iconContainer
        }
      }}
    />
  )
})(({ theme }) => ({
  color: theme.palette.grey[200],
  [`& .${treeItemClasses.content}`]: {
    borderRadius: theme.spacing(0.5),
    borderBottom: `0.9px solid ${
      theme.palette.mode === 'light'
        ? theme.palette.grey[200]
        : theme.palette.grey[800]
    }`,
    padding: theme.spacing(0.9, 1.25),
    margin: theme.spacing(0.5, 0),
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
  const inputRef = React.useRef<HTMLInputElement>(null)

  const [searchText, setSearchText] = React.useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SEARCH_TEXT) || ''
    } catch {
      return ''
    }
  })

  const [debouncedSearchText, setDebouncedSearchText] =
    React.useState(searchText)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText)
    }, 150)
    return () => clearTimeout(timer)
  }, [searchText])

  const [expandedItems, setExpandedItems] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPANDED_ITEMS)
      if (saved) {
        const parsed = JSON.parse(saved)
        return Array.isArray(parsed) ? parsed : []
      }
    } catch {
      // ...
    }
    return []
  })

  const [isInitialized, setIsInitialized] = React.useState(false)
  const [disableStickyForSubgroups, setDisableStickyForSubgroups] =
    React.useState(false)
  const stickyTimeoutRef = React.useRef<number | null>(null)

  const testForId = React.useMemo(
    () => new Map(tests.map((t) => [t.id, t])),
    [tests]
  )
  const subgroupForId = React.useMemo(
    () => new Map(subgroups.map((s) => [s.id, s])),
    [subgroups]
  )

  const subgroupsForGroupId = React.useMemo(() => {
    const map = new Map<number, SubgroupSecondary[]>()
    for (const subgroup of subgroups) {
      const gid = subgroup.groupId
      if (gid !== null) {
        if (!map.has(gid)) map.set(gid, [])
        map.get(gid)!.push(subgroup)
      }
    }
    for (const gid of map.keys()) {
      map.set(
        gid,
        map.get(gid)!.toSorted((a, b) => a.code.localeCompare(b.code))
      )
    }
    return map
  }, [subgroups])

  const testsForSubgroupId = React.useMemo(() => {
    const map = new Map<number, TestSecondary[]>()
    for (const test of tests) {
      const sid = test.subgroupId
      if (sid !== null) {
        if (!map.has(sid)) map.set(sid, [])
        map.get(sid)!.push(test)
      }
    }
    for (const sid of map.keys()) {
      map.set(
        sid,
        map.get(sid)!.toSorted((a, b) => a.code.localeCompare(b.code))
      )
    }
    return map
  }, [tests])

  const orphanTests = React.useMemo(
    () =>
      tests
        .filter((t) => t.subgroupId === null)
        .toSorted((a, b) => a.code.localeCompare(b.code)),
    [tests]
  )
  const orphanSubgroups = React.useMemo(
    () =>
      subgroups
        .filter((s) => s.groupId === null)
        .toSorted((a, b) => a.code.localeCompare(b.code)),
    [subgroups]
  )
  const groups = React.useMemo(
    () => groupsUnsorted.toSorted((a, b) => a.code.localeCompare(b.code)),
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
    [selectedTestId, selectedSubgroupId, testForId]
  )

  const defaultExpandedItems = React.useMemo(
    () => [
      ...(orphanTests.some((t) => t.id === highlightedTestId)
        ? ['default-group', 'default-subgroup']
        : []),
      ...(orphanSubgroups.some((s) => s.id === highlightedSubgroupId)
        ? ['default-group']
        : []),
      ...(highlightedTestId !== null
        ? (() => {
            const sid = testForId.get(highlightedTestId)?.subgroupId ?? null
            return sid !== null ? [`subgroup-${sid}`] : []
          })()
        : []),
      ...(highlightedSubgroupId !== null
        ? (() => {
            const gid =
              subgroupForId.get(highlightedSubgroupId)?.groupId ?? null
            return gid !== null ? [`group-${gid}`] : []
          })()
        : [])
    ],
    [
      testForId,
      subgroupForId,
      orphanTests,
      orphanSubgroups,
      highlightedTestId,
      highlightedSubgroupId
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

  const rawItems: TreeViewDefaultItemModelProperties[] = React.useMemo(
    () => [
      ...(orphanTests.length > 0 || orphanSubgroups.length > 0
        ? [
            {
              id: 'default-group',
              label: 'Группа по умолчанию',
              ...((orphanTests.length > 0 || orphanSubgroups.length > 0) && {
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
                    ...((testsForSubgroupId.get(subgroup.id) ?? []).length && {
                      children: (testsForSubgroupId.get(subgroup.id) ?? []).map(
                        (test) => ({
                          id: `test-${test.id}`,
                          label: capitalize(test.code, true)
                        })
                      )
                    })
                  }))
                ].filter(Boolean)
              })
            }
          ]
        : []),
      ...groups.map((group) => {
        const groupChildren = (subgroupsForGroupId.get(group.id) ?? []).map(
          (subgroup) => ({
            id: `subgroup-${subgroup.id}`,
            label: capitalize(subgroup.code, true),
            ...((testsForSubgroupId.get(subgroup.id) ?? []).length && {
              children: (testsForSubgroupId.get(subgroup.id) ?? []).map(
                (test) => ({
                  id: `test-${test.id}`,
                  label: capitalize(test.code, true)
                })
              )
            })
          })
        )
        return {
          id: `group-${group.id}`,
          label: capitalize(group.code, true),
          ...(groupChildren.length && { children: groupChildren })
        }
      })
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
    () => filterTree(rawItems, debouncedSearchText),
    [rawItems, debouncedSearchText]
  )
  const items = React.useMemo(
    () => (debouncedSearchText.trim() ? filteredItems : rawItems),
    [debouncedSearchText, filteredItems, rawItems]
  )

  const parentMap = React.useMemo(() => {
    const map = new Map<string, string>()
    const traverse = (
      items: TreeViewDefaultItemModelProperties[],
      parentId?: string
    ) => {
      for (const item of items) {
        if (parentId) map.set(item.id, parentId)
        if (item.children) traverse(item.children, item.id)
      }
    }
    traverse(items)
    return map
  }, [items])

  React.useEffect(() => {
    if (
      !selectedItem ||
      selectedItem === 'default-group' ||
      selectedItem === 'default-subgroup'
    )
      return

    if (inputRef.current && document.activeElement === inputRef.current) return

    const parents: string[] = []
    let current = selectedItem
    while (parentMap.has(current)) {
      const p = parentMap.get(current)!
      parents.push(p)
      current = p
    }

    if (parents.length) {
      setExpandedItems((prev) => {
        const newSet = new Set(prev)
        let changed = false
        for (const p of parents) {
          if (!newSet.has(p)) {
            newSet.add(p)
            changed = true
          }
        }
        return changed ? Array.from(newSet) : prev
      })
    }

    let attempts = 0
    const maxAttempts = 20
    const intervalMs = 100
    let intervalId: NodeJS.Timeout | null = null

    const scrollIfNeeded = () => {
      const targetElement = document.querySelector(
        `.MuiTreeItem-root[data-id="${selectedItem}"]`
      ) as HTMLElement
      if (!targetElement) return false

      const scrollContainer = targetElement.closest(
        '.MuiRichTreeView-root'
      ) as HTMLElement
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect()
        const targetRect = targetElement.getBoundingClientRect()
        const isVisible =
          targetRect.top >= containerRect.top &&
          targetRect.bottom <= containerRect.bottom
        if (!isVisible) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      } else {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return true
    }

    const handler = () => {
      if (scrollIfNeeded()) {
        if (intervalId) clearInterval(intervalId)
        setTimeout(() => {
          apiRef.current?.focusItem(null, selectedItem)
        }, 150)
      } else if (attempts >= maxAttempts) {
        if (intervalId) clearInterval(intervalId)
      }
      attempts++
    }

    intervalId = setInterval(handler, intervalMs)
    const delay = parents.length ? 250 : 100
    setTimeout(() => {
      if (scrollIfNeeded()) {
        if (intervalId) clearInterval(intervalId)
        setTimeout(() => {
          apiRef.current?.focusItem(null, selectedItem)
        }, 150)
      }
    }, delay)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [selectedItem, parentMap, apiRef, debouncedSearchText])

  React.useEffect(() => {
    if (!isInitialized && items.length > 0) {
      if (expandedItems.length === 0 && !debouncedSearchText.trim()) {
        setExpandedItems(defaultExpandedItems)
      } else if (debouncedSearchText.trim()) {
        startTransition(() => {
          setExpandedItems(getAllItemIds(items))
        })
      }
      setIsInitialized(true)
    }
  }, [
    items,
    defaultExpandedItems,
    debouncedSearchText,
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
    if (isInitialized && debouncedSearchText.trim()) {
      startTransition(() => {
        setExpandedItems(getAllItemIds(items))
      })
    }
  }, [debouncedSearchText, items, isInitialized])

  const allItemIds = React.useMemo(() => getAllItemIds(items), [items])

  const disableStickyTemporarily = () => {
    if (stickyTimeoutRef.current !== null)
      clearTimeout(stickyTimeoutRef.current)
    setDisableStickyForSubgroups(true)
    stickyTimeoutRef.current = window.setTimeout(() => {
      setDisableStickyForSubgroups(false)
      stickyTimeoutRef.current = null
    }, 600)
  }

  const handleExpandAll = () => {
    disableStickyTemporarily()
    startTransition(() => {
      setExpandedItems(allItemIds)
    })
  }

  const handleCollapseAll = () => {
    disableStickyTemporarily()
    startTransition(() => {
      setExpandedItems(EMPTY_ARRAY)
    })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchText(e.target.value)

  const handleClearSearch = () => {
    setSearchText('')
    setDebouncedSearchText('')
    startTransition(() => {
      setExpandedItems(defaultExpandedItems)
    })
    inputRef.current?.focus()
  }

  const handleSelectedItemsChange = React.useCallback(
    (event: React.SyntheticEvent | null, itemIds: string | string[] | null) => {
      const target = event?.nativeEvent?.target as HTMLElement
      if (target?.closest?.('.MuiTreeItem-iconContainer')) return

      const id =
        itemIds === null
          ? null
          : typeof itemIds === 'string'
            ? itemIds
            : (itemIds[0] ?? null)
      if (id === 'default-group' || id === 'default-subgroup') return
      if (id === null) {
        void navigate(`/hierarchy`)
      } else if (id.startsWith('test')) {
        const testId = Number(id.split('-')[1])
        if (testId !== selectedTestId) {
          void navigate(`/hierarchy/tests/${testId}`)
        }
      } else if (id.startsWith('subgroup')) {
        const subgroupId = Number(id.split('-')[1])
        if (subgroupId !== selectedSubgroupId)
          void navigate(`/hierarchy/subgroups/${subgroupId}`)
      } else if (id.startsWith('group')) {
        const groupId = Number(id.split('-')[1])
        if (groupId !== selectedGroupId)
          void navigate(`/hierarchy/groups/${groupId}`)
      }
    },
    [selectedTestId, selectedSubgroupId, selectedGroupId, navigate]
  )

  const handleExpandedItemsChange = (
    event: React.SyntheticEvent | null,
    itemIds: string[]
  ) => {
    disableStickyTemporarily()
    startTransition(() => {
      setExpandedItems(itemIds)
    })
  }

  return (
    <Stack spacing={1.5} p={0} sx={{ height: '100%', overflow: 'hidden' }}>
      <TreeViewContainer disableStickyForSubgroups={disableStickyForSubgroups}>
        <ToolbarContainer>
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
          <SearchField
            inputRef={inputRef}
            size="small"
            placeholder="Поиск..."
            value={searchText}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: null,
              endAdornment: (
                <InputAdornment position="end" sx={{ gap: 0.5 }}>
                  {searchText && (
                    <IconButton
                      size="small"
                      onClick={handleClearSearch}
                      edge="end"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )}
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </ToolbarContainer>
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
      </TreeViewContainer>
    </Stack>
  )
}
