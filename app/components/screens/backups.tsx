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
        title: 'резервные копии',
        href: '/backups',
        Icon: BackupIcon
      }
    ],
    []
  )

  return (
    <LayoutScreenContainer
      title="резервные копии"
      breadcrumbsItems={breadcrumbsItems}
    >
      <BackupsGrid backups={backups} />
    </LayoutScreenContainer>
  )
}
