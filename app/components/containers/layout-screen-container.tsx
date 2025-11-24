// Project
import { type ProjBreadcrumbsProps, ProjBreadcrumbs } from '../breadcrumbs'
// React
import * as React from 'react'
// Material UI
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Other
import capitalize from 'capitalize'

export interface LayoutScreenContainerProps {
  title: string
  breadcrumbsItems: ProjBreadcrumbsProps['items']
  children: React.ReactNode
}

export function LayoutScreenContainer(props: LayoutScreenContainerProps) {
  return (
    <Stack spacing={1.5} p={4} sx={{ height: '100%' }}>
      <ProjBreadcrumbs items={props.breadcrumbsItems} />
      <Typography
        variant="h5"
        sx={{
          fontWeight: 'bold'
        }}
      >
        {capitalize(props.title)}
      </Typography>
      {props.children}
    </Stack>
  )
}
