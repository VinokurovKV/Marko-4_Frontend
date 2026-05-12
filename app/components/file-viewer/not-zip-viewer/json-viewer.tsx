// Project
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'
// Other
import { JsonView, allExpanded } from 'react-json-view-lite'
import 'react-json-view-lite/dist/index.css'

export interface JsonFileViewerProps {
  fileName: string
  fileText: string
  isDarkMode?: boolean
}

const injectStyles = () => {
  if (
    typeof document !== 'undefined' &&
    !document.getElementById('json-viewer-custom-styles')
  ) {
    const style = document.createElement('style')
    style.id = 'json-viewer-custom-styles'
    style.textContent = `
      /* ===== ОБЩИЕ СТИЛИ ===== */
      .jv-container {
        padding: 16px !important;
        border-radius: 8px !important;
        font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace !important;
        font-size: 13px !important;
        line-height: 1.5 !important;
      }
      
      /* Отступы */
      .jv-label {
        margin-right: 8px !important;
      }
      
      .jv-string-value {
        margin-left: 4px !important;
      }
      
      .jv-number-value {
        margin-left: 4px !important;
      }
      
      .jv-boolean-value {
        margin-left: 4px !important;
      }
      
      .jv-null-value {
        margin-left: 4px !important;
      }
      
      .jv-punctuation {
        margin-left: 2px !important;
        margin-right: 2px !important;
      }
      
      /* ===== КЛЮЧЕВОЙ МОМЕНТ: КАСТОМИЗАЦИЯ ТРЕУГОЛЬНИКОВ ЧЕРЕЗ ::after ===== */
      .jv-collapse-icon,
      .jv-expand-icon {
        cursor: pointer !important;
        display: inline-block !important;
        width: 20px !important;
        height: 20px !important;
        margin-right: 6px !important;
        text-align: center !important;
        line-height: 18px !important;
        font-size: 16px !important;
        font-weight: bold !important;
        transition: all 0.2s ease !important;
      }
      
      /* Сами треугольники через псевдоэлементы */
      .jv-collapse-icon::after {
        content: "▾" !important;
      }
      
      .jv-expand-icon::after {
        content: "▸" !important;
      }
      
      /* Ховер-эффект */
      .jv-collapse-icon:hover,
      .jv-expand-icon:hover {
        transform: scale(1.15) !important;
      }
      
      .jv-collapse-icon:hover::after,
      .jv-expand-icon:hover::after {
        filter: brightness(1.2) !important;
      }
      
      /* ===== СВЕТЛАЯ ТЕМА ===== */
      .light-theme .jv-container {
        background-color: #ffffff !important;
      }
      
      .light-theme .jv-label {
        color: #0033cc !important;
        font-weight: 500 !important;
      }
      
      .light-theme .jv-string-value {
        color: #0b5e00 !important;
      }
      
      .light-theme .jv-number-value {
        color: #d14c00 !important;
      }
      
      .light-theme .jv-boolean-value {
        color: #a626a4 !important;
      }
      
      .light-theme .jv-null-value {
        color: #8c8c8c !important;
      }
      
      .light-theme .jv-punctuation {
        color: #585858 !important;
      }
      
      .light-theme .jv-collapse-icon::after,
      .light-theme .jv-expand-icon::after {
        color: #0033cc !important;
      }
      
      /* ===== ТЕМНАЯ ТЕМА ===== */
      .dark-theme .jv-container {
        background-color: #1e1e1e !important;
      }
      
      .dark-theme .jv-label {
        color: #569cd6 !important;
        font-weight: 500 !important;
      }
      
      .dark-theme .jv-string-value {
        color: #ce9178 !important;
      }
      
      .dark-theme .jv-number-value {
        color: #b5cea8 !important;
      }
      
      .dark-theme .jv-boolean-value {
        color: #c586c0 !important;
      }
      
      .dark-theme .jv-null-value {
        color: #4ec9b0 !important;
      }
      
      .dark-theme .jv-punctuation {
        color: #d4d4d4 !important;
      }
      
      .dark-theme .jv-collapse-icon::after,
      .dark-theme .jv-expand-icon::after {
        color: #569cd6 !important;
      }
      
      .dark-theme .jv-collapse-icon:hover::after,
      .dark-theme .jv-expand-icon:hover::after {
        color: #7abae8 !important;
      }
    `
    document.head.appendChild(style)
  }
}

// Имена CSS-классов для передачи в JsonView
const customStyleClasses = {
  container: 'jv-container',
  label: 'jv-label',
  stringValue: 'jv-string-value',
  numberValue: 'jv-number-value',
  booleanValue: 'jv-boolean-value',
  nullValue: 'jv-null-value',
  punctuation: 'jv-punctuation',
  collapseIcon: 'jv-collapse-icon', // <-- это имя класса для иконки сворачивания
  expandIcon: 'jv-expand-icon' // <-- это имя класса для иконки разворачивания
}

export function JsonFileViewer({
  fileName,
  fileText,
  isDarkMode = false
}: JsonFileViewerProps) {
  const notifier = useNotifier()

  React.useEffect(() => {
    injectStyles()
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const jsonParsed = React.useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(fileText)
    } catch (error) {
      notifier.showError(
        error,
        `ошибка при парсинге JSON для файла '${fileName}'`
      )
      return null
    }
  }, [fileText, fileName, notifier])

  if (jsonParsed === null) {
    return (
      <div
        style={{
          padding: '16px',
          backgroundColor: isDarkMode ? '#2d2d2d' : '#fff3f3',
          color: isDarkMode ? '#ffa0a0' : '#d32f2f',
          borderRadius: '8px',
          border: `1px solid ${isDarkMode ? '#ff6b6b' : '#ffcdd2'}`,
          fontFamily: 'monospace'
        }}
      >
        ❌ Не удалось распарсить JSON файл: {fileName}
      </div>
    )
  }

  return (
    <div className={isDarkMode ? 'dark-theme' : 'light-theme'}>
      <JsonView
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data={jsonParsed}
        shouldExpandNode={allExpanded}
        style={customStyleClasses}
      />
    </div>
  )
}
