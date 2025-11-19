// Project
import * as React from 'react'

export interface SidebarMeta {
  onPageItemClick: (id: string, hasNestedNavigation: boolean) => void
  mini: boolean
  fullyExpanded: boolean
  fullyCollapsed: boolean
  hasDrawerTransitions: boolean
}

export const SidebarMetaContext = React.createContext<SidebarMeta | null>(null)

export const useSidebarMeta = () => {
  const sidebarMeta = React.useContext(SidebarMetaContext)
  if (sidebarMeta === null) {
    throw new Error('Sidebar context was used without a provider')
  }
  return sidebarMeta
}
