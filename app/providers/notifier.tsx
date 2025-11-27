// Project
import {
  ServerConnectorError,
  ServerConnectorBadRequestError,
  ServerConnectorConflictError,
  ServerConnectorForbiddenError,
  ServerConnectorIseError,
  ServerConnectorNotFoundError,
  ServerConnectorUnauthorizedError
} from '~/server-connector/error'
// React
import * as React from 'react'
// Material UI
import CloseIcon from '@mui/icons-material/Close'
import Alert from '@mui/material/Alert'
import Badge from '@mui/material/Badge'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import type { SnackbarCloseReason } from '@mui/material/Snackbar'
import Snackbar from '@mui/material/Snackbar'
import SnackbarContent from '@mui/material/SnackbarContent'
import type { CloseReason } from '@mui/material/SpeedDial'
import useSlotProps from '@mui/utils/useSlotProps'
// Other
import capitalize from 'capitalize'

const SHORT_DURATION = 5 * 1000
const MIDDLE_DURATION = 20 * 1000
const LONG_DURATION = 60 * 1000

interface ShowNotificationOptions {
  key?: string
  severity?: 'info' | 'warning' | 'error' | 'success'
  autoHideDuration?: number | 'SHORT' | 'MIDDLE' | 'LONG' | 'INFINITE'
  actionText?: React.ReactNode
  onAction?: () => void
}

interface Notifier {
  show: (message: React.ReactNode, options?: ShowNotificationOptions) => string
  showSuccess: (message: string) => void
  showInfo: (message: string) => void
  showWarning: (message: string) => void
  showError: (error: any, prefix?: string) => void
  close: (notificationKey: string) => void
}

const NotifierContext = React.createContext<Notifier | null>(null)

export const useNotifier = () => {
  const notifier = React.useContext(NotifierContext)
  if (notifier === null) {
    throw new Error('Notifier context was used without a provider')
  }
  return notifier
}

interface NotifierProps {
  children?: React.ReactNode
}

const NotifierPropsContext = React.createContext<NotifierProps | null>(null)

interface NotificationProps {
  notificationKey: string
  badge: string | null
  open: boolean
  message: React.ReactNode
  options: ShowNotificationOptions
}

function Notification({
  notificationKey,
  open,
  message,
  options,
  badge
}: NotificationProps) {
  const notifier = useNotifier()
  const { close } = notifier

  const { severity, actionText, onAction, autoHideDuration } = options

  const handleClose = React.useCallback(
    (event: unknown, reason?: CloseReason | SnackbarCloseReason) => {
      if (reason === 'clickaway') {
        return
      }
      close(notificationKey)
    },
    [notificationKey, close]
  )

  const action = (
    <>
      {onAction ? (
        <Button color="inherit" size="small" onClick={onAction}>
          {(typeof actionText === 'string'
            ? capitalize(actionText, true)
            : actionText) ?? 'Выполнить'}
        </Button>
      ) : null}
      <IconButton
        size="small"
        title="Закрыть"
        color="inherit"
        onClick={handleClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </>
  )

  const props = React.useContext(NotifierPropsContext)

  const preparedAutoHideDuration = React.useMemo(() => {
    return typeof autoHideDuration === 'string'
      ? {
          SHORT: SHORT_DURATION,
          MIDDLE: MIDDLE_DURATION,
          LONG: LONG_DURATION,
          INFINITE: undefined
        }[autoHideDuration]
      : autoHideDuration
  }, [autoHideDuration])

  const snackbarSlotProps = useSlotProps({
    elementType: Snackbar,
    ownerState: props,
    externalSlotProps: {},
    additionalProps: {
      open,
      autoHideDuration: preparedAutoHideDuration,
      onClose: handleClose,
      action
    }
  })

  return (
    <Snackbar key={notificationKey} {...snackbarSlotProps}>
      <Badge badgeContent={badge} color="primary" sx={{ width: '100%' }}>
        {severity ? (
          <Alert severity={severity} sx={{ width: '100%' }} action={action}>
            {message}
          </Alert>
        ) : (
          <SnackbarContent message={message} action={action} />
        )}
      </Badge>
    </Snackbar>
  )
}

interface NotificationQueueEntry {
  notificationKey: string
  options: ShowNotificationOptions
  open: boolean
  message: React.ReactNode
}

interface NotificationsState {
  queue: NotificationQueueEntry[]
}

interface NotificationsProps {
  state: NotificationsState
}

function Notifications({ state }: NotificationsProps) {
  const currentNotification = state.queue[0] ?? null

  return currentNotification ? (
    <Notification
      {...currentNotification}
      badge={state.queue.length > 1 ? String(state.queue.length) : null}
    />
  ) : null
}

interface NotifierProviderProps {
  children?: React.ReactNode
}

let nextId = 0
const generateId = () => {
  const id = nextId
  nextId += 1
  return id
}

export function NotifierProvider(props: NotifierProviderProps) {
  const { children } = props

  const [state, setState] = React.useState<NotificationsState>({ queue: [] })

  const show = React.useCallback<Notifier['show']>((message, options = {}) => {
    const notificationKey =
      options.key ?? `::toolpad-internal::notification::${generateId()}`
    setState((prev) => {
      if (prev.queue.some((n) => n.notificationKey === notificationKey)) {
        // deduplicate by key
        return prev
      }
      return {
        ...prev,
        queue: [
          ...prev.queue,
          {
            message:
              typeof message === 'string' ? capitalize(message, true) : message,
            options,
            notificationKey,
            open: true
          }
        ]
      }
    })
    return notificationKey
  }, [])

  const showSuccess = React.useCallback<Notifier['showSuccess']>(
    (message) => {
      show(message, {
        severity: 'success',
        autoHideDuration: 'SHORT'
      })
    },
    [show]
  )

  const showInfo = React.useCallback<Notifier['showInfo']>(
    (message) => {
      show(message, {
        severity: 'info',
        autoHideDuration: 'MIDDLE'
      })
    },
    [show]
  )

  const showWarning = React.useCallback<Notifier['showWarning']>(
    (message) => {
      show(message, {
        severity: 'warning',
        autoHideDuration: 'MIDDLE'
      })
    },
    [show]
  )

  const showError = React.useCallback<Notifier['showError']>(
    (error, prefix) => {
      const message =
        typeof error === 'string'
          ? error
          : (() => {
              if (error instanceof ServerConnectorError) {
                if (error instanceof ServerConnectorBadRequestError) {
                  return 'некорректный запрос'
                }
                if (error instanceof ServerConnectorConflictError) {
                  return 'конфликт на сервере'
                }
                if (error instanceof ServerConnectorForbiddenError) {
                  return 'недостаточно прав для выполнения действия'
                }
                if (error instanceof ServerConnectorIseError) {
                  return 'внутренняя ошибка сервера'
                }
                if (error instanceof ServerConnectorNotFoundError) {
                  return 'запрашиваемый ресурс не найден'
                }
                if (error instanceof ServerConnectorUnauthorizedError) {
                  return 'пользователь не авторизован'
                }
                return 'ошибка при запросе на сервер'
              }
              return 'ошибка'
            })()
      show((prefix ? `${prefix}: ` : '') + message, {
        severity: 'error'
      })
      if (
        typeof error !== 'string' &&
        error instanceof ServerConnectorError === false
      ) {
        throw error
      }
    },
    [show]
  )

  const close = React.useCallback<Notifier['close']>((key) => {
    setState((prev) => ({
      ...prev,
      queue: prev.queue.filter((n) => n.notificationKey !== key)
    }))
  }, [])

  const contextValue = React.useMemo(
    () => ({ show, showSuccess, showInfo, showWarning, showError, close }),
    [show, showSuccess, showInfo, showWarning, showError, close]
  )

  return (
    <NotifierPropsContext.Provider value={props}>
      <NotifierContext.Provider value={contextValue}>
        {children}
        <Notifications state={state} />
      </NotifierContext.Provider>
    </NotifierPropsContext.Provider>
  )
}
