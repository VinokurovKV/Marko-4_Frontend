// Project
import type { UpdateUserSuccessResultDto } from '@common/dtos/server-api/users.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import type { RolePrimary, UserTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useUserSubscription } from '~/hooks/resources'
import {
  type UpdateUserFormData,
  updateUserFormValidator
} from '~/data/forms/resources/update-user'
import type { FormSelectProps } from '../common'
import {
  useForm,
  FormBlock,
  FormDialog,
  FormEmailField,
  FormMultilineTextField,
  FormSelect,
  FormTelField,
  FormTextField
} from '../common'
// React
import * as React from 'react'

const UPDATE_USER_FORM_PROPS_JOINED = updateUserFormValidator.getPromptsJoined()

export interface UpdateUserFormDialogProps {
  roles: RolePrimary[] | null
  userId: number | null
  setUserId: React.Dispatch<React.SetStateAction<number | null>>
  initialUser: UserTertiary | null
  onSuccessUpdateUser?: (
    createUserResult: DtoWithoutEnums<UpdateUserSuccessResultDto>
  ) => void
  onCancelClick?: () => void
}

export function UpdateUserFormDialog(props: UpdateUserFormDialogProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const selfId = React.useMemo(
    () => (meta.status !== 'AUTHENTICATED' ? null : meta.selfMeta.id),
    [meta]
  )

  const [user, setUser] = React.useState<UserTertiary | null>(props.initialUser)

  useUserSubscription('UP_TO_TERTIARY_PROPS', props.userId, setUser)

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToEvents(
      {
        filter: {
          types: ['UPDATE_USER', 'DELETE_USER', 'DELETE_USERS']
        }
      },
      (data) => {
        ;(() => {
          if (props.userId !== null) {
            for (const event of data) {
              if (selfId !== null && event.initiatorId !== selfId) {
                if (
                  event.type === 'UPDATE_USER' &&
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  (event as any).config?.resource?.id === props.userId
                ) {
                  notifier.showWarning(
                    `редактируемый пользователь изменен другим пользователем`
                  )
                } else if (
                  (event.type === 'DELETE_USER' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resource?.id === props.userId) ||
                  (event.type === 'DELETE_USERS' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resources?.some?.(
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      (resource: any) => resource?.id === props.userId
                    ))
                ) {
                  notifier.showWarning(
                    `редактируемый пользователь удален другим пользователем`
                  )
                }
              }
            }
          }
        })()
      }
    ).subscriptionId
    return () => {
      serverConnector.unsubscribe(subscriptionId)
    }
  }, [props.userId, notifier, selfId])

  const submitAction = React.useCallback(
    async (validatedData: UpdateUserFormData) => {
      if (props.userId === null) {
        throw new Error('отсутствует идентификатор пользователя')
      } else if (user === null) {
        throw new Error(
          `отсутствует доступ к текущим характеристикам редактируемого пользователя`
        )
      } else {
        const processOptionalStr = (
          str: string | null,
          validatedStr: string | undefined
        ) => {
          return validatedStr === undefined
            ? str === null
              ? undefined
              : null
            : validatedStr !== str
              ? validatedStr
              : undefined
        }
        return await serverConnector.updateUser({
          id: props.userId,
          login:
            validatedData.login !== user.login
              ? validatedData.login
              : undefined,
          surname: processOptionalStr(user.surname, validatedData.surname),
          forename: processOptionalStr(user.forename, validatedData.forename),
          patronymic: processOptionalStr(
            user.patronymic,
            validatedData.patronymic
          ),
          phone: processOptionalStr(user.phone, validatedData.phone),
          email: processOptionalStr(user.email, validatedData.email),
          roleId:
            validatedData.roleId !== user.roleId
              ? validatedData.roleId!
              : undefined,
          description:
            validatedData.descriptionText === undefined
              ? user.description === null
                ? undefined
                : null
              : user.description === null ||
                  user.description.format !== 'PLAIN' ||
                  user.description.text !== validatedData.descriptionText
                ? {
                    format: 'PLAIN',
                    text: validatedData.descriptionText
                  }
                : undefined
        })
      }
    },
    [props.userId, notifier, user]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: UpdateUserFormData,
      updateUserResult: DtoWithoutEnums<UpdateUserSuccessResultDto>
    ) => {
      notifier.showSuccess(`пользователь «${user?.login}» изменен`)
      props.onSuccessUpdateUser?.(updateUserResult)
    },
    [props.onSuccessUpdateUser, notifier, user]
  )

  const initialFormData: UpdateUserFormData = React.useMemo(
    () => ({
      login: user?.login ?? '',
      surname: user?.surname ?? '',
      forename: user?.forename ?? '',
      patronymic: user?.patronymic ?? '',
      phone: user?.phone ?? '',
      email: user?.email ?? '',
      roleId: user?.roleId,
      descriptionText: user?.description?.text
    }),
    [user]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleNumSelectChange
  } = useForm<UpdateUserFormData, DtoWithoutEnums<UpdateUserSuccessResultDto>>({
    INITIAL_FORM_DATA: initialFormData,
    validator: updateUserFormValidator,
    clearTrigger: user?.id,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const roleSelectItems: FormSelectProps<number>['items'] = React.useMemo(
    () =>
      props.roles?.map((role) => ({
        value: role.id,
        title: role.name
      })) ?? [],
    [props.roles]
  )

  const setIsActive = React.useCallback(
    (value: boolean | ((prevState: boolean) => boolean)) => {
      if (value === false) {
        props.setUserId(null)
      } else {
        throw new Error()
      }
    },
    [props.setUserId]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title={`изменить пользователя «${user?.login}»`}
      submitButtonTitle="изменить"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'к текущим значениям'
      }}
      isActive={props.userId !== null}
      setIsActive={setIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="login"
          label="логин"
          value={data.login}
          helperText={
            errors?.login ?? UPDATE_USER_FORM_PROPS_JOINED.login ?? ' '
          }
          error={!!errors?.login}
          onChange={handleTextFieldChange}
        />
        <FormSelect
          required
          name="roleId"
          label="роль"
          items={roleSelectItems}
          value={data.roleId ?? ''}
          helperText={
            errors?.roleId ?? UPDATE_USER_FORM_PROPS_JOINED.roleId ?? ' '
          }
          error={!!errors?.roleId}
          onChange={handleNumSelectChange}
        />
      </FormBlock>
      <FormBlock title="дополнительная информация">
        <FormTextField
          name="surname"
          label="фамилия"
          value={data.surname ?? ''}
          helperText={
            errors?.surname ?? UPDATE_USER_FORM_PROPS_JOINED.surname ?? ' '
          }
          error={!!errors?.surname}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="forename"
          label="имя"
          value={data.forename ?? ''}
          helperText={
            errors?.forename ?? UPDATE_USER_FORM_PROPS_JOINED.forename ?? ' '
          }
          error={!!errors?.forename}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="patronymic"
          label="отчество"
          value={data.patronymic ?? ''}
          helperText={
            errors?.patronymic ??
            UPDATE_USER_FORM_PROPS_JOINED.patronymic ??
            ' '
          }
          error={!!errors?.patronymic}
          onChange={handleTextFieldChange}
        />
        <FormTelField
          name="phone"
          label="телефон"
          value={data.phone ?? ''}
          helperText={
            errors?.phone ?? UPDATE_USER_FORM_PROPS_JOINED.phone ?? ' '
          }
          error={!!errors?.phone}
          onChange={handleTextFieldChange}
        />
        <FormEmailField
          name="email"
          label="e-mail"
          value={data.email ?? ''}
          helperText={
            errors?.email ?? UPDATE_USER_FORM_PROPS_JOINED.email ?? ' '
          }
          error={!!errors?.email}
          onChange={handleTextFieldChange}
        />
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            UPDATE_USER_FORM_PROPS_JOINED.descriptionText ??
            ' '
          }
          error={!!errors?.descriptionText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
