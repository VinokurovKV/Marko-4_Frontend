// Project
import { LogTypeEnum } from '@common/enums'
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers'
import { ApiLogsGrid } from '../grids/resources/api-logs'
import { StorageLogsGrid } from '../grids/resources/storage-logs'
import { readApiSystemLogs, readStorageSystemLogs } from '~/readers'
import type { ApiSystemLog, StorageSystemLog } from '~/types'
// React
import * as React from 'react'
// Material UI
import StorageIcon from '@mui/icons-material/Storage'
import Typography from '@mui/material/Typography'

type SystemLogsScreenMode = 'API' | 'STORAGE'

interface SystemLogsScreenProps {
  mode: SystemLogsScreenMode
}

const screenConfigByMode: Record<
  SystemLogsScreenMode,
  {
    title: string
    href: string
    logType: LogTypeEnum.API | LogTypeEnum.STORAGE
    loadingText: string
    errorText: string
  }
> = {
  API: {
    title: 'логи API',
    href: '/api-logs',
    logType: LogTypeEnum.API,
    loadingText: 'Загрузка логов API...',
    errorText: 'Не удалось загрузить логи API'
  },
  STORAGE: {
    title: 'логи хранилища',
    href: '/storage-logs',
    logType: LogTypeEnum.STORAGE,
    loadingText: 'Загрузка логов хранилища...',
    errorText: 'Не удалось загрузить логи хранилища'
  }
}

export function SystemLogsScreen({ mode }: SystemLogsScreenProps) {
  const config = screenConfigByMode[mode]
  const [systemLogs, setSystemLogs] = React.useState<
    ApiSystemLog[] | StorageSystemLog[] | null
  >(null)
  const [systemLogsLoadingFailed, setSystemLogsLoadingFailed] =
    React.useState(false)

  const reloadSystemLogs = React.useCallback(async () => {
    const logs =
      mode === 'API' ? await readApiSystemLogs() : await readStorageSystemLogs()
    setSystemLogs(logs)
    setSystemLogsLoadingFailed(logs === null)
  }, [mode])

  React.useEffect(() => {
    void reloadSystemLogs()
  }, [reloadSystemLogs])

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: config.title,
        href: config.href,
        Icon: StorageIcon
      }
    ],
    [config.href, config.title]
  )

  return (
    <LayoutScreenContainer
      title={config.title}
      breadcrumbsItems={breadcrumbsItems}
    >
      {systemLogs !== null ? (
        config.logType === LogTypeEnum.API ? (
          <ApiLogsGrid logs={systemLogs as ApiSystemLog[]} />
        ) : (
          <StorageLogsGrid logs={systemLogs as StorageSystemLog[]} />
        )
      ) : systemLogsLoadingFailed ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
          {config.errorText}
        </Typography>
      ) : (
        <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
          {config.loadingText}
        </Typography>
      )}
    </LayoutScreenContainer>
  )
}
