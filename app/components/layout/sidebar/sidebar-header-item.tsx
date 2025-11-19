// Project
import { LAYOUT_CONFIG } from '../config'
import { getDrawerSxTransitionMixin } from '~/mixins/drawer'
import { useSidebarMeta } from './sidebar-meta-context'
// React
import * as React from 'react'
// Material UI
import ListSubheader from '@mui/material/ListSubheader'

export interface SidebarHeaderItemProps {
  children?: React.ReactNode
}

export function SidebarHeaderItem({ children }: SidebarHeaderItemProps) {
  const sidebarMeta = useSidebarMeta()

  const {
    mini = false,
    fullyExpanded = true,
    hasDrawerTransitions
  } = sidebarMeta

  return (
    <ListSubheader
      sx={{
        fontSize: 12,
        fontWeight: '600',
        height: mini ? 0 : 36,
        ...(hasDrawerTransitions
          ? getDrawerSxTransitionMixin(fullyExpanded, 'height')
          : {}),
        px: 1.5,
        py: 0,
        minWidth: LAYOUT_CONFIG.DRAWER_WIDTH,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        zIndex: 2
      }}
    >
      {children}
    </ListSubheader>
  )
}
