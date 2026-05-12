// Project
import { useNotifier } from '~/providers/notifier'
import { HorizontalTwoPartsContainer } from '../../containers'
import { FileNavigator } from './file-navigator'
import { FileViewer } from './file-viewer'
// React
import * as React from 'react'
// Material UI
import Box from '@mui/material/Box'
// Other
import * as JSZip from 'jszip'

export interface ZipFileViewerProps {
  fileName: string
  fileBlob: Blob
}

export function ZipFileViewer({
  fileName: fileNameLocal,
  fileBlob
}: ZipFileViewerProps) {
  const notifier = useNotifier()

  const [zip, setZip] = React.useState<JSZip | null>(null)
  const [fileNames, setFileNames] = React.useState<string[] | null>(null)
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(
    null
  )

  React.useEffect(() => {
    void (async () => {
      try {
        const zip = (await JSZip.loadAsync(fileBlob)) as JSZip
        setZip(zip)
        setFileNames(
          Object.keys(zip.files).filter(
            (fileName) => fileName.startsWith('__MACOSX') === false
          )
        )
      } catch (error) {
        notifier.showError(
          error,
          `ошибка при разархивировании ZIP-файла '${fileNameLocal}'`
        )
        throw error
      }
    })()
  }, [fileNameLocal, fileBlob])

  const handleFileSelect = React.useCallback((fileName: string | null) => {
    setSelectedFileName(fileName)
  }, [])

  return (
    <HorizontalTwoPartsContainer proportions="ONE_TWO">
      <Box sx={{ height: '60vh', overflow: 'auto' }}>
        {fileNames !== null ? (
          <FileNavigator
            fileNames={fileNames}
            onFileSelect={handleFileSelect}
            zipFileName={fileNameLocal}
            zipBlob={fileBlob}
          />
        ) : null}
      </Box>
      <Box sx={{ height: '60vh', overflow: 'auto' }}>
        {zip !== null && selectedFileName !== null ? (
          <FileViewer zip={zip} fileName={selectedFileName} />
        ) : null}
      </Box>
    </HorizontalTwoPartsContainer>
  )
}
