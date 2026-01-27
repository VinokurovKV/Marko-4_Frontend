// Project
import { allDocumentTypes } from '@common/enums'
import type { TextWithFormatDto } from '@common/dtos'
import type { UpdateDocumentSuccessResultDto } from '@common/dtos/server-api/documents.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import type { DocumentTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useDocumentSubscription } from '~/hooks/resources'
import { useTags } from '~/hooks/resources'
import { localizationForDocumentType } from '~/localization'
import {
  type UpdateDocumentFormData,
  updateDocumentFormValidator
} from '~/data/forms/resources/update-document'
import {
  FormAutocompleteFreeItemsMultipleSelect,
  FormBlock,
  FormDate,
  FormDialog,
  FormMultilineTextField,
  FormSelect,
  FormTextField,
  FormUrlField,
  type FormSelectProps,
  useForm
} from '../common'
// React
import * as React from 'react'

type TextWithFormat = DtoWithoutEnums<TextWithFormatDto>

const EMPTY_TAG_IDS_ARR: number[] = []
const EMPTY_TAG_CODES_ARR: string[] = []

const UPDATE_DOCUMENT_FORM_PROPS_JOINED =
  updateDocumentFormValidator.getPromptsJoined()

export interface UpdateDocumentFormDialogProps {
  documentId: number | null
  setDocumentId: React.Dispatch<React.SetStateAction<number | null>>
  initialDocument: DocumentTertiary | null
  onSuccessUpdateDocument?: (
    updateDocumentResult: UpdateDocumentSuccessResultDto
  ) => void
  onCancelClick?: () => void
}

export function UpdateDocumentFormDialog(props: UpdateDocumentFormDialogProps) {
  const notifier = useNotifier()
  const meta = useMeta()
  const selfId = React.useMemo(
    () => (meta.status !== 'AUTHENTICATED' ? null : meta.selfMeta.id),
    [meta]
  )

  const [document, setDocument] = React.useState<DocumentTertiary | null>(
    props.initialDocument
  )
  useDocumentSubscription('UP_TO_TERTIARY_PROPS', props.documentId, setDocument)

  const tags = useTags('PRIMARY_PROPS', false, props.documentId !== null)

  const tagIds = React.useMemo(() => tags?.map((tag) => tag.id) ?? [], [tags])

  const tagCodeForId = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.id, tag.code])),
    [tags]
  )

  const tagIdForCode = React.useMemo(
    () => new Map((tags ?? []).map((tag) => [tag.code, tag.id])),
    [tags]
  )

  React.useEffect(() => {
    const subscriptionId = serverConnector.subscribeToEvents(
      {
        filter: {
          types: ['UPDATE_DOCUMENT', 'DELETE_DOCUMENT', 'DELETE_DOCUMENTS']
        }
      },
      (data) => {
        ;(() => {
          if (props.documentId !== null) {
            for (const event of data) {
              if (selfId !== null && event.initiatorId !== selfId) {
                if (
                  event.type === 'UPDATE_DOCUMENT' &&
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  (event as any).config?.resource?.id === props.documentId
                ) {
                  notifier.showWarning(
                    `редактируемый документ изменен другим пользователем`
                  )
                } else if (
                  (event.type === 'DELETE_DOCUMENT' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resource?.id === props.documentId) ||
                  (event.type === 'DELETE_DOCUMENTS' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resources?.some?.(
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      (resource: any) => resource?.id === props.documentId
                    ))
                ) {
                  notifier.showWarning(
                    `редактируемый документ удален другим пользователем`
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
  }, [props.documentId, notifier, selfId])

  const submitAction = React.useCallback(
    async (validatedData: UpdateDocumentFormData) => {
      if (props.documentId === null) {
        throw new Error('отсутствует идентификатор документа')
      } else if (document === null) {
        throw new Error(
          `отсутствует доступ к текущим характеристикам редактируемого документа`
        )
      } else {
        const { descriptionText, remarkText, tagIds, tagCodesToCreate } =
          validatedData

        const recentlyCreatedTagIds = (tagCodesToCreate ?? [])
          .map((tagCodeToCreate) => tagIdForCode.get(tagCodeToCreate))
          .filter((tagId) => tagId !== undefined)

        const newCreatedTagIds = (
          await Promise.allSettled(
            (tagCodesToCreate ?? [])
              .filter(
                (tagCodeToCreate) => tagIdForCode.has(tagCodeToCreate) === false
              )
              .map((tagCodeToCreate) =>
                (async () => {
                  try {
                    return await serverConnector
                      .createTag({
                        code: tagCodeToCreate
                      })
                      .then((result) => result.result.createdResourceId)
                  } catch (error) {
                    notifier.showError(
                      error,
                      `не удалось создать тег «${tagCodeToCreate}»`
                    )
                    return null
                  }
                })()
              )
          )
        )
          .map((result) =>
            result.status === 'fulfilled' ? result.value : null
          )
          .filter((result) => result !== null)

        function processOptionalStr<Type>(
          str: Type | null,
          validatedStr: Type | undefined
        ) {
          return validatedStr === undefined
            ? str === null
              ? undefined
              : null
            : validatedStr !== str
              ? validatedStr
              : undefined
        }

        function processText(
          text: TextWithFormat | null,
          validatedText: string | undefined
        ) {
          return validatedText === undefined
            ? text === null
              ? undefined
              : null
            : text === null ||
                text.format !== 'PLAIN' ||
                text.text !== validatedText
              ? ({
                  format: 'PLAIN',
                  text: validatedText
                } as const)
              : undefined
        }

        const tagIdsSet = new Set(document.tagIds)
        const newTagIds = [
          ...(tagIds ?? []),
          ...recentlyCreatedTagIds,
          ...newCreatedTagIds
        ]
        const newTagIdsSet = new Set(newTagIds)
        const addedTagIds = newTagIds.filter(
          (tagId) => tagIdsSet.has(tagId) === false
        )
        const removedTagIds = document.tagIds.filter(
          (tagId) => newTagIdsSet.has(tagId) === false
        )

        return await serverConnector.updateDocument({
          id: props.documentId,
          code:
            validatedData.code !== document.code
              ? validatedData.code
              : undefined,
          name: processOptionalStr(document.name, validatedData.name),
          type:
            validatedData.type !== document.type
              ? validatedData.type
              : undefined,
          publicVersion: processOptionalStr(
            document.publicVersion,
            validatedData.publicVersion
          ),
          url: processOptionalStr(document.url, validatedData.url),
          date: processOptionalStr(document.date, validatedData.date),
          description: processText(document.description, descriptionText),
          remark: processText(document.remark, remarkText),
          tagIds:
            addedTagIds.length !== 0 || removedTagIds.length !== 0
              ? {
                  added: addedTagIds.length !== 0 ? addedTagIds : undefined,
                  removed:
                    removedTagIds.length !== 0 ? removedTagIds : undefined
                }
              : undefined
        })
      }
    },
    [props.documentId, notifier, document, tagIdForCode]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: UpdateDocumentFormData,
      updateDocumentResult: UpdateDocumentSuccessResultDto
    ) => {
      notifier.showSuccess(`документ «${document?.code}» изменен`)
      props.onSuccessUpdateDocument?.(updateDocumentResult)
    },
    [props.onSuccessUpdateDocument, notifier]
  )

  const initialFormData: UpdateDocumentFormData = React.useMemo(
    () => ({
      code: document?.code ?? '',
      name: document?.name ?? undefined,
      type: document?.type,
      publicVersion: document?.publicVersion ?? undefined,
      url: document?.url ?? undefined,
      date: document?.date ?? undefined,
      descriptionText: document?.description?.text,
      remarkText: document?.remark?.text,
      tagIds: document?.tagIds
    }),
    [document]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleStrSelectChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange,
    handleDateChange
  } = useForm<UpdateDocumentFormData, UpdateDocumentSuccessResultDto>({
    INITIAL_FORM_DATA: initialFormData,
    validator: updateDocumentFormValidator,
    clearTrigger: document?.id,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const typeSelectItems: FormSelectProps<string>['items'] = React.useMemo(
    () =>
      allDocumentTypes.map((type) => ({
        value: type,
        title: localizationForDocumentType.get(type) ?? type
      })),
    []
  )

  const setIsActive = React.useCallback(
    (value: boolean | ((prevState: boolean) => boolean)) => {
      if (value === false) {
        props.setDocumentId(null)
      } else {
        throw new Error()
      }
    },
    [props.setDocumentId]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title="изменить документ"
      submitButtonTitle="изменить"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'к текущим значениям'
      }}
      isActive={props.documentId !== null}
      setIsActive={setIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="code"
          label="код"
          value={data.code}
          helperText={
            errors?.code ?? UPDATE_DOCUMENT_FORM_PROPS_JOINED.code ?? ' '
          }
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? UPDATE_DOCUMENT_FORM_PROPS_JOINED.name ?? ' '
          }
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormSelect
          required
          name="type"
          label="тип"
          items={typeSelectItems}
          value={data.type ?? ''}
          helperText={
            errors?.type ?? UPDATE_DOCUMENT_FORM_PROPS_JOINED.type ?? ' '
          }
          error={!!errors?.type}
          onChange={handleStrSelectChange}
        />
        <FormTextField
          name="publicVersion"
          label="версия"
          value={data.publicVersion ?? ''}
          helperText={
            errors?.publicVersion ??
            UPDATE_DOCUMENT_FORM_PROPS_JOINED.publicVersion ??
            ' '
          }
          error={!!errors?.publicVersion}
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
            UPDATE_DOCUMENT_FORM_PROPS_JOINED.descriptionText ??
            ' '
          }
          error={!!errors?.descriptionText}
          onChange={handleTextFieldChange}
        />
        <FormDate
          name="date"
          label="дата публикации"
          value={data.date ?? null}
          helperText={
            errors?.date ?? UPDATE_DOCUMENT_FORM_PROPS_JOINED.date ?? ' '
          }
          error={!!errors?.date}
          onChange={handleDateChange}
        />
        <FormUrlField
          name="url"
          label="ссылка на источник"
          value={data.url ?? ''}
          helperText={
            errors?.url ?? UPDATE_DOCUMENT_FORM_PROPS_JOINED.url ?? ' '
          }
          error={!!errors?.url}
          onChange={handleTextFieldChange}
        />
        <FormAutocompleteFreeItemsMultipleSelect
          name="tagIds"
          freeItemsFieldName="tagCodesToCreate"
          label="теги"
          possibleValues={tagIds}
          titleForValue={tagCodeForId}
          values={data.tagIds ?? EMPTY_TAG_IDS_ARR}
          freeItems={data.tagCodesToCreate ?? EMPTY_TAG_CODES_ARR}
          helperText={(() => {
            const result: string[] = []
            const addMes = (mes: string | undefined) => {
              if (mes) {
                result.push(mes)
              }
            }
            if (errors?.tagIds || errors?.tagCodesToCreate) {
              addMes(errors?.tagIds)
              addMes(errors?.tagCodesToCreate)
            } else {
              addMes(UPDATE_DOCUMENT_FORM_PROPS_JOINED.tagIds)
              addMes(UPDATE_DOCUMENT_FORM_PROPS_JOINED.tagCodesToCreate)
            }
            return result.length > 0 ? result.join(', ') : ' '
          })()}
          error={!!errors?.tagIds || !!errors?.tagCodesToCreate}
          onChange={handleAutocompleteMultipleSelectChange}
          onChangeFreeItems={handleAutocompleteMultipleSelectFreeItemsChange}
        />
        <FormMultilineTextField
          name="remarkText"
          label="комментарии"
          value={data.remarkText ?? ''}
          helperText={
            errors?.remarkText ??
            UPDATE_DOCUMENT_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
