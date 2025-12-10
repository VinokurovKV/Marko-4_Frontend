// React
import * as React from 'react'
// Other
import markdownit from 'markdown-it'
import parse from 'html-react-parser'

export interface MarkdownViewProps {
  text: string
}

export function MarkdownView(props: MarkdownViewProps) {
  const textWithMarkdown = React.useMemo(() => {
    const md = markdownit({ breaks: true })
    return md.render(props.text)
  }, [props.text])
  return <div>{parse(textWithMarkdown)}</div>
}
