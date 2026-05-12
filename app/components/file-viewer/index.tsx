// Project
import { ProjButton } from '~/components/buttons/button'
import { NotZipFileViewer } from './not-zip-viewer'
import { ZipFileViewer } from './zip-viewer'
// React
import * as React from 'react'
// Material UI
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

export interface FileViewerProps {
  isActive: boolean
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>
  fileTitle: string
  fileName: string
  fileBlob: Blob | null
}

export function FileViewer({
  isActive,
  setIsActive,
  fileTitle,
  fileName,
  fileBlob
}: FileViewerProps) {
  const ext = React.useMemo(
    () =>
      fileName !== null
        ? fileName.includes('.')
          ? fileName.split('.').at(-1)!
          : null
        : null,
    [fileName]
  )

  const cancel = React.useCallback(() => {
    setIsActive(false)
  }, [setIsActive])

  return (
    <Dialog scroll="paper" onClose={cancel} open={isActive} maxWidth={'md'}>
      {fileTitle !== null ? (
        <DialogTitle>
          <Typography
            color="primary"
            sx={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          >
            {capitalize(fileTitle, true)}
          </Typography>
        </DialogTitle>
      ) : null}
      <DialogContent dividers={true} sx={{ width: '70vw' }}>
        {fileBlob !== null ? (
          ext === 'zip' ? (
            <ZipFileViewer fileName={fileName} fileBlob={fileBlob} />
          ) : (
            <NotZipFileViewer fileName={fileName} fileBlob={fileBlob} />
          )
        ) : null}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center' }}>
        <Stack direction="row" spacing={2} justifyContent="center">
          <ProjButton variant="contained" onClick={cancel}>
            Закрыть
          </ProjButton>
        </Stack>
      </DialogActions>
    </Dialog>
  )
}
