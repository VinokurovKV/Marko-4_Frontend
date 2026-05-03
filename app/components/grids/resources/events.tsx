// Project
import type { EventType } from '@common/enums'
import { RoleHoverPreview } from '~/components/roles/role-hover-preview'
import { GridRefCell } from '../cells/grid-ref-cell'
import { usePopupPreviewVisibilitySettings } from '~/hooks/popup-preview-visibility'
import { localizationForEventType } from '~/localization'
import type { RolePrimary, SystemEvent, UserSecondary } from '~/types'
import { Grid } from '../grid'
import { useDateTimeCol } from '../cols/date'
import { useDialogs } from '~/providers/dialogs'
// React
import * as React from 'react'
// Material UI
import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import {
  type GridColDef,
  type GridRenderCellParams,
  type GridValidRowModel
} from '@mui/x-data-grid'
// Other
import capitalize from 'capitalize'
import { format } from 'date-fns'

export interface EventsGridProps {
  events: SystemEvent[]
  users: UserSecondary[] | null
  roles: RolePrimary[] | null
}

function formatEventType(eventType: string) {
  const localizedEventType = localizationForEventType.get(
    eventType as EventType
  )
  if (localizedEventType !== undefined) {
    return capitalize(localizedEventType, true)
  }
  return capitalize(eventType.replaceAll('_', ' ').toLowerCase(), true)
}

function formatEventTime(time: unknown) {
  if (time instanceof Date) {
    return format(time, 'HH:mm:ss dd.MM.yyyy')
  }
  if (typeof time === 'string') {
    const parsedTime = new Date(time)
    if (Number.isNaN(parsedTime.getTime()) === false) {
      return format(parsedTime, 'HH:mm:ss dd.MM.yyyy')
    }

    const [datePart, timePart] = time.split('/')
    const [hours, minutes, seconds = '00'] = (timePart ?? '').split(':')
    if (
      datePart !== undefined &&
      hours !== undefined &&
      minutes !== undefined &&
      hours !== '' &&
      minutes !== ''
    ) {
      return `${hours}:${minutes}:${seconds} ${datePart}`
    }
  }
  return ''
}

export function EventsGrid(props: EventsGridProps) {
  const theme = useTheme()
  const dialogs = useDialogs()
  const { settings } = usePopupPreviewVisibilitySettings()
  const rows: GridValidRowModel[] = props.events
  const timeCol = useDateTimeCol({
    field: 'time',
    headerName: 'Время',
    minWidth: 200,
    flex: 0.01
  })

  const userForId = React.useMemo(
    () => new Map((props.users ?? []).map((user) => [user.id, user])),
    [props.users]
  )
  const roleNameForId = React.useMemo(
    () => new Map((props.roles ?? []).map((role) => [role.id, role.name])),
    [props.roles]
  )

  const cols: GridColDef[] = React.useMemo(
    () => [
      {
        field: 'type',
        headerName: 'Событие',
        align: 'center',
        headerAlign: 'left',
        minWidth: 200,
        flex: 0.35,
        valueFormatter: (value) =>
          typeof value === 'string' ? formatEventType(value) : ''
      },
      {
        field: 'id',
        headerName: 'ID',
        type: 'number',
        headerAlign: 'left',
        minWidth: 70,
        flex: 0.01
      },
      {
        ...timeCol,
        valueFormatter: (value) => formatEventTime(value)
      },
      {
        field: 'initiatorLogin',
        headerName: 'Логин',
        minWidth: 160,
        flex: 0.2,
        valueGetter: (_value, row) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const initiatorId = row.initiatorId as number | null
          if (initiatorId === null) {
            return 'система'
          }
          return userForId.get(initiatorId)?.login ?? `[ID:${initiatorId}]`
        },
        renderCell: (params: GridRenderCellParams<any, string>) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const initiatorId = params.row.initiatorId as number | null
          if (initiatorId === null) {
            return params.value ?? 'система'
          }
          const initiator = userForId.get(initiatorId)
          if (initiator === undefined) {
            return (
              <Button
                onClick={(event) => {
                  event.stopPropagation()
                  void dialogs.alert(
                    'Пользователь был удалён, действие невозможно',
                    {
                      title: 'Переход недоступен',
                      okText: 'Скрыть'
                    }
                  )
                }}
                sx={{
                  width: '100%',
                  justifyContent: 'start',
                  textTransform: 'none',
                  color: theme.palette.text.primary,
                  ':hover': {
                    bgcolor:
                      theme.palette.mode === 'light'
                        ? 'rgb(239, 244, 251)'
                        : 'rgb(40, 47, 54)'
                  }
                }}
              >
                {params.value}
              </Button>
            )
          }
          return (
            <GridRefCell
              text={params.value}
              hrefPrefix="/users"
              hrefPath={initiatorId}
              header
              disableCapitalize
            />
          )
        }
      },
      {
        field: 'initiatorRole',
        headerName: 'Роль',
        minWidth: 180,
        flex: 0.3,
        valueGetter: (_value, row) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const initiatorId = row.initiatorId as number | null
          if (initiatorId === null) {
            return 'система'
          }
          const roleId = userForId.get(initiatorId)?.roleId
          return roleId !== undefined
            ? (roleNameForId.get(roleId) ?? 'Пользователь удалён')
            : 'Пользователь удалён'
        },
        renderCell: (params: GridRenderCellParams<any, string>) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const initiatorId = params.row.initiatorId as number | null
          if (initiatorId === null) {
            return params.value ?? 'система'
          }
          const roleId = userForId.get(initiatorId)?.roleId
          if (roleId === undefined) {
            return 'Пользователь удалён'
          }
          return (
            <GridRefCell
              text={params.value}
              hrefPrefix="/roles"
              hrefPath={roleId ?? -1}
              hoverPreview={
                settings.roleRights
                  ? {
                      renderContent: (active, onReadyChange) => (
                        <RoleHoverPreview
                          key={roleId}
                          roleId={roleId}
                          active={active}
                          text={params.value}
                          onReadyChange={onReadyChange}
                        />
                      )
                    }
                  : undefined
              }
            />
          )
        }
      }
    ],
    [dialogs, roleNameForId, settings.roleRights, theme, timeCol, userForId]
  )

  return (
    <Grid
      localSaveKey="EVENTS"
      cols={cols}
      rows={rows}
      navigationMode={false}
    />
  )
}
