// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers'
import { BackupsGrid } from '../grids/resources/backups'
import { useBackups } from '~/hooks/resources'
// React
import * as React from 'react'
// Material UI
import BackupIcon from '@mui/icons-material/Backup'

export function BackupsScreen() {
  const { backups } = useBackups()

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'бэкапы',
        href: '/backups',
        Icon: BackupIcon
      }
    ],
    []
  )

  return (
    <LayoutScreenContainer title="бэкапы" breadcrumbsItems={breadcrumbsItems}>
      <BackupsGrid backups={backups} />
    </LayoutScreenContainer>
  )
}
