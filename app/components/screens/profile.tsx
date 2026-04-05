// Project
import type { RolePrimary, UserTertiary } from '~/types'
import { useMeta } from '~/providers/meta'
import { localizationForRight } from '~/localization'
import { type ProjBreadcrumbsProps } from '../breadcrumbs'
import {
  HorizontalTwoPartsContainer,
  LayoutScreenContainer
} from '../containers'
import { ProjButton } from '../buttons/button'
import { UpdateSelfFormDialog } from '../forms/profile/update-self'
import { UpdateSelfPassFormDialog } from '../forms/profile/update-self-pass'
import {
  ColumnViewer,
  ColumnViewerBlock,
  ColumnViewerChipsBlock,
  ColumnViewerItem,
  ColumnViewerText
} from '../single-resource-viewers/common'
// React
import * as React from 'react'
// Material UI
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import EditIcon from '@mui/icons-material/Edit'
import LockResetIcon from '@mui/icons-material/LockReset'
import Paper from '@mui/material/Paper'
import PersonIcon from '@mui/icons-material/Person'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export interface ProfileScreenProps {
  userId: number | null
  role: RolePrimary | null
  user: UserTertiary | null
}

export function ProfileScreen({ userId, role, user }: ProfileScreenProps) {
  const meta = useMeta()

  const rights = React.useMemo(
    () => (meta.status === 'AUTHENTICATED' ? meta.selfMeta.rights : []),
    [meta]
  )

  const rightsSet = React.useMemo(
    () =>
      meta.status === 'AUTHENTICATED' ? meta.selfMeta.rightsSet : new Set([]),
    [meta]
  )

  const canReadProfile =
    rightsSet.has('READ_SELF') || rightsSet.has('READ_USER')
  const canReadRole = rightsSet.has('READ_ROLE')
  const canEditProfile =
    rightsSet.has('UPDATE_SELF') || rightsSet.has('UPDATE_USER')
  const canChangePassword =
    rightsSet.has('UPDATE_SELF_PASS') || rightsSet.has('UPDATE_USER_PASS')

  const login =
    meta.status === 'AUTHENTICATED'
      ? meta.selfMeta.login
      : (user?.login ?? undefined)

  const fullName = React.useMemo(() => {
    const parts = [user?.surname, user?.forename, user?.patronymic].filter(
      (item): item is string => !!item
    )
    return parts.length > 0 ? parts.join(' ') : undefined
  }, [user])

  const summaryTitle = React.useMemo(
    () => fullName ?? login ?? 'Профиль пользователя',
    [fullName, login]
  )

  const summarySubtitle = React.useMemo(() => {
    if (fullName !== undefined && login !== undefined) {
      return `@${login}`
    }
    return 'Личный профиль'
  }, [fullName, login])

  const roleValue = React.useMemo(() => {
    if (role !== null) {
      return role.name
    }
    if (canReadRole) {
      return user?.roleId !== undefined ? 'не удалось загрузить' : 'не указана'
    }
    return 'недоступна'
  }, [role, canReadRole, user])

  const profileFacts = React.useMemo(
    () => [
      {
        label: 'роль',
        value: roleValue
      },
      {
        label: 'телефон',
        value: canReadProfile ? (user?.phone ?? 'не указан') : 'недоступен'
      },
      {
        label: 'e-mail',
        value: canReadProfile ? (user?.email ?? 'не указан') : 'недоступен'
      }
    ],
    [roleValue, canReadProfile, user]
  )

  const breadcrumbsItems: ProjBreadcrumbsProps['items'] = React.useMemo(
    () => [
      {
        title: 'профиль',
        href: '/profile',
        Icon: PersonIcon
      }
    ],
    []
  )

  const [editDialogIsActive, setEditDialogIsActive] = React.useState(false)
  const [passDialogIsActive, setPassDialogIsActive] = React.useState(false)
  const [rightsDialogIsActive, setRightsDialogIsActive] = React.useState(false)

  const compactActionButtonSx = React.useMemo(
    () => ({
      justifyContent: 'flex-start',
      px: 1.5,
      py: 0.75,
      minHeight: '36px'
    }),
    []
  )

  const primaryActionButtonSx = React.useMemo(
    () => ({
      ...compactActionButtonSx,
      width: '230px',
      justifyContent: 'center'
    }),
    [compactActionButtonSx]
  )

  return (
    <LayoutScreenContainer title="профиль" breadcrumbsItems={breadcrumbsItems}>
      <Stack spacing={1.5} sx={{ flex: 1, minHeight: 0 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2.25,
            borderRadius: '8px'
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2.5}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1.75} alignItems="center">
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  flexShrink: 0
                }}
              >
                <PersonIcon />
              </Stack>
              <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {summaryTitle}
                </Typography>
                <Typography color="textSecondary">{summarySubtitle}</Typography>
              </Stack>
            </Stack>
            <Stack
              direction="row"
              spacing={2.5}
              useFlexGap
              flexWrap="wrap"
              sx={{ width: '100%', maxWidth: '720px' }}
            >
              {profileFacts.map((fact) => (
                <Stack
                  key={fact.label}
                  spacing={0.35}
                  sx={{
                    minWidth: { xs: '100%', sm: '160px' },
                    flex: '1 1 160px'
                  }}
                >
                  <Typography color="textSecondary" fontSize="0.8rem">
                    {fact.label}
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>{fact.value}</Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Paper>
        <Stack sx={{ flex: 1, minHeight: 0 }}>
          <HorizontalTwoPartsContainer proportions="SEVEN_FIVE">
            <ColumnViewer title="данные профиля">
              <ColumnViewerBlock title="основная информация">
                <ColumnViewerItem field="логин" val={user?.login ?? login} />
                <ColumnViewerItem field="ФИО" val={fullName} />
                <ColumnViewerItem field="телефон" val={user?.phone} />
                <ColumnViewerItem field="e-mail" val={user?.email} />
              </ColumnViewerBlock>
              <ColumnViewerBlock title="описание">
                {canReadProfile ? (
                  <ColumnViewerText
                    text={user?.description?.text}
                    emptyText="нет"
                  />
                ) : (
                  <Typography color="textSecondary">
                    Недостаточно прав для просмотра расширенных данных профиля
                  </Typography>
                )}
              </ColumnViewerBlock>
            </ColumnViewer>
            <ColumnViewer title="управление профилем">
              <ColumnViewerBlock title="быстрые действия">
                <Stack
                  spacing={1.25}
                  p={1}
                  alignItems="center"
                  sx={{ maxWidth: '280px', mx: 'auto' }}
                >
                  <ProjButton
                    variant="contained"
                    startIcon={<EditIcon />}
                    disabled={canEditProfile === false || user === null}
                    sx={primaryActionButtonSx}
                    onClick={() => {
                      setEditDialogIsActive(true)
                    }}
                  >
                    Изменить профиль
                  </ProjButton>
                  <ProjButton
                    variant="contained"
                    startIcon={<LockResetIcon />}
                    disabled={canChangePassword === false || userId === null}
                    sx={primaryActionButtonSx}
                    onClick={() => {
                      setPassDialogIsActive(true)
                    }}
                  >
                    Изменить пароль
                  </ProjButton>
                  {canEditProfile && user === null ? (
                    <Typography
                      color="textSecondary"
                      fontSize="0.9rem"
                      textAlign="center"
                    >
                      Для редактирования профиля сначала нужен доступ к
                      просмотру собственных данных
                    </Typography>
                  ) : null}
                </Stack>
              </ColumnViewerBlock>
              <ColumnViewerBlock title="доступ">
                <Stack
                  spacing={1.25}
                  useFlexGap
                  p={1}
                  alignItems="center"
                  sx={{ maxWidth: '320px', mx: 'auto', textAlign: 'center' }}
                >
                  <Typography color="textSecondary" fontSize="0.95rem">
                    Активных прав: {rights.length}
                  </Typography>
                  <ProjButton
                    variant="text"
                    disabled={rights.length === 0}
                    sx={compactActionButtonSx}
                    onClick={() => {
                      setRightsDialogIsActive(true)
                    }}
                  >
                    Посмотреть права доступа
                  </ProjButton>
                </Stack>
              </ColumnViewerBlock>
            </ColumnViewer>
          </HorizontalTwoPartsContainer>
        </Stack>
      </Stack>
      <UpdateSelfFormDialog
        isActive={editDialogIsActive}
        setIsActive={setEditDialogIsActive}
        userId={userId}
        initialUser={user}
      />
      <UpdateSelfPassFormDialog
        isActive={passDialogIsActive}
        setIsActive={setPassDialogIsActive}
        userId={userId}
      />
      <Dialog
        open={rightsDialogIsActive}
        onClose={() => {
          setRightsDialogIsActive(false)
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogContent
          dividers
          sx={{
            pt: 3
          }}
        >
          <Typography
            align="center"
            color="primary"
            sx={{
              mb: 2.5,
              fontSize: '1rem',
              fontWeight: 700
            }}
          >
            Активных прав: {rights.length}
          </Typography>
          <ColumnViewerChipsBlock
            items={rights.map((right) => ({
              text: localizationForRight.get(right) ?? right
            }))}
            emptyText="нет"
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: 2 }}>
          <ProjButton
            variant="contained"
            onClick={() => {
              setRightsDialogIsActive(false)
            }}
          >
            Закрыть
          </ProjButton>
        </DialogActions>
      </Dialog>
    </LayoutScreenContainer>
  )
}
