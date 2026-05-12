// Project
import { MarkdownView } from '~/components/markdown-view'

export interface MarkdownFileViewerProps {
  fileName: string
  fileText: string
  isDarkMode?: boolean
}

export function MarkdownFileViewer({ fileText }: MarkdownFileViewerProps) {
  return <MarkdownView text={fileText} />
}
