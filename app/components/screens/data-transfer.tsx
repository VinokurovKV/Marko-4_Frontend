// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers'
import { ProjButton } from '../buttons/button'
import { ImportDataFormDialog } from '../forms/resources/import-data'
import { useNotifier } from '~/providers/notifier'
// React
import * as React from 'react'
// Material UI
import ImportExportIcon from '@mui/icons-material/ImportExport'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'

export function DataTransferScreen() {
  const notifier = useNotifier()
  const [importModeIsActive, setImportModeIsActive] = React.useState(false)

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'данные системы',
        href: '/data-transfer',
        Icon: ImportExportIcon
      }
    ],
    []
  )

  return (
    <>
      <LayoutScreenContainer
        title="загрузка и выгрузка данных системы"
        breadcrumbsItems={breadcrumbsItems}
      >
        <Paper
          variant="outlined"
          sx={{ p: 2.5, width: '100%', maxWidth: '420px' }}
        >
          <Stack spacing={1.5}>
            <ProjButton
              variant="contained"
              onClick={() => {
                setImportModeIsActive(true)
              }}
            >
              импорт
            </ProjButton>
            <ProjButton
              variant="outlined"
              onClick={() => {
                notifier.showInfo(
                  'форма экспорта будет добавлена следующим шагом'
                )
              }}
            >
              экспорт
            </ProjButton>
          </Stack>
        </Paper>
      </LayoutScreenContainer>
      <ImportDataFormDialog
        importModeIsActive={importModeIsActive}
        setImportModeIsActive={setImportModeIsActive}
        onSuccessImportData={() => {
          setImportModeIsActive(false)
        }}
        onCancelClick={() => {
          setImportModeIsActive(false)
        }}
      />
    </>
  )
}
