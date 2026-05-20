// React
import * as React from 'react'
// Material UI
import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { useTheme } from '@mui/material/styles'

export interface TabViewerProps<TabVal> {
  tabs: {
    label: string
    value: TabVal
  }[]
  onChange?: (event: React.SyntheticEvent, value: TabVal) => void
  value: TabVal
}

export function TabViewer<TabVal>({
  tabs,
  onChange,
  value
}: TabViewerProps<TabVal>) {
  const theme = useTheme()

  return (
    <Box
      marginBottom={1}
      border={`1px solid ${
        theme.palette.mode === 'light'
          ? theme.palette.grey[300]
          : theme.palette.grey.A700
      }`}
      borderRadius="5px"
      p={0}
      sx={{
        backgroundColor:
          theme.palette.mode === 'light'
            ? 'white'
            : theme.palette.background.default
      }}
    >
      <Tabs
        value={value}
        onChange={onChange}
        sx={{
          minHeight: 32,
          '& .MuiTabs-flexContainer': {
            minHeight: 32
          }
        }}
      >
        {tabs.map((tab) => (
          <Tab
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            key={`${tab.value}`}
            label={tab.label}
            value={tab.value}
            sx={{
              minHeight: 32,
              py: 0.5
            }}
          />
        ))}
      </Tabs>
    </Box>
  )
}
