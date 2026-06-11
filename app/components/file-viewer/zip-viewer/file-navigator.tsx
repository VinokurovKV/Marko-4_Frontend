// Project
import { downloadFileFromBlob } from '~/utilities'
import { useChangeDetector } from '~/hooks/change-detector'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'
// Material UI
import DownloadIcon from '@mui/icons-material/Download'
import { alpha, styled } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import { useRichTreeViewApiRef } from '@mui/x-tree-view/hooks'
import type { TreeViewDefaultItemModelProperties } from '@mui/x-tree-view/models'
import { RichTreeView } from '@mui/x-tree-view/RichTreeView'
import { TreeItem, treeItemClasses } from '@mui/x-tree-view/TreeItem'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'

type FileItem = {
  name: string
  path: string
  parent?: FileItem
} & (
  | {
      type: 'FILE'
    }
  | {
      type: 'FOLDER'
      items: FileItem[]
    }
)

function calculateFileItems(fileNames: string[]): {
  allFileItems: FileItem[]
  fileItems: FileItem[]
  fileItemForPath: Map<string, FileItem>
} {
  const itemForPath = new Map<string, FileItem>()
  const items: FileItem[] = []
  for (const fileName of fileNames) {
    const isFolder = fileName.endsWith('/')
    const item: FileItem = isFolder
      ? {
          name: fileName.split('/').at(-2)!,
          path: fileName,
          type: 'FOLDER',
          items: []
        }
      : {
          name: fileName.split('/').at(-1)!,
          path: fileName,
          type: 'FILE'
        }
    itemForPath.set(fileName, item)
    items.push(item)
  }
  for (const item of items) {
    if (item.type === 'FILE') {
      const splitted = item.path.split('/')
      if (splitted.length > 1) {
        const parentPath = `${splitted.slice(0, -1).join('/')}/`
        const parentItem = itemForPath.get(parentPath)
        if (parentItem === undefined || parentItem.type !== 'FOLDER') {
          throw new Error()
        }
        parentItem.items.push(item)
        item.parent = parentItem
      }
    } else {
      const splitted = item.path.split('/')
      if (splitted.length > 2) {
        const parentPath = `${splitted.slice(0, -2).join('/')}/`
        const parentItem = itemForPath.get(parentPath)
        if (parentItem === undefined || parentItem.type !== 'FOLDER') {
          throw new Error()
        }
        parentItem.items.push(item)
        item.parent = parentItem
      }
    }
  }
  //
  const allFileItems: FileItem[] = items
  const fileItems: FileItem[] = items
    .filter((item) => item.parent === undefined)
    .toSorted((item_1, item_2) => item_1.name.localeCompare(item_2.name))
  function processItem(item: FileItem) {
    if (item.type === 'FOLDER') {
      item.items = item.items.toSorted((item_1, item_2) =>
        item_1.name.localeCompare(item_2.name)
      )
    }
  }
  for (const item of fileItems) {
    processItem(item)
  }
  const fileItemForPath = new Map(items.map((item) => [item.path, item]))
  return { allFileItems, fileItems, fileItemForPath }
}

const RichTreeViewStyled = styled(RichTreeView)(({ theme }) => [
  {
    '&': {
      padding: '5px',
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
    }
  }
])

export interface FileNavigatorProps {
  fileNames: string[]
  onFileSelect?: (fileName: string | null) => void
  zipFileName: string
  zipBlob: Blob
}

export function FileNavigator({
  fileNames,
  onFileSelect,
  zipFileName,
  zipBlob
}: FileNavigatorProps) {
  const notifier = useNotifier()
  const apiRef = useRichTreeViewApiRef()

  const {
    allFileItems,
    fileItems,
    fileItemForPath: fileItemForId
  } = React.useMemo(() => calculateFileItems(fileNames), [fileNames])

  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(
    null
  )

  useChangeDetector({
    detectedObjects: [fileNames],
    otherDependencies: [onFileSelect],
    onChange: ([oldFileNames]) => {
      if (JSON.stringify(fileNames) !== JSON.stringify(oldFileNames)) {
        setSelectedItemId(null)
        onFileSelect?.(null)
      }
    }
  })

  React.useEffect(() => {
    if (selectedItemId === null) {
      function findItemId(fileItem: FileItem): string | null {
        if (fileItem.type === 'FILE') {
          return fileItem.path
        } else {
          for (const item of fileItem.items) {
            const resultItemId = findItemId(item)
            if (resultItemId !== null) {
              return resultItemId
            }
          }
          return null
        }
      }
      for (const item of fileItems) {
        const resultItemId = findItemId(item)
        if (resultItemId !== null) {
          setSelectedItemId(resultItemId)
          onFileSelect?.(resultItemId)
          return
        }
      }
    }
  }, [fileItems, selectedItemId])

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
        setSelectedItemId(null)
        onFileSelect?.(null)
      } else {
        const item = fileItemForId.get(itemId)!
        if (item.type === 'FILE') {
          setSelectedItemId(itemId)
          onFileSelect?.(itemId)
        }
      }
    },
    [onFileSelect, fileItemForId]
  )

  const items: TreeViewDefaultItemModelProperties[] = React.useMemo(() => {
    function getTreeViewBaseItemForFileItem(
      fileItem: FileItem
    ): TreeViewDefaultItemModelProperties {
      return {
        id: fileItem.path,
        label: fileItem.name,
        children:
          fileItem.type === 'FILE'
            ? undefined
            : fileItem.items.map((item) => getTreeViewBaseItemForFileItem(item))
      }
    }
    return fileItems.map((item) => getTreeViewBaseItemForFileItem(item))
  }, [fileItems])

  const defaultExpandedItemIds = React.useMemo(
    () =>
      allFileItems
        .filter((item) => item.type === 'FOLDER')
        .map((item) => item.path),
    [allFileItems]
  )

  const [expandedItemIds, setExpandedItemIds] = React.useState<string[]>(
    defaultExpandedItemIds
  )

  const handleExpandedItemsChange = (
    event: React.SyntheticEvent | null,
    itemIds: string[]
  ) => {
    setExpandedItemIds(itemIds)
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
      padding: theme.spacing(0.4, 1.25),
      margin: theme.spacing(0.0, 0),
      [`& .${treeItemClasses.label}`]: {
        fontSize: '0.8rem',
        fontWeight: 500
      }
    },
    [`& .${treeItemClasses.groupTransition}`]: {
      marginLeft: 15,
      paddingLeft: 10, // 18,
      borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`
    },
    ...theme.applyStyles('light', {
      color: theme.palette.grey[800]
    })
  }))

  const handleDownloadClick = React.useCallback(() => {
    if (zipBlob !== null) {
      try {
        downloadFileFromBlob(zipBlob, zipFileName)
      } catch (error) {
        notifier.showError(error, `ошибка при чтении файла '${zipFileName}'`)
        throw error
      }
    }
  }, [zipFileName, zipBlob])

  return (
    <Stack spacing={1.5} p={0} sx={{ position: 'relative', height: '100%' }}>
      <RichTreeViewStyled
        apiRef={apiRef}
        items={items}
        disabledItemsFocusable={true}
        expansionTrigger="content"
        selectedItems={selectedItemId}
        onSelectedItemsChange={handleSelectedItemsChange}
        expandedItems={expandedItemIds}
        onExpandedItemsChange={handleExpandedItemsChange}
        slots={{ item: CustomTreeItem }}
        sx={{ height: '100%', overflow: 'auto' }}
      />
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={0.0}
        sx={{
          position: 'absolute',
          left: '0px',
          bottom: '0px'
        }}
      >
        <Tooltip title="Скачать ZIP-архив">
          <IconButton size="medium" onClick={handleDownloadClick}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  )
}
