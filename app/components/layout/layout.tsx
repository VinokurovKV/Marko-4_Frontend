// Project
import { Background } from '../containers'
import { BrandLabel } from '../brand/brand-label'
import { Header } from './header/header'
import { InteractiveGuideProvider } from '../interactive-guide/guide-provider'
import { Sidebar } from './sidebar/sidebar'
// React
import * as React from 'react'
// Material UI
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'

const IS_DESKTOP_NAVIGATION_EXPANDED_DEFAULT = true
const IS_MOBILE_NAVIGATION_EXPANDED_DEFAULT = false
const IS_DESKTOP_NAVIGATION_EXPANDED_LS_KEY =
  'LAYOUT_IS_DESKTOP_NAVIGATION_EXPANDED'
const IS_MOBILE_NAVIGATION_EXPANDED_LS_KEY =
  'LAYOUT_IS_MOBILE_NAVIGATION_EXPANDED'
const TRUE = 'TRUE'
const FALSE = 'FALSE'

export interface LayoutProps {
  children: React.ReactNode
}

export function Layout(props: LayoutProps) {
  const theme = useTheme()

  const [isDesktopNavigationExpanded, setIsDesktopNavigationExpanded] =
    React.useState(
      (() => {
        const lsVal = localStorage?.getItem(
          IS_DESKTOP_NAVIGATION_EXPANDED_LS_KEY
        )
        return lsVal === TRUE
          ? true
          : lsVal === FALSE
            ? false
            : IS_DESKTOP_NAVIGATION_EXPANDED_DEFAULT
      })()
    )
  const [isMobileNavigationExpanded, setIsMobileNavigationExpanded] =
    React.useState(
      (() => {
        const lsVal = localStorage?.getItem(
          IS_MOBILE_NAVIGATION_EXPANDED_LS_KEY
        )
        return lsVal === TRUE
          ? true
          : lsVal === FALSE
            ? false
            : IS_MOBILE_NAVIGATION_EXPANDED_DEFAULT
      })()
    )

  const isOverMdViewport = useMediaQuery(theme.breakpoints.up('md'))

  const isNavigationExpanded = isOverMdViewport
    ? isDesktopNavigationExpanded
    : isMobileNavigationExpanded

  const setIsNavigationExpanded = React.useCallback(
    (newExpanded: boolean) => {
      if (isOverMdViewport) {
        setIsDesktopNavigationExpanded(newExpanded)
        localStorage.setItem(
          IS_DESKTOP_NAVIGATION_EXPANDED_LS_KEY,
          newExpanded ? TRUE : FALSE
        )
      } else {
        setIsMobileNavigationExpanded(newExpanded)
      }
      localStorage.setItem(
        isOverMdViewport
          ? IS_DESKTOP_NAVIGATION_EXPANDED_LS_KEY
          : IS_MOBILE_NAVIGATION_EXPANDED_LS_KEY,
        newExpanded ? TRUE : FALSE
      )
    },
    [
      isOverMdViewport,
      setIsDesktopNavigationExpanded,
      setIsMobileNavigationExpanded
    ]
  )

  const handleToggleHeaderMenu = React.useCallback(
    (isExpanded: boolean) => {
      setIsNavigationExpanded(isExpanded)
    },
    [setIsNavigationExpanded]
  )

  const layoutRef = React.useRef<HTMLDivElement>(null)
  const [interactiveGuidePortalElement, setInteractiveGuidePortalElement] =
    React.useState<HTMLDivElement | null>(null)

  return (
    <Background>
      <InteractiveGuideProvider portalElement={interactiveGuidePortalElement}>
        <Box
          ref={layoutRef}
          sx={{
            //position: 'relative',
            display: 'flex',
            overflow: 'hidden',
            height: '100%',
            width: '100%'
          }}
        >
          <Header
            logo={<BrandLabel />}
            menuIsOpen={isNavigationExpanded}
            onToggleMenu={handleToggleHeaderMenu}
          />
          <Sidebar
            expanded={isNavigationExpanded}
            setExpanded={setIsNavigationExpanded}
            container={layoutRef?.current ?? undefined}
          />
          <Box
            ref={setInteractiveGuidePortalElement}
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: (theme) => theme.zIndex.drawer + 2,
              '& > *': {
                pointerEvents: 'auto'
              }
            }}
          />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minWidth: 0
            }}
          >
            <Toolbar sx={{ displayPrint: 'none' }} />
            <Box
              component="main"
              data-guide-id="main-content"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                overflow: 'auto'
              }}
            >
              {props.children}
            </Box>
          </Box>
        </Box>
      </InteractiveGuideProvider>
    </Background>
  )
}
