// Project
import { allRights as allRightEnums } from '@common/enums'
import type { CreateRoleSuccessResultDto } from '@common/dtos/server-api/roles.dto'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { localizationForRight } from '~/localization/right'
import {
  type CreateRoleFormData,
  INITIAL_CREATE_ROLE_FORM_DATA,
  createRoleFormValidator
} from '~/data/forms/resources/create-role'
import { useForm, FormDialog } from '../common/form'
import { FormAutocompleteMultipleSelect } from '../common/form-autocomplete-multiple-select'
import { FormBlock } from '../common/form-block'
import { FormMultilineTextField } from '../common/form-multiline-text-field'
import { FormTextField } from '../common/form-text-field'
// React
import * as React from 'react'

const allRights = allRightEnums

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
      notifier.showSuccess(`роль '${data.name}' создана`)
      props.onSuccessCreateRole?.(createRoleResult)
    },
    [props.onSuccessCreateRole]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleAutocompleteMultipleSelectChange
  } = useForm<CreateRoleFormData, CreateRoleSuccessResultDto>({
    INITIAL_FORM_DATA: INITIAL_CREATE_ROLE_FORM_DATA,
    validator: createRoleFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  return (
    <FormDialog
      formInternal={formInternal}
      title="создать роль"
      submitButtonLabel="создать"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'очистить'
      }}
      createModeIsActive={props.createModeIsActive}
      setCreateModeIsActive={props.setCreateModeIsActive}
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
          values={data.rights ?? []}
          helperText={
            errors?.rights ?? CREATE_ROLE_FORM_PROPS_JOINED.rights ?? ' '
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
