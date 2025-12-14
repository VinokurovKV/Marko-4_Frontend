// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  LayoutScreenContainer,
  HorizontalTwoPartsContainer
} from '../containers'
import { type DevicesGridProps, DevicesGrid } from '../grids/resources/devices'
// React router
import { matchPath, useLocation } from 'react-router'
// React
import * as React from 'react'
// Material UI
import ComputerIcon from '@mui/icons-material/Computer'

export interface DevicesScreenProps
  extends Omit<
    DevicesGridProps,
    'navigationMode' | 'navigationModeSelectedRowId'
  > {
  children: React.ReactNode
}

export function DevicesScreen({ children, ...props }: DevicesScreenProps) {
  const { pathname } = useLocation()
  const match = matchPath('/devices/:deviceId?', pathname)
  const withDevice = match?.params.deviceId !== undefined
  const deviceId = React.useMemo(() => {
    const parsed =
      match?.params.deviceId !== undefined
        ? parseInt(match.params.deviceId)
        : null
    return parsed === null || isNaN(parsed) ? null : parsed
  }, [match])

  const deviceCode = React.useMemo(
    () => props.devices.find((device) => device.id === deviceId)?.code ?? null,
    [props.devices, deviceId]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      ...[
        {
          title: 'устройства',
          href: '/devices',
          Icon: ComputerIcon
        }
      ],
      ...(withDevice
        ? [
            {
              title:
                deviceCode !== null
                  ? deviceCode
                  : deviceId !== null
                    ? `[ID:${deviceId}]`
                    : '???',
              href: deviceId !== null ? `/devices/${deviceId}` : undefined
            }
          ]
        : [])
    ],
    [deviceId, deviceCode]
  )
  return (
    <LayoutScreenContainer
      title="устройства"
      breadcrumbsItems={breadcrumbsItems}
    >
      <HorizontalTwoPartsContainer
        proportions={withDevice ? 'ONE_TWO' : 'ONE_ZERO'}
      >
        <DevicesGrid
          key={`${withDevice}`}
          {...props}
          navigationMode={withDevice}
          navigationModeSelectedRowId={
            withDevice ? (deviceId ?? undefined) : undefined
          }
        />
        {children}
      </HorizontalTwoPartsContainer>
    </LayoutScreenContainer>
  )
}
