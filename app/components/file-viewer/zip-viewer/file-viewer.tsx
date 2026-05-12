// Project
import { useNotifier } from '~/providers/notifier'
import { NotZipFileViewer } from '../not-zip-viewer'
// React
import * as React from 'react'
// Other
import 'react-json-view-lite/dist/index.css'
import * as JSZip from 'jszip'

export interface FileViewerProps {
  zip: JSZip
  fileName: string
}

export function FileViewer({ zip, fileName }: FileViewerProps) {
  const notifier = useNotifier()

  const [blob, setBlob] = React.useState<Blob | null>(null)
  const [fileNameLocal, setFileNameLocal] = React.useState<string | null>(null)

  React.useEffect(() => {
    void (async () => {
      try {
        const blob = await zip.file(fileName)!.async('blob')
        const fileNameLocal = fileName.split('/').at(-1)!
        setBlob(blob)
        setFileNameLocal(fileNameLocal)
      } catch (error) {
        notifier.showError(error, `ошибка при чтении файла '${fileNameLocal}'`)
        throw error
      }
    })()
  }, [zip, fileName])

  return blob !== null && fileNameLocal !== null ? (
    <NotZipFileViewer fileName={fileNameLocal} fileBlob={blob} />
  ) : null
}
