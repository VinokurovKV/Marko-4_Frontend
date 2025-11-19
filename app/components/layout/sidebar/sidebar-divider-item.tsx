// Project
import { getDrawerSxTransitionMixin } from '~/mixins/drawer'
import { useSidebarMeta } from './sidebar-meta-context'
// Material UI
import Divider from '@mui/material/Divider'

export function SidebarDividerItem() {
  const sidebarMeta = useSidebarMeta()

  const { fullyExpanded = true, hasDrawerTransitions } = sidebarMeta

  return (
    <li>
      <Divider
        sx={{
          borderBottomWidth: 1,
          my: 1,
          mx: -0.5,
          ...(hasDrawerTransitions
            ? getDrawerSxTransitionMixin(fullyExpanded, 'margin')
            : {})
        }}
      />
    </li>
  )
}
