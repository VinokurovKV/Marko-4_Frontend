// Project
import type { UpdateUserSuccessResultDto } from '@common/dtos/server-api/users.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import type { UserTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useUserSubscription } from '~/hooks/resources'
import {
  type UpdateSelfFormData,
  updateSelfFormValidator
} from '~/data/forms/profile/update-self'
import {
  prepareOptionalFieldForUpdate as prepareOptional,
  prepareRequiredFieldForUpdate as prepareRequired,
  prepareTextFieldForUpdate as prepareText,
  useForm,
  FormBlock,
  FormDialog,
  FormEmailField,
  FormMultilineTextField,
  FormTelField,
  FormTextField
} from '../common'
// React
import * as React from 'react'

const UPDATE_SELF_FORM_PROPS_JOINED = updateSelfFormValidator.getPromptsJoined()

export interface UpdateSelfFormDialogProps {
  isActive: boolean
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>
  userId: number | null
  initialUser: UserTertiary | null
}

export function UpdateSelfFormDialog(props: UpdateSelfFormDialogProps) {
  const notifier = useNotifier()

  const [user, setUser] = React.useState<UserTertiary | null>(props.initialUser)
  useUserSubscription('UP_TO_TERTIARY_PROPS', props.userId, setUser)

  const submitAction = React.useCallback(
    async (validatedData: UpdateSelfFormData) => {
      if (props.userId === null) {
        throw new Error('отсутствует идентификатор пользователя')
      } else if (user === null) {
        throw new Error('не удалось получить актуальные данные профиля')
      }
      const result = await serverConnector.updateUser({
        id: props.userId,
        login: prepareRequired(user.login, validatedData.login),
        surname: prepareOptional(user.surname, validatedData.surname),
        forename: prepareOptional(user.forename, validatedData.forename),
        patronymic: prepareOptional(user.patronymic, validatedData.patronymic),
        phone: prepareOptional(user.phone, validatedData.phone),
        email: prepareOptional(user.email, validatedData.email),
        description: prepareText(
          user.description,
          validatedData.descriptionText
        )
      })
      void serverConnector.readSelfMeta().catch(() => undefined)
      return result
    },
    [props.userId, user]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: UpdateSelfFormData,
      updateUserResult: DtoWithoutEnums<UpdateUserSuccessResultDto>
    ) => {
      notifier.showSuccess('профиль обновлен')
      props.setIsActive(false)
      return updateUserResult
    },
    [notifier, props]
  )

  const initialFormData: UpdateSelfFormData = React.useMemo(
    () => ({
      login: user?.login ?? '',
      surname: user?.surname ?? undefined,
      forename: user?.forename ?? undefined,
      patronymic: user?.patronymic ?? undefined,
      phone: user?.phone ?? undefined,
      email: user?.email ?? undefined,
      descriptionText: user?.description?.text
    }),
    [user]
  )

  const { formInternal, data, errors, handleTextFieldChange } = useForm<
    UpdateSelfFormData,
    DtoWithoutEnums<UpdateUserSuccessResultDto>
  >({
    INITIAL_FORM_DATA: initialFormData,
    validator: updateSelfFormValidator,
    clearTrigger: user?.id,
    submitAction,
    onSuccessSubmit
  })

  return (
    <FormDialog
      formInternal={formInternal}
      title="изменить профиль"
      submitButtonTitle="сохранить"
      cancelButton={{
        title: 'отменить',
        onClick: () => {
          props.setIsActive(false)
        }
      }}
      clearButton={{
        title: 'к текущим значениям'
      }}
      isActive={props.isActive}
      setIsActive={props.setIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="login"
          label="логин"
          value={data.login}
          helperText={
            errors?.login ?? UPDATE_SELF_FORM_PROPS_JOINED.login ?? ' '
          }
          error={!!errors?.login}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="surname"
          label="фамилия"
          value={data.surname ?? ''}
          helperText={
            errors?.surname ?? UPDATE_SELF_FORM_PROPS_JOINED.surname ?? ' '
          }
          error={!!errors?.surname}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="forename"
          label="имя"
          value={data.forename ?? ''}
          helperText={
            errors?.forename ?? UPDATE_SELF_FORM_PROPS_JOINED.forename ?? ' '
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
            UPDATE_SELF_FORM_PROPS_JOINED.patronymic ??
            ' '
          }
          error={!!errors?.patronymic}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
      <FormBlock title="контакты">
        <FormTelField
          name="phone"
          label="телефон"
          value={data.phone ?? ''}
          helperText={
            errors?.phone ?? UPDATE_SELF_FORM_PROPS_JOINED.phone ?? ' '
          }
          error={!!errors?.phone}
          onChange={handleTextFieldChange}
        />
        <FormEmailField
          name="email"
          label="e-mail"
          value={data.email ?? ''}
          helperText={
            errors?.email ?? UPDATE_SELF_FORM_PROPS_JOINED.email ?? ' '
          }
          error={!!errors?.email}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
      <FormBlock title="описание">
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            UPDATE_SELF_FORM_PROPS_JOINED.descriptionText ??
            ' '
          }
          error={!!errors?.descriptionText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
