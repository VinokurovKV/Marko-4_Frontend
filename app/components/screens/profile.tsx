// Project
import type { RolePrimary, UserTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import {
  ServerConnectorBadRequestError,
  ServerConnectorUnauthorizedError
} from '~/server-connector/error'
import { useMeta } from '~/providers/meta'
import { useNotifier } from '~/providers/notifier'
import { localizationForRight } from '@common/localization'
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
  ColumnViewerText
} from '../single-viewers/common'
import { FormPassField } from '../forms/common'
// React router
import { useNavigate } from 'react-router'
// React
import * as React from 'react'
// Material UI
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import DeleteIcon from '@mui/icons-material/Delete'
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
  const navigate = useNavigate()
  const notifier = useNotifier()
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
  const canDeleteProfile = rightsSet.has('DELETE_USER')

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
  const [deleteDialogIsActive, setDeleteDialogIsActive] = React.useState(false)
  const [deletePass, setDeletePass] = React.useState('')
  const [deletePassConfirm, setDeletePassConfirm] = React.useState('')
  const [deleteSubmitAttempted, setDeleteSubmitAttempted] =
    React.useState(false)
  const [deletePassError, setDeletePassError] = React.useState<string | null>(
    null
  )
  const [deleteIsSubmitting, setDeleteIsSubmitting] = React.useState(false)

  const deletePassIsEmpty = deletePass.length === 0
  const deletePassConfirmIsEmpty = deletePassConfirm.length === 0
  const deletePassesAreDifferent =
    deletePassIsEmpty === false &&
    deletePassConfirmIsEmpty === false &&
    deletePass !== deletePassConfirm
  const deleteCanBeSubmitted =
    userId !== null &&
    deletePassIsEmpty === false &&
    deletePassConfirmIsEmpty === false &&
    deletePassesAreDifferent === false

  const clearDeleteDialog = React.useCallback(() => {
    setDeletePass('')
    setDeletePassConfirm('')
    setDeleteSubmitAttempted(false)
    setDeletePassError(null)
  }, [])

  const closeDeleteDialog = React.useCallback(() => {
    if (deleteIsSubmitting) {
      return
    }
    setDeleteDialogIsActive(false)
    clearDeleteDialog()
  }, [clearDeleteDialog, deleteIsSubmitting])

  const handleDeleteSelfConfirm = React.useCallback(async () => {
    setDeleteSubmitAttempted(true)

    if (deleteCanBeSubmitted === false || userId === null) {
      return
    }

    if (login === undefined) {
      setDeletePassError('не удалось определить логин профиля')
      return
    }

    setDeleteIsSubmitting(true)
    try {
      const authResult = await serverConnector.login({
        login,
        pass: deletePass
      })
      if (authResult.userId !== userId) {
        throw new Error('пароль подтвержден для другого пользователя')
      }
      await serverConnector.deleteUser({ id: userId })
      setDeleteDialogIsActive(false)
      clearDeleteDialog()
      void navigate('/login')
    } catch (error) {
      if (
        error instanceof ServerConnectorUnauthorizedError ||
        error instanceof ServerConnectorBadRequestError
      ) {
        setDeletePassError('неверный пароль')
        return
      }
      notifier.showError(error)
    } finally {
      setDeleteIsSubmitting(false)
    }
  }, [
    clearDeleteDialog,
    deleteCanBeSubmitted,
    deletePass,
    login,
    navigate,
    notifier,
    userId
  ])

  const handleDeleteSelfClick = React.useCallback(() => {
    if (userId === null) {
      return
    }
    setDeleteDialogIsActive(true)
  }, [userId])

  const compactActionButtonSx = React.useMemo(
    () => ({
      justifyContent: 'flex-start',
      px: 1.5
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
      <Stack sx={{ flex: 1, minHeight: 0 }}>
        <HorizontalTwoPartsContainer proportions="SEVEN_FIVE">
          <ColumnViewer>
            <Paper
              variant="outlined"
              sx={{
                p: 2.25,
                borderRadius: '8px'
              }}
            >
              <Stack spacing={2.25}>
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
                    <Typography color="textSecondary">
                      {summarySubtitle}
                    </Typography>
                  </Stack>
                </Stack>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  useFlexGap
                  flexWrap="wrap"
                  sx={{
                    pt: 2,
                    borderTop: (theme) => `1px solid ${theme.palette.divider}`
                  }}
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
                      <Typography sx={{ fontWeight: 600 }}>
                        {fact.value}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Paper>
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
          <ColumnViewer>
            <ColumnViewerBlock title="действия">
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
                {canDeleteProfile ? (
                  <ProjButton
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    disabled={userId === null}
                    sx={primaryActionButtonSx}
                    onClick={() => {
                      handleDeleteSelfClick()
                    }}
                  >
                    Удалить профиль
                  </ProjButton>
                ) : null}
                {canEditProfile && user === null ? (
                  <Typography
                    color="textSecondary"
                    fontSize="0.9rem"
                    textAlign="center"
                  >
                    Для редактирования профиля сначала нужен доступ к просмотру
                    собственных данных
                  </Typography>
                ) : null}
              </Stack>
            </ColumnViewerBlock>
            <ColumnViewerBlock title="права">
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
        open={deleteDialogIsActive}
        onClose={closeDeleteDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Typography
            color="error"
            sx={{ fontSize: '1.2rem', fontWeight: 700, textAlign: 'center' }}
          >
            Удаление текущего профиля
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="error">
              Вы точно уверены, что хотите удалить текущий профиль?
            </Alert>
            <Typography color="textSecondary" sx={{ textAlign: 'center' }}>
              После удаления профиль будет недоступен, а текущая сессия
              завершится.
            </Typography>
            <FormPassField
              required
              name="deletePass"
              label="пароль"
              value={deletePass}
              helperText={
                deletePassError ??
                (deleteSubmitAttempted && deletePassIsEmpty
                  ? 'укажите пароль'
                  : ' ')
              }
              error={
                deletePassError !== null ||
                (deleteSubmitAttempted && deletePassIsEmpty)
              }
              disabled={deleteIsSubmitting}
              onChange={(event) => {
                setDeletePassError(null)
                setDeletePass(event.target.value)
              }}
            />
            <FormPassField
              required
              name="deletePassConfirm"
              label="подтверждение пароля"
              value={deletePassConfirm}
              helperText={
                deleteSubmitAttempted && deletePassConfirmIsEmpty
                  ? 'подтвердите пароль'
                  : deleteSubmitAttempted && deletePassesAreDifferent
                    ? 'пароли не совпадают'
                    : ' '
              }
              error={
                deleteSubmitAttempted &&
                (deletePassConfirmIsEmpty || deletePassesAreDifferent)
              }
              disabled={deleteIsSubmitting}
              onChange={(event) => {
                setDeletePassConfirm(event.target.value)
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: 2 }}>
          <ProjButton
            variant="contained"
            loading={deleteIsSubmitting}
            disabled={deleteIsSubmitting}
            onClick={closeDeleteDialog}
          >
            отменить
          </ProjButton>
          <ProjButton
            variant="contained"
            color="error"
            loading={deleteIsSubmitting}
            disabled={deleteIsSubmitting}
            onClick={() => {
              void handleDeleteSelfConfirm()
            }}
          >
            удалить профиль
          </ProjButton>
        </DialogActions>
      </Dialog>
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
