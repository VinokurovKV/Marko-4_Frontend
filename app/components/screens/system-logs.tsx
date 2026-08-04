// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers'
import { SystemLogsGrid } from '../grids/resources/system-logs'
import { readSystemLogs } from '~/readers'
import type { SystemLog } from '~/types'
// React
import * as React from 'react'
// Material UI
import StorageIcon from '@mui/icons-material/Storage'
import Typography from '@mui/material/Typography'

export function SystemLogsScreen() {
  const [systemLogs, setSystemLogs] = React.useState<SystemLog[] | null>(null)
  const [systemLogsLoadingFailed, setSystemLogsLoadingFailed] =
    React.useState(false)

  const reloadSystemLogs = React.useCallback(async () => {
    const logs = await readSystemLogs()
    setSystemLogs(logs)
    setSystemLogsLoadingFailed(logs === null)
  }, [])

  React.useEffect(() => {
    void reloadSystemLogs()
  }, [reloadSystemLogs])

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'системные логи',
        href: '/system-logs',
        Icon: StorageIcon
      }
    ],
    []
  )

  return (
    <LayoutScreenContainer
      title="системные логи"
      breadcrumbsItems={breadcrumbsItems}
    >
      {systemLogs !== null ? (
        <SystemLogsGrid logs={systemLogs} />
      ) : systemLogsLoadingFailed ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
          Не удалось загрузить системные логи
        </Typography>
      ) : (
        <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
          Загрузка системных логов...
        </Typography>
      )}
    </LayoutScreenContainer>
  )
}
