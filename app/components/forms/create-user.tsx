// // Project
// import type { CreateUserSuccessResultDto } from '@common/dtos/server-api/users.dto'
// import { serverConnector } from '~/server-connector'
// import {
//   type CreateUserFormData,
//   INITIAL_CREATE_USER_FORM_DATA,
//   createUserFormValidator
// } from '~/data/forms/create-user'
// import { useForm, Form } from './common/form'
// import { FormBlock } from './common/form-block'
// import { FormEmailField } from './common/form-email-field'
// import { FormMultilineTextField } from './common/form-multiline-text-field'
// import { FormPassField } from './common/form-pass-field'
// import { FormSelect } from './common/form-select'
// import { FormTextField } from './common/form-text-field'
// // React
// import * as React from 'react'

// const CREATE_USER_FORM_PROPS_JOINED = createUserFormValidator.getPromptsJoined()

// export interface CreateUserFormProps {
//   onSuccessCreateUser?: (createUserResult: CreateUserSuccessResultDto) => void
// }

// export function CreateUserForm(props: CreateUserFormProps) {
//   const submitAction = React.useCallback(
//     async (validatedData: CreateUserFormData) => {
//       return await serverConnector.createUser({
//         ownerLogin: validatedData.ownerLogin,
//         ownerPass: validatedData.ownerPass
//       })
//     },
//     []
//   )

//   const { formInternal, data, errors, handleTextFieldChange } = useForm<
//     CreateUserFormData,
//     CreateUserSuccessResultDto
//   >({
//     INITIAL_FORM_DATA: INITIAL_CREATE_USER_FORM_DATA,
//     validator: createUserFormValidator,
//     submitAction: submitAction,
//     onSuccessSubmit: props.onSuccessCreateUser
//   })

//   return (
//     <Form
//       formInternal={formInternal}
//       title="инициализация системы"
//       submitButtonLabel="инициализировать"
//     >
//       <FormBlock title="владелец">
//         <FormTextField
//           required
//           name="ownerLogin"
//           label="логин"
//           value={data.ownerLogin}
//           helperText={
//             errors?.ownerLogin ??
//             CREATE_USER_FORM_PROPS_JOINED.ownerLogin ??
//             ' '
//           }
//           error={!!errors?.ownerLogin}
//           onChange={handleTextFieldChange}
//         />
//         <FormPassField
//           required
//           name="ownerPass"
//           label="пароль"
//           value={data.ownerPass}
//           helperText={
//             errors?.ownerPass ?? CREATE_USER_FORM_PROPS_JOINED.ownerPass ?? ' '
//           }
//           error={!!errors?.ownerPass}
//           onChange={handleTextFieldChange}
//         />
//         <FormPassField
//           required
//           name="ownerPassConfirm"
//           label="подтверждение пароля"
//           value={data.ownerPassConfirm}
//           helperText={
//             errors?.ownerPassConfirm ??
//             CREATE_USER_FORM_PROPS_JOINED.ownerPassConfirm ??
//             ' '
//           }
//           error={!!errors?.ownerPassConfirm}
//           onChange={handleTextFieldChange}
//         />
//       </FormBlock>
//     </Form>
//   )
// }
