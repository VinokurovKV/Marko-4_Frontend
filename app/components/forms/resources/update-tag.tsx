// Project
import type { UpdateTagSuccessResultDto } from '@common/dtos/server-api/tags.dto'
import type { TagTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useTagSubscription } from '~/hooks/resources'
import {
  type UpdateTagFormData,
  updateTagFormValidator
} from '~/data/forms/resources/update-tag'
import {
  prepareRequiredFieldForUpdate as prepareRequired,
  prepareTextFieldForUpdate as prepareText,
  useForm,
  FormBlock,
  FormDialog,
  FormMultilineTextField,
  FormTextField
} from '../common'
// React
import * as React from 'react'

const UPDATE_TAG_FORM_PROPS_JOINED = updateTagFormValidator.getPromptsJoined()

export interface UpdateTagFormDialogProps {
  tagId: number | null
  setTagId: React.Dispatch<React.SetStateAction<number | null>>
  initialTag: TagTertiary | null
  onSuccessUpdateTag?: (updateTagResult: UpdateTagSuccessResultDto) => void
  onCancelClick?: () => void
}

export function UpdateTagFormDialog(props: UpdateTagFormDialogProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const selfId = React.useMemo(
    () => (meta.status !== 'AUTHENTICATED' ? null : meta.selfMeta.id),
    [meta]
  )

  const [tag, setTag] = React.useState<TagTertiary | null>(props.initialTag)
  useTagSubscription('UP_TO_TERTIARY_PROPS', props.tagId, setTag)

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToEvents(
      {
        filter: {
          types: ['UPDATE_TAG', 'DELETE_TAG', 'DELETE_TAGS']
        }
      },
      (data) => {
        ;(() => {
          if (props.tagId !== null) {
            for (const event of data) {
              if (selfId !== null && event.initiatorId !== selfId) {
                if (
                  event.type === 'UPDATE_TAG' &&
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  (event as any).config?.resource?.id === props.tagId
                ) {
                  notifier.showWarning(
                    `редактируемый тег изменен другим пользователем`
                  )
                } else if (
                  (event.type === 'DELETE_TAG' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resource?.id === props.tagId) ||
                  (event.type === 'DELETE_TAGS' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resources?.some?.(
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      (resource: any) => resource?.id === props.tagId
                    ))
                ) {
                  notifier.showWarning(
                    `редактируемый тег удален другим пользователем`
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
  }, [props.tagId, notifier, selfId])

  const submitAction = React.useCallback(
    async (validatedData: UpdateTagFormData) => {
      if (props.tagId === null) {
        throw new Error('отсутствует идентификатор тега')
      } else if (tag === null) {
        throw new Error(
          `отсутствует доступ к текущим характеристикам редактируемого тега`
        )
      } else {
        return await serverConnector.updateTag({
          id: props.tagId,
          code: prepareRequired(tag.code, validatedData.code),
          description: prepareText(
            tag.description,
            validatedData.descriptionText
          )
        })
      }
    },
    [props.tagId, notifier, tag]
  )

  const onSuccessSubmit = React.useCallback(
    (data: UpdateTagFormData, updateTagResult: UpdateTagSuccessResultDto) => {
      notifier.showSuccess(`тег «${tag?.code}» изменен`)
      props.onSuccessUpdateTag?.(updateTagResult)
    },
    [props.onSuccessUpdateTag, notifier, tag]
  )

  const initialFormData: UpdateTagFormData = React.useMemo(
    () => ({
      code: tag?.code ?? '',
      descriptionText: tag?.description?.text
    }),
    [tag]
  )

  const { formInternal, data, errors, handleTextFieldChange } = useForm<
    UpdateTagFormData,
    UpdateTagSuccessResultDto
  >({
    INITIAL_FORM_DATA: initialFormData,
    validator: updateTagFormValidator,
    clearTrigger: tag?.id,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const setIsActive = React.useCallback(
    (value: boolean | ((prevState: boolean) => boolean)) => {
      if (value === false) {
        props.setTagId(null)
      } else {
        throw new Error()
      }
    },
    [props.setTagId]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title="изменить тег"
      submitButtonTitle="изменить"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'к текущим значениям'
      }}
      isActive={props.tagId !== null}
      setIsActive={setIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="code"
          label="код"
          value={data.code}
          helperText={errors?.code ?? UPDATE_TAG_FORM_PROPS_JOINED.code ?? ' '}
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
      <FormBlock title="дополнительная информация">
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            UPDATE_TAG_FORM_PROPS_JOINED.descriptionText ??
            ' '
          }
          error={!!errors?.descriptionText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
