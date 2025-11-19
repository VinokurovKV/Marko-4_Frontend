// Project
import { Background } from '../containers/background'
import { BrandLabel } from '../brand/brand-label'
import { Header } from './header'
import { Sidebar } from './sidebar/sidebar'
// React
import * as React from 'react'
// Material UI
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'

export interface LayoutProps {
  children: React.ReactNode
}

export function Layout(props: LayoutProps) {
  const theme = useTheme()

  const [isDesktopNavigationExpanded, setIsDesktopNavigationExpanded] =
    React.useState(true)
  const [isMobileNavigationExpanded, setIsMobileNavigationExpanded] =
    React.useState(false)

  const isOverMdViewport = useMediaQuery(theme.breakpoints.up('md'))

  const isNavigationExpanded = isOverMdViewport
    ? isDesktopNavigationExpanded
    : isMobileNavigationExpanded

  const setIsNavigationExpanded = React.useCallback(
    (newExpanded: boolean) => {
      if (isOverMdViewport) {
        setIsDesktopNavigationExpanded(newExpanded)
      } else {
        setIsMobileNavigationExpanded(newExpanded)
      }
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

  return (
    <Background>
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
    </Background>
  )
}
