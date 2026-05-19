// Project
import { PdfViewer } from '~/components/document-content/pdf-viewer'
// React
import * as React from 'react'
// Material UI
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface PdfFileViewerProps {
  blob?: Blob | null
  fileName?: string
  isDarkMode?: boolean
}

export const PdfFileViewer: React.FC<PdfFileViewerProps> = ({ blob }) => {
  const [pdfData, setPdfData] = React.useState<ArrayBuffer | null>(null)

  React.useEffect(() => {
    let cancelled = false
    void (async () => {
      if (blob === null || blob === undefined) {
        setPdfData(null)
        return
      }
      const buffer = await blob.arrayBuffer()
      if (cancelled === false) {
        setPdfData(buffer)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [blob])

  return (
    <Box sx={{ width: '100%', minHeight: 520, height: '70vh' }}>
      {pdfData === null ? (
        <Typography sx={{ opacity: 0.72, textAlign: 'center', py: 5 }}>
          Нет PDF файла для просмотра
        </Typography>
      ) : (
        <PdfViewer
          data={pdfData}
          areas={[]}
          clickableAreas={false}
          withUpdateAreaButtons={false}
          withDeleteAreaButtons={false}
          withCaptureAreaButtons={false}
          withRenameAreaButtons={false}
          mode={{ type: 'DEFAULT' }}
          interactionMode="TEXT"
          showThumbnails
        />
      )}
    </Box>
  )
}
