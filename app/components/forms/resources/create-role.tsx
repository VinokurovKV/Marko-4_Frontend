// Project
import { type Right, allRights } from '@common/enums'
import type { CreateRoleSuccessResultDto } from '@common/dtos/server-api/roles.dto'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { localizationForRight } from '~/localization'
import {
  type CreateRoleFormData,
  INITIAL_CREATE_ROLE_FORM_DATA,
  createRoleFormValidator
} from '~/data/forms/resources/create-role'
import {
  useForm,
  FormAutocompleteMultipleSelect,
  FormBlock,
  FormDialog,
  FormMultilineTextField,
  FormTextField
} from '../common'
import { RoleRightQuickGroups } from './role-right-quick-groups'
// React
import * as React from 'react'

const EMPTY_RIGHTS_ARR: Right[] = []

const CREATE_ROLE_FORM_PROPS_JOINED = createRoleFormValidator.getPromptsJoined()

export interface CreateRoleFormDialogProps {
  createModeIsActive: boolean
  setCreateModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessCreateRole?: (createRoleResult: CreateRoleSuccessResultDto) => void
  onCancelClick?: () => void
}

export function CreateRoleFormDialog(props: CreateRoleFormDialogProps) {
  const notifier = useNotifier()

  const submitAction = React.useCallback(
    async (validatedData: CreateRoleFormData) => {
      return await serverConnector.createRole({
        name: validatedData.name,
        rights: validatedData.rights,
        description:
          validatedData.descriptionText !== undefined
            ? {
                format: 'PLAIN',
                text: validatedData.descriptionText
              }
            : undefined
      })
    },
    []
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: CreateRoleFormData,
      createRoleResult: CreateRoleSuccessResultDto
    ) => {
      notifier.showSuccess(`роль «${data.name}» создана`)
      props.onSuccessCreateRole?.(createRoleResult)
    },
    [props.onSuccessCreateRole, notifier]
  )

  const {
    formInternal,
    data,
    errors,
    handleFieldChange,
    handleTextFieldChange,
    handleAutocompleteMultipleSelectChange
  } = useForm<CreateRoleFormData, CreateRoleSuccessResultDto>({
    INITIAL_FORM_DATA: INITIAL_CREATE_ROLE_FORM_DATA,
    validator: createRoleFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const handleAddGroupedRights = React.useCallback(
    (rightsToAdd: Right[]) => {
      const newRightsSet = new Set([...(data.rights ?? EMPTY_RIGHTS_ARR)])
      rightsToAdd.forEach((right) => {
        newRightsSet.add(right)
      })
      handleFieldChange(
        'rights',
        allRights.filter((right) => newRightsSet.has(right))
      )
    },
    [data.rights, handleFieldChange]
  )

  const handleToggleRight = React.useCallback(
    (right: Right) => {
      const newRightsSet = new Set([...(data.rights ?? EMPTY_RIGHTS_ARR)])
      if (newRightsSet.has(right)) {
        newRightsSet.delete(right)
      } else {
        newRightsSet.add(right)
      }
      handleFieldChange(
        'rights',
        allRights.filter((item) => newRightsSet.has(item))
      )
    },
    [data.rights, handleFieldChange]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title="создать роль"
      submitButtonTitle="создать"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'очистить'
      }}
      isActive={props.createModeIsActive}
      setIsActive={props.setCreateModeIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="name"
          label="название"
          value={data.name}
          helperText={errors?.name ?? CREATE_ROLE_FORM_PROPS_JOINED.name ?? ' '}
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormAutocompleteMultipleSelect
          name="rights"
          label="права"
          possibleValues={allRights}
          values={data.rights ?? EMPTY_RIGHTS_ARR}
          helperText={
            errors?.rights ?? CREATE_ROLE_FORM_PROPS_JOINED.rights ?? ' '
          }
          localizationForTitle={localizationForRight}
          error={!!errors?.rights}
          onChange={handleAutocompleteMultipleSelectChange}
        />
        <RoleRightQuickGroups
          selectedRights={data.rights ?? EMPTY_RIGHTS_ARR}
          onAddRights={handleAddGroupedRights}
          onToggleRight={handleToggleRight}
        />
      </FormBlock>
      <FormBlock title="дополнительная информация">
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            CREATE_ROLE_FORM_PROPS_JOINED.descriptionText ??
            ' '
          }
          error={!!errors?.descriptionText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
