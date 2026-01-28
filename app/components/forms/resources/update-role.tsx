// Project
import { type Right, allRights } from '@common/enums'
import type { UpdateRoleSuccessResultDto } from '@common/dtos/server-api/roles.dto'
import type { RoleTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useRoleSubscription } from '~/hooks/resources'
import { localizationForRight } from '~/localization'
import {
  type UpdateRoleFormData,
  updateRoleFormValidator
} from '~/data/forms/resources/update-role'
import {
  prepareArrFieldForUpdate as prepareArr,
  prepareRequiredFieldForUpdate as prepareRequired,
  prepareTextFieldForUpdate as prepareText,
  useForm,
  FormAutocompleteMultipleSelect,
  FormBlock,
  FormDialog,
  FormMultilineTextField,
  FormTextField
} from '../common'
// React
import * as React from 'react'

const EMPTY_RIGHTS_ARR: Right[] = []

const UPDATE_ROLE_FORM_PROPS_JOINED = updateRoleFormValidator.getPromptsJoined()

export interface UpdateRoleFormDialogProps {
  roleId: number | null
  setRoleId: React.Dispatch<React.SetStateAction<number | null>>
  initialRole: RoleTertiary | null
  onSuccessUpdateRole?: (updateRoleResult: UpdateRoleSuccessResultDto) => void
  onCancelClick?: () => void
}

export function UpdateRoleFormDialog(props: UpdateRoleFormDialogProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const selfId = React.useMemo(
    () => (meta.status !== 'AUTHENTICATED' ? null : meta.selfMeta.id),
    [meta]
  )

  const [role, setRole] = React.useState<RoleTertiary | null>(props.initialRole)
  useRoleSubscription('UP_TO_TERTIARY_PROPS', props.roleId, setRole)

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToEvents(
      {
        filter: {
          types: ['UPDATE_ROLE', 'DELETE_ROLE', 'DELETE_ROLES']
        }
      },
      (data) => {
        ;(() => {
          if (props.roleId !== null) {
            for (const event of data) {
              if (selfId !== null && event.initiatorId !== selfId) {
                if (
                  event.type === 'UPDATE_ROLE' &&
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  (event as any).config?.resource?.id === props.roleId
                ) {
                  notifier.showWarning(
                    `редактируемая роль изменена другим пользователем`
                  )
                } else if (
                  (event.type === 'DELETE_ROLE' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resource?.id === props.roleId) ||
                  (event.type === 'DELETE_ROLES' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resources?.some?.(
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      (resource: any) => resource?.id === props.roleId
                    ))
                ) {
                  notifier.showWarning(
                    `редактируемая роль удалена другим пользователем`
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
  }, [props.roleId, notifier, selfId])

  const submitAction = React.useCallback(
    async (validatedData: UpdateRoleFormData) => {
      if (props.roleId === null) {
        throw new Error('отсутствует идентификатор роли')
      } else if (role === null) {
        throw new Error(
          `отсутствует доступ к текущим характеристикам редактируемой роли`
        )
      } else {
        return await serverConnector.updateRole({
          id: props.roleId,
          name: prepareRequired(role.name, validatedData.name),
          rights: prepareArr(role.rights, validatedData.rights),
          description: prepareText(
            role.description,
            validatedData.descriptionText
          )
        })
      }
    },
    [props.roleId, notifier, role]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: UpdateRoleFormData,
      updateRoleResult: UpdateRoleSuccessResultDto
    ) => {
      notifier.showSuccess(`роль «${role?.name}» изменена`)
      props.onSuccessUpdateRole?.(updateRoleResult)
    },
    [props.onSuccessUpdateRole, notifier, role]
  )

  const initialFormData: UpdateRoleFormData = React.useMemo(
    () => ({
      name: role?.name ?? '',
      rights: role?.rights,
      descriptionText: role?.description?.text
    }),
    [role]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleAutocompleteMultipleSelectChange
  } = useForm<UpdateRoleFormData, UpdateRoleSuccessResultDto>({
    INITIAL_FORM_DATA: initialFormData,
    validator: updateRoleFormValidator,
    clearTrigger: role?.id,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const setIsActive = React.useCallback(
    (value: boolean | ((prevState: boolean) => boolean)) => {
      if (value === false) {
        props.setRoleId(null)
      } else {
        throw new Error()
      }
    },
    [props.setRoleId]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title={`изменить роль «${role?.name}»`}
      submitButtonTitle="изменить"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'к текущим значениям'
      }}
      isActive={props.roleId !== null}
      setIsActive={setIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={errors?.name ?? UPDATE_ROLE_FORM_PROPS_JOINED.name ?? ' '}
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormAutocompleteMultipleSelect
          name="rights"
          label="права"
          possibleValues={allRights}
          values={data.rights ?? EMPTY_RIGHTS_ARR}
          helperText={
            errors?.rights ?? UPDATE_ROLE_FORM_PROPS_JOINED.rights ?? ' '
          }
          localizationForTitle={localizationForRight}
          error={!!errors?.rights}
          onChange={handleAutocompleteMultipleSelectChange}
        />
      </FormBlock>
      <FormBlock title="дополнительная информация">
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            UPDATE_ROLE_FORM_PROPS_JOINED.descriptionText ??
            ' '
          }
          error={!!errors?.descriptionText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
