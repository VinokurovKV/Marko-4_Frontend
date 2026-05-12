// React
import * as React from 'react'
// Other
import SyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs'

export interface CodeFileViewerProps {
  fileName: string
  fileText: string
  language: 'python' | 'typescript'
  isDarkMode?: boolean
}

export function CodeFileViewer({
  fileText,
  language,
  isDarkMode = false
}: CodeFileViewerProps) {
  const [showLineNumbers, setShowLineNumbers] = React.useState<boolean>(() => {
    const saved = localStorage.getItem('python-file-viewer-show-line-numbers')
    return saved !== null ? saved === 'true' : true
  })

  React.useEffect(() => {
    localStorage.setItem(
      'python-file-viewer-show-line-numbers',
      showLineNumbers.toString()
    )
  }, [showLineNumbers])

  const toggleLineNumbers = () => {
    setShowLineNumbers((prev) => !prev)
  }

  return (
    <div>
      <button
        onClick={toggleLineNumbers}
        style={{
          position: 'absolute',
          bottom: '72px',
          right: '32px',
          padding: '6px 12px',
          fontSize: '12px',
          backgroundColor: isDarkMode ? '#404040' : '#e0e0e0',
          color: isDarkMode ? '#fff' : '#000',
          border: '1px solid #000',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 10,
          opacity: 0.8,
          fontWeight: '500',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.8'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
      >
        {showLineNumbers ? 'Скрыть номера строк' : 'Показать номера строк'}
      </button>

      <SyntaxHighlighter
        language={language}
        showLineNumbers={showLineNumbers}
        wrapLines={true}
        lineNumberStyle={{
          display: 'inline-block',
          minWidth: '3em',
          paddingRight: '1em',
          textAlign: 'right',
          userSelect: 'none',
          backgroundColor: isDarkMode
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(0,0,0,0.02)',
          borderRight: isDarkMode ? '1px solid #404040' : '1px solid #e0e0e0',
          marginRight: '1em'
        }}
        codeTagProps={{
          style: {
            display: 'block',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }
        }}
        style={isDarkMode ? vs2015 : docco}
        customStyle={{
          padding: showLineNumbers ? '12px 0 12px 12px' : '12px'
        }}
      >
        {fileText}
      </SyntaxHighlighter>
    </div>
  )
}
