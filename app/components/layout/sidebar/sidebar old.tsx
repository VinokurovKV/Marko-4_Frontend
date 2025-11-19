// // TODO: delete this file
// // Project
// import { LAYOUT_CONFIG } from '../config'
// import {
//   getDrawerSxTransitionMixin,
//   getDrawerWidthTransitionMixin
// } from '~/mixins/drawer'
// import { type SidebarMeta, SidebarMetaContext } from './sidebar-meta-context'
// import { SidebarPageItem } from './sidebar-page-item'
// import { SidebarHeaderItem } from './sidebar-header-item'
// import { SidebarDividerItem } from './sidebar-divider-item'
// // React router
// import { matchPath, useLocation } from 'react-router'
// // React
// import * as React from 'react'
// // Material UI
// import PersonIcon from '@mui/icons-material/Person'
// import BarChartIcon from '@mui/icons-material/BarChart'
// import DescriptionIcon from '@mui/icons-material/Description'
// import LayersIcon from '@mui/icons-material/Layers'
// import { useTheme } from '@mui/material/styles'
// import useMediaQuery from '@mui/material/useMediaQuery'
// import Box from '@mui/material/Box'
// import Drawer from '@mui/material/Drawer'
// import List from '@mui/material/List'
// import Toolbar from '@mui/material/Toolbar'

// export interface SidebarProps {
//   expanded?: boolean
//   setExpanded: (expanded: boolean) => void
//   disableCollapsibleSidebar?: boolean
//   container?: Element
// }

// export function Sidebar({
//   expanded = true,
//   setExpanded,
//   disableCollapsibleSidebar = false,
//   container
// }: SidebarProps) {
//   const theme = useTheme()

//   const { pathname } = useLocation()

//   const [expandedItemIds, setExpandedItemIds] = React.useState<string[]>([])

//   const isOverSmViewport = useMediaQuery(theme.breakpoints.up('sm'))
//   const isOverMdViewport = useMediaQuery(theme.breakpoints.up('md'))

//   const [isFullyExpanded, setIsFullyExpanded] = React.useState(expanded)
//   const [isFullyCollapsed, setIsFullyCollapsed] = React.useState(!expanded)

//   React.useEffect(() => {
//     if (expanded) {
//       const drawerWidthTransitionTimeout = setTimeout(() => {
//         setIsFullyExpanded(true)
//       }, theme.transitions.duration.enteringScreen)

//       return () => clearTimeout(drawerWidthTransitionTimeout)
//     }

//     setIsFullyExpanded(false)

//     return () => {}
//   }, [expanded, theme.transitions.duration.enteringScreen])

//   React.useEffect(() => {
//     if (!expanded) {
//       const drawerWidthTransitionTimeout = setTimeout(() => {
//         setIsFullyCollapsed(true)
//       }, theme.transitions.duration.leavingScreen)

//       return () => clearTimeout(drawerWidthTransitionTimeout)
//     }

//     setIsFullyCollapsed(false)

//     return () => {}
//   }, [expanded, theme.transitions.duration.leavingScreen])

//   const mini = !disableCollapsibleSidebar && !expanded

//   const handleSetSidebarExpanded = React.useCallback(
//     (newExpanded: boolean) => () => {
//       setExpanded(newExpanded)
//     },
//     [setExpanded]
//   )

//   const handlePageItemClick = React.useCallback(
//     (itemId: string, hasNestedNavigation: boolean) => {
//       if (hasNestedNavigation && !mini) {
//         setExpandedItemIds((previousValue) =>
//           previousValue.includes(itemId)
//             ? previousValue.filter(
//                 (previousValueItemId) => previousValueItemId !== itemId
//               )
//             : [...previousValue, itemId]
//         )
//       } else if (!isOverSmViewport && !hasNestedNavigation) {
//         setExpanded(false)
//       }
//     },
//     [mini, setExpanded, isOverSmViewport]
//   )

//   const hasDrawerTransitions =
//     isOverSmViewport && (!disableCollapsibleSidebar || isOverMdViewport)

//   const getDrawerContent = React.useCallback(
//     (viewport: 'phone' | 'tablet' | 'desktop') => (
//       <React.Fragment>
//         <Toolbar />
//         <Box
//           component="nav"
//           sx={{
//             height: '100%',
//             display: 'flex',
//             flexDirection: 'column',
//             justifyContent: 'space-between',
//             overflow: 'auto',
//             scrollbarGutter: mini ? 'stable' : 'auto',
//             overflowX: 'hidden',
//             pt: !mini ? 0 : 2,
//             ...(hasDrawerTransitions
//               ? getDrawerSxTransitionMixin(isFullyExpanded, 'padding')
//               : {})
//           }}
//         >
//           <List
//             dense
//             sx={{
//               p: mini ? 0 : 0.5,
//               mb: 4,
//               width: mini ? LAYOUT_CONFIG.MINI_DRAWER_WIDTH : 'auto'
//             }}
//           >
//             <SidebarHeaderItem>Main items</SidebarHeaderItem>
//             <SidebarPageItem
//               id="employees"
//               title="Employees"
//               icon={<PersonIcon />}
//               href="/employees"
//               selected={
//                 !!matchPath('/employees/*', pathname) || pathname === '/'
//               }
//             />
//             <SidebarDividerItem />
//             <SidebarHeaderItem>Example items</SidebarHeaderItem>
//             <SidebarPageItem
//               id="reports"
//               title="Reports"
//               icon={<BarChartIcon />}
//               href="/reports"
//               selected={!!matchPath('/reports', pathname)}
//               defaultExpanded={!!matchPath('/reports', pathname)}
//               expanded={expandedItemIds.includes('reports')}
//               nestedNavigation={
//                 <List
//                   dense
//                   sx={{
//                     p: 0,
//                     my: 1,
//                     pl: mini ? 0 : 1,
//                     minWidth: 240
//                   }}
//                 >
//                   <SidebarPageItem
//                     id="sales"
//                     title="Sales"
//                     icon={<DescriptionIcon />}
//                     href="/reports/sales"
//                     selected={!!matchPath('/reports/sales', pathname)}
//                   />
//                   <SidebarPageItem
//                     id="traffic"
//                     title="Traffic"
//                     icon={<DescriptionIcon />}
//                     href="/reports/traffic"
//                     selected={!!matchPath('/reports/traffic', pathname)}
//                   />
//                 </List>
//               }
//             />
//             <SidebarPageItem
//               id="integrations"
//               title="Integrations"
//               icon={<LayersIcon />}
//               href="/integrations"
//               selected={!!matchPath('/integrations', pathname)}
//             />
//           </List>
//         </Box>
//       </React.Fragment>
//     ),
//     [mini, hasDrawerTransitions, isFullyExpanded, expandedItemIds, pathname]
//   )

//   const getDrawerSharedSx = React.useCallback(
//     (isTemporary: boolean) => {
//       const drawerWidth = mini
//         ? LAYOUT_CONFIG.MINI_DRAWER_WIDTH
//         : LAYOUT_CONFIG.DRAWER_WIDTH

//       return {
//         displayPrint: 'none',
//         width: drawerWidth,
//         flexShrink: 0,
//         ...getDrawerWidthTransitionMixin(expanded),
//         ...(isTemporary ? { position: 'absolute' } : {}),
//         [`& .MuiDrawer-paper`]: {
//           position: 'absolute',
//           width: drawerWidth,
//           boxSizing: 'border-box',
//           backgroundImage: 'none',
//           ...getDrawerWidthTransitionMixin(expanded)
//         }
//       }
//     },
//     [expanded, mini]
//   )

//   const sidebarMeta: SidebarMeta = React.useMemo(() => {
//     return {
//       onPageItemClick: handlePageItemClick,
//       mini,
//       fullyExpanded: isFullyExpanded,
//       fullyCollapsed: isFullyCollapsed,
//       hasDrawerTransitions
//     }
//   }, [
//     handlePageItemClick,
//     mini,
//     isFullyExpanded,
//     isFullyCollapsed,
//     hasDrawerTransitions
//   ])

//   return (
//     <SidebarMetaContext.Provider value={sidebarMeta}>
//       <Drawer
//         container={container}
//         variant="temporary"
//         open={expanded}
//         onClose={handleSetSidebarExpanded(false)}
//         ModalProps={{
//           keepMounted: true // Better open performance on mobile.
//         }}
//         sx={{
//           display: {
//             xs: 'block',
//             sm: disableCollapsibleSidebar ? 'block' : 'none',
//             md: 'none'
//           },
//           ...getDrawerSharedSx(true)
//         }}
//       >
//         {getDrawerContent('phone')}
//       </Drawer>
//       <Drawer
//         variant="permanent"
//         sx={{
//           display: {
//             xs: 'none',
//             sm: disableCollapsibleSidebar ? 'none' : 'block',
//             md: 'none'
//           },
//           ...getDrawerSharedSx(false)
//         }}
//       >
//         {getDrawerContent('tablet')}
//       </Drawer>
//       <Drawer
//         variant="permanent"
//         sx={{
//           display: { xs: 'none', md: 'block' },
//           ...getDrawerSharedSx(false)
//         }}
//       >
//         {getDrawerContent('desktop')}
//       </Drawer>
//     </SidebarMetaContext.Provider>
//   )
// }
