// Material UI
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

export interface TextFileViewerProps {
  fileName: string
  fileText: string
  isDarkMode?: boolean
}

export function TextFileViewer({
  fileText,
  isDarkMode = false
}: TextFileViewerProps) {
  const lines = fileText.split('\n')
  const lineNumbers = lines.map((_, index) => index + 1)

  return (
    <Box sx={{ display: 'flex', position: 'relative' }}>
      {/* Блок с номерами строк - не выделяется при копировании */}
      <Box
        component="pre"
        sx={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          msUserSelect: 'none',
          flexShrink: 0,
          margin: 0,
          padding: '0 16px 0 0',
          textAlign: 'right',
          color: isDarkMode ? '#888' : '#999',
          fontSize: 'inherit',
          fontFamily: 'monospace',
          lineHeight: 'inherit',
          backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f5f5',
          pointerEvents: 'none'
        }}
      >
        {lineNumbers.join('\n')}
      </Box>

      {/* Блок с основным текстом */}
      <Typography
        component="pre"
        sx={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          margin: 0,
          padding: 0,
          flex: 1,
          fontFamily: 'monospace',
          fontSize: 'inherit',
          lineHeight: 'inherit'
        }}
      >
        {fileText}
      </Typography>
    </Box>
  )
}
