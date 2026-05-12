// Other
import XMLViewer from 'react-xml-viewer'
import './xml-viewer.css'

export interface XmlFileViewerProps {
  fileName: string
  fileText: string
  isDarkMode?: boolean
}

const darkModeTheme = {
  attributeKeyColor: '#9CDCFE',
  attributeValueColor: '#CE9178',
  commentColor: '#6A9955',
  separatorColor: '#808080',
  delimiterColor: '#D4D4D4',
  keyColor: '#D4D4D4',
  tagColor: '#569CD6',
  textColor: '#D4D4D4'
}

const lightModeTheme = {
  attributeKeyColor: '#C80000',
  attributeValueColor: '#008080',
  commentColor: '#008000',
  separatorColor: '#333333',
  delimiterColor: '#000000',
  keyColor: '#000000',
  tagColor: '#C80000',
  textColor: '#000000'
}

export function XmlFileViewer({
  fileText,
  isDarkMode = false
}: XmlFileViewerProps) {
  return (
    <div
      className={`xml-viewer-wrapper ${isDarkMode ? 'dark-mode' : 'light-mode'}`}
    >
      <XMLViewer
        xml={fileText}
        collapsible={true}
        showLineNumbers={true}
        theme={isDarkMode ? darkModeTheme : lightModeTheme}
      />
    </div>
  )
}
