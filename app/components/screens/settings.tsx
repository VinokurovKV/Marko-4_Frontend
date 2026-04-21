// Project
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import { LayoutScreenContainer } from '../containers'
import { usePopupPreviewVisibilitySettings } from '~/hooks/popup-preview-visibility'
// React
import * as React from 'react'
// Material UI
import Divider from '@mui/material/Divider'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Paper from '@mui/material/Paper'
import SettingsIcon from '@mui/icons-material/Settings'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export function SettingsScreen() {
  const { settings, setSetting } = usePopupPreviewVisibilitySettings()

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'настройки',
        href: '/settings',
        Icon: SettingsIcon
      }
    ],
    []
  )

  return (
    <LayoutScreenContainer
      title="настройки"
      breadcrumbsItems={breadcrumbsItems}
    >
      <Stack spacing={2.5} sx={{ width: '100%', maxWidth: '960px' }}>
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Отображать всплывающие окна для предпросмотра
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={0.5}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.commonTopology}
                  onChange={(_, checked) => {
                    setSetting('commonTopology', checked)
                  }}
                />
              }
              label="Общая топология"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.topology}
                  onChange={(_, checked) => {
                    setSetting('topology', checked)
                  }}
                />
              }
              label="Топология"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.roleRights}
                  onChange={(_, checked) => {
                    setSetting('roleRights', checked)
                  }}
                />
              }
              label="Права роли"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.testTemplate}
                  onChange={(_, checked) => {
                    setSetting('testTemplate', checked)
                  }}
                />
              }
              label="Шаблон теста"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={settings.subgroup}
                  onChange={(_, checked) => {
                    setSetting('subgroup', checked)
                  }}
                />
              }
              label="Подгруппа"
            />
          </Stack>
        </Paper>
      </Stack>
    </LayoutScreenContainer>
  )
}
