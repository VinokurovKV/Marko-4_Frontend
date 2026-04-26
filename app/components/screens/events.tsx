// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import { type EventsGridProps, EventsGrid } from '../grids/resources/events'
// React
import * as React from 'react'
// Material UI
import HistoryIcon from '@mui/icons-material/History'

export type EventsScreenProps = EventsGridProps

export function EventsScreen(props: EventsScreenProps) {
  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'события',
        href: '/events',
        Icon: HistoryIcon
      }
    ],
    []
  )

  return (
    <LayoutScreenContainer title="события" breadcrumbsItems={breadcrumbsItems}>
      <HorizontalTwoPartsContainer proportions="ONE_ZERO">
        <EventsGrid {...props} />
        {null}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
