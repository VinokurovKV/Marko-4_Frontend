// Project
import type { SideNavigationConfig } from '~/config/side-navigation-config/common'
import { SIDE_NAVIGATION_CONFIG } from '~/config/side-navigation-config/data'
import { useMeta } from '~/providers/meta'
import { LAYOUT_CONFIG } from '../config'
import {
  getDrawerSxTransitionMixin,
  getDrawerWidthTransitionMixin
} from '~/mixins/drawer'
import { type SidebarMeta, SidebarMetaContext } from './sidebar-meta-context'
import { SidebarPageItem } from './sidebar-page-item'
import { SidebarHeaderItem } from './sidebar-header-item'
import { SidebarDividerItem } from './sidebar-divider-item'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import Toolbar from '@mui/material/Toolbar'
// Other
import capitalize from 'capitalize'

export interface SidebarProps {
  expanded?: boolean
  setExpanded: (expanded: boolean) => void
  disableCollapsibleSidebar?: boolean
  container?: Element
}

export function Sidebar({
  expanded = true,
  setExpanded,
  disableCollapsibleSidebar = false,
  container
}: SidebarProps) {
  const meta = useMeta()
  const rightsSet = React.useMemo(
    () =>
      meta.status !== 'AUTHENTICATED' ? new Set([]) : meta.selfMeta.rightsSet,
    [meta]
  )

  const restrictedSideNavigationConfig: SideNavigationConfig =
    React.useMemo(() => {
      return SIDE_NAVIGATION_CONFIG.filter((block) =>
        (block.requiredRights ?? []).every((right) => rightsSet.has(right))
      )
        .map((block) => {
          return {
            ...block,
            nested: block.nested
              .filter((item) =>
                (item.requiredRights ?? []).every((right) =>
                  rightsSet.has(right)
                )
              )
              .map((item) => {
                return 'nested' in item === false
                  ? { ...item }
                  : {
                      ...item,
                      nested: item.nested.filter((item) =>
                        (item.requiredRights ?? []).every((right) =>
                          rightsSet.has(right)
                        )
                      )
                    }
              })
              .filter(
                (item) => 'nested' in item === false || item.nested.length > 0
              )
          }
        })
        .filter((block) => block.nested.length > 0)
    }, [rightsSet])

  const theme = useTheme()

  const { pathname } = useLocation()

  const [expandedItemIds, setExpandedItemIds] = React.useState<string[]>([])

  const isOverSmViewport = useMediaQuery(theme.breakpoints.up('sm'))
  const isOverMdViewport = useMediaQuery(theme.breakpoints.up('md'))

  const [isFullyExpanded, setIsFullyExpanded] = React.useState(expanded)
  const [isFullyCollapsed, setIsFullyCollapsed] = React.useState(!expanded)

  React.useEffect(() => {
    if (expanded) {
      const drawerWidthTransitionTimeout = setTimeout(() => {
        setIsFullyExpanded(true)
      }, theme.transitions.duration.enteringScreen)

      return () => clearTimeout(drawerWidthTransitionTimeout)
    }

    setIsFullyExpanded(false)

    return () => {}
  }, [expanded, theme.transitions.duration.enteringScreen])

  React.useEffect(() => {
    if (!expanded) {
      const drawerWidthTransitionTimeout = setTimeout(() => {
        setIsFullyCollapsed(true)
      }, theme.transitions.duration.leavingScreen)

      return () => clearTimeout(drawerWidthTransitionTimeout)
    }

    setIsFullyCollapsed(false)

    return () => {}
  }, [expanded, theme.transitions.duration.leavingScreen])

  const mini = !disableCollapsibleSidebar && !expanded

  const handleSetSidebarExpanded = React.useCallback(
    (newExpanded: boolean) => () => {
      setExpanded(newExpanded)
    },
    [setExpanded]
  )

  const handlePageItemClick = React.useCallback(
    (itemId: string, hasNestedNavigation: boolean) => {
      if (hasNestedNavigation && !mini) {
        setExpandedItemIds((previousValue) =>
          previousValue.includes(itemId)
            ? previousValue.filter(
                (previousValueItemId) => previousValueItemId !== itemId
              )
            : [...previousValue, itemId]
        )
      } else if (!isOverSmViewport && !hasNestedNavigation) {
        setExpanded(false)
      }
    },
    [mini, setExpanded, isOverSmViewport]
  )

  const hasDrawerTransitions =
    isOverSmViewport && (!disableCollapsibleSidebar || isOverMdViewport)

  const getDrawerContent = React.useCallback(
    () => (
      <React.Fragment>
        <Toolbar />
        <Box
          component="nav"
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            scrollbarGutter: mini ? 'stable' : 'auto',
            overflowX: 'hidden',
            pt: !mini ? 0 : 2,
            ...(hasDrawerTransitions
              ? getDrawerSxTransitionMixin(isFullyExpanded, 'padding')
              : {})
          }}
        >
          <List
            dense
            sx={{
              p: mini ? 0 : 0.5,
              mb: 4,
              width: mini ? LAYOUT_CONFIG.MINI_DRAWER_WIDTH : 'auto'
            }}
          >
            {restrictedSideNavigationConfig
              .filter((block) =>
                (block.requiredRights ?? []).every((right) =>
                  rightsSet.has(right)
                )
              )
              .map((block, blockIndex) => (
                <React.Fragment key={block.title}>
                  {blockIndex !== 0 ? <SidebarDividerItem /> : null}
                  <SidebarHeaderItem>
                    {capitalize(block.title, true)}
                  </SidebarHeaderItem>
                  {block.nested
                    .filter((item) =>
                      (item.requiredRights ?? []).every((right) =>
                        rightsSet.has(right)
                      )
                    )
                    .map((item, itemIndex, filteredItems) => (
                      <React.Fragment key={item.id}>
                        <SidebarPageItem
                          id={item.id}
                          title={capitalize(item.title, true)}
                          icon={<item.Icon />}
                          href={'href' in item ? item.href : ''}
                          selected={
                            'href' in item
                              ? !!matchPath(`${item.href}/*`, pathname)
                              : item.nested.some(
                                  (item) =>
                                    !!matchPath(`${item.href}/*`, pathname)
                                )
                          }
                          expanded={expandedItemIds.includes(item.id)}
                          nestedNavigation={
                            'nested' in item ? (
                              <List
                                dense
                                sx={{
                                  p: 0,
                                  my: 1,
                                  pl: mini ? 0 : 1,
                                  minWidth: LAYOUT_CONFIG.DRAWER_WIDTH
                                }}
                              >
                                <React.Fragment>
                                  {item.nested
                                    .filter((item) =>
                                      (item.requiredRights ?? []).every(
                                        (right) => rightsSet.has(right)
                                      )
                                    )
                                    .map((item) => (
                                      <SidebarPageItem
                                        key={item.id}
                                        id={item.id}
                                        title={capitalize(item.title, true)}
                                        icon={<item.Icon />}
                                        href={item.href}
                                        selected={
                                          !!matchPath(
                                            `${item.href}/*`,
                                            pathname
                                          )
                                        }
                                      />
                                    ))}
                                </React.Fragment>
                              </List>
                            ) : undefined
                          }
                        />
                        {item.dividerAfter === true &&
                        itemIndex < filteredItems.length - 1 ? (
                          <SidebarDividerItem />
                        ) : null}
                      </React.Fragment>
                    ))}
                </React.Fragment>
              ))}
          </List>
        </Box>
      </React.Fragment>
    ),
    [
      restrictedSideNavigationConfig,
      mini,
      hasDrawerTransitions,
      isFullyExpanded,
      expandedItemIds,
      pathname
    ]
  )

  const getDrawerSharedSx = React.useCallback(
    (isTemporary: boolean) => {
      const drawerWidth = mini
        ? LAYOUT_CONFIG.MINI_DRAWER_WIDTH
        : LAYOUT_CONFIG.DRAWER_WIDTH

      return {
        displayPrint: 'none',
        width: drawerWidth,
        flexShrink: 0,
        ...getDrawerWidthTransitionMixin(expanded),
        ...(isTemporary ? { position: 'absolute' } : {}),
        [`& .MuiDrawer-paper`]: {
          position: 'absolute',
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundImage: 'none',
          ...getDrawerWidthTransitionMixin(expanded)
        }
      }
    },
    [expanded, mini]
  )

  const sidebarMeta: SidebarMeta = React.useMemo(() => {
    return {
      onPageItemClick: handlePageItemClick,
      mini,
      fullyExpanded: isFullyExpanded,
      fullyCollapsed: isFullyCollapsed,
      hasDrawerTransitions
    }
  }, [
    handlePageItemClick,
    mini,
    isFullyExpanded,
    isFullyCollapsed,
    hasDrawerTransitions
  ])

  return (
    <SidebarMetaContext.Provider value={sidebarMeta}>
      <Drawer
        container={container}
        variant="temporary"
        open={expanded}
        onClose={handleSetSidebarExpanded(false)}
        ModalProps={{
          keepMounted: true // Better open performance on mobile.
        }}
        sx={{
          display: {
            xs: 'block',
            sm: disableCollapsibleSidebar ? 'block' : 'none',
            md: 'none'
          },
          ...getDrawerSharedSx(true)
        }}
      >
        {getDrawerContent()}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: {
            xs: 'none',
            sm: disableCollapsibleSidebar ? 'none' : 'block',
            md: 'none'
          },
          ...getDrawerSharedSx(false)
        }}
      >
        {getDrawerContent()}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          ...getDrawerSharedSx(false)
        }}
      >
        {getDrawerContent()}
      </Drawer>
    </SidebarMetaContext.Provider>
  )
}
