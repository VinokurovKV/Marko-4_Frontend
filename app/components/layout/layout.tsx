// React
import * as React from 'react'

export interface LayoutProps {
  children: React.ReactNode
}

export function Layout(props: LayoutProps) {
  return (
    <>
      <header>Header</header>
      <nav>Navigation</nav>
      <main>{props.children}</main>
      <footer>Footer</footer>
    </>
  )
}
