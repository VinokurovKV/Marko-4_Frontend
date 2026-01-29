// Project
import { convertFileFormatToExtension } from '@common/formats'
import type { UpdateTestTemplateSuccessResultDto } from '@common/dtos/server-api/test-templates.dto'
import { convertNumberOfBytesToStr } from '@common/utilities'
import type { TestTemplateTertiary } from '~/types'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useMeta } from '~/providers/meta'
import { useTestTemplateSubscription } from '~/hooks/resources'
import { useTags } from '~/hooks/resources'
import {
  type UpdateTestTemplateFormData,
  updateTestTemplateFormValidator
} from '~/data/forms/resources/update-test-template'
import {
  createTagsAndGetIds,
  prepareArrFieldForUpdate as prepareArr,
  prepareFileExtraFieldForUpdate as prepareFileExtra,
  prepareOptionalFieldForUpdate as prepareOptional,
  prepareRequiredFieldForUpdate as prepareRequired,
  prepareTextFieldForUpdate as prepareText,
  useForm,
  FormAutocompleteFreeItemsMultipleSelect,
  FormBlock,
  FormDialog,
  FormFileUpload,
  FormMultilineTextField,
  FormTextField
} from '../common'
// React
import * as React from 'react'

const EMPTY_TAG_IDS_ARR: number[] = []
const EMPTY_TAG_CODES_ARR: string[] = []

const UPDATE_TEST_TEMPLATE_FORM_PROPS_JOINED =
  updateTestTemplateFormValidator.getPromptsJoined()

const FICT_FILE_TYPE = 'fict'

export interface UpdateTestTemplateFormDialogProps {
  testTemplateId: number | null
  setTestTemplateId: React.Dispatch<React.SetStateAction<number | null>>
  initialTestTemplate: TestTemplateTertiary | null
  onSuccessUpdateTestTemplate?: (
    updateTestTemplateResult: UpdateTestTemplateSuccessResultDto
  ) => void
  onCancelClick?: () => void
}

export function UpdateTestTemplateFormDialog(
  props: UpdateTestTemplateFormDialogProps
) {
  const notifier = useNotifier()
  const meta = useMeta()
  const selfId = React.useMemo(
    () => (meta.status !== 'AUTHENTICATED' ? null : meta.selfMeta.id),
    [meta]
  )

  const [testTemplate, setTestTemplate] =
    React.useState<TestTemplateTertiary | null>(props.initialTestTemplate)
  useTestTemplateSubscription(
    'UP_TO_TERTIARY_PROPS',
    props.testTemplateId,
    setTestTemplate
  )

  const tags = useTags('PRIMARY_PROPS', false, props.testTemplateId !== null)

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
          types: [
            'UPDATE_TEST_TEMPLATE',
            'DELETE_TEST_TEMPLATE',
            'DELETE_TEST_TEMPLATE'
          ]
        }
      },
      (data) => {
        ;(() => {
          if (props.testTemplateId !== null) {
            for (const event of data) {
              if (selfId !== null && event.initiatorId !== selfId) {
                if (
                  event.type === 'UPDATE_TEST_TEMPLATE' &&
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  (event as any).config?.resource?.id === props.testTemplateId
                ) {
                  notifier.showWarning(
                    `редактируемый шаблон теста изменен другим пользователем`
                  )
                } else if (
                  (event.type === 'DELETE_TEST_TEMPLATE' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resource?.id ===
                      props.testTemplateId) ||
                  (event.type === 'DELETE_TEST_TEMPLATE' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    (event as any).config?.resources?.some?.(
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      (resource: any) => resource?.id === props.testTemplateId
                    ))
                ) {
                  notifier.showWarning(
                    `редактируемый шаблон теста удален другим пользователем`
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
  }, [props.testTemplateId, notifier, selfId])

  const submitAction = React.useCallback(
    async (validatedData: UpdateTestTemplateFormData) => {
      if (props.testTemplateId === null) {
        throw new Error('отсутствует идентификатор шаблона теста')
      } else if (testTemplate === null) {
        throw new Error(
          `отсутствует доступ к текущим характеристикам редактируемого шаблона теста`
        )
      } else {
        const {
          descriptionText,
          remarkText,
          config,
          tagIds,
          tagCodesToCreate
        } = validatedData

        const recentlyCreatedTagIds = (tagCodesToCreate ?? [])
          .map((tagCodeToCreate) => tagIdForCode.get(tagCodeToCreate))
          .filter((tagId) => tagId !== undefined)

        const newCreatedTagIds = await createTagsAndGetIds(
          tagIdForCode,
          tagCodesToCreate,
          notifier
        )

        return await serverConnector.updateTestTemplate(
          {
            id: props.testTemplateId,
            code: prepareRequired(testTemplate.code, validatedData.code),
            name: prepareOptional(testTemplate.name, validatedData.name),
            config: prepareFileExtra(testTemplate.config, validatedData.config),
            description: prepareText(testTemplate.description, descriptionText),
            remark: prepareText(testTemplate.remark, remarkText),
            tagIds: prepareArr(testTemplate.tagIds, [
              ...(tagIds ?? []),
              ...recentlyCreatedTagIds,
              ...newCreatedTagIds
            ])
          },
          config?.type !== FICT_FILE_TYPE ? config : undefined
        )
      }
    },
    [props.testTemplateId, notifier, testTemplate, tagIdForCode]
  )

  const onSuccessSubmit = React.useCallback(
    (
      data: UpdateTestTemplateFormData,
      updateTestTemplateResult: UpdateTestTemplateSuccessResultDto
    ) => {
      notifier.showSuccess(`шаблон теста «${testTemplate?.code}» изменен`)
      props.onSuccessUpdateTestTemplate?.(updateTestTemplateResult)
    },
    [props.onSuccessUpdateTestTemplate, notifier, testTemplate]
  )

  const initialFormData: UpdateTestTemplateFormData = React.useMemo(
    () => ({
      code: testTemplate?.code ?? '',
      name: testTemplate?.name ?? undefined,
      config: testTemplate?.config
        ? new File(
            [],
            `${convertNumberOfBytesToStr(testTemplate.config.size)}.${convertFileFormatToExtension(testTemplate.config.format)}`,
            {
              type: FICT_FILE_TYPE
            }
          )
        : undefined,
      descriptionText: testTemplate?.description?.text,
      remarkText: testTemplate?.remark?.text,
      tagIds: testTemplate?.tagIds
    }),
    [testTemplate]
  )

  const {
    formInternal,
    data,
    errors,
    handleTextFieldChange,
    handleAutocompleteMultipleSelectChange,
    handleAutocompleteMultipleSelectFreeItemsChange,
    handleFileUploadChange
  } = useForm<UpdateTestTemplateFormData, UpdateTestTemplateSuccessResultDto>({
    INITIAL_FORM_DATA: initialFormData,
    validator: updateTestTemplateFormValidator,
    clearTrigger: testTemplate?.id,
    submitAction: submitAction,
    onSuccessSubmit: onSuccessSubmit
  })

  const setIsActive = React.useCallback(
    (value: boolean | ((prevState: boolean) => boolean)) => {
      if (value === false) {
        props.setTestTemplateId(null)
      } else {
        throw new Error()
      }
    },
    [props.setTestTemplateId]
  )

  return (
    <FormDialog
      formInternal={formInternal}
      title={`изменить шаблон теста «${testTemplate?.code}»`}
      submitButtonTitle="изменить"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'к текущим значениям'
      }}
      isActive={props.testTemplateId !== null}
      setIsActive={setIsActive}
    >
      <FormBlock title="основная информация">
        <FormTextField
          required
          name="code"
          label="код"
          value={data.code}
          helperText={
            errors?.code ?? UPDATE_TEST_TEMPLATE_FORM_PROPS_JOINED.code ?? ' '
          }
          error={!!errors?.code}
          onChange={handleTextFieldChange}
        />
        <FormTextField
          name="name"
          label="название"
          value={data.name ?? ''}
          helperText={
            errors?.name ?? UPDATE_TEST_TEMPLATE_FORM_PROPS_JOINED.name ?? ' '
          }
          error={!!errors?.name}
          onChange={handleTextFieldChange}
        />
        <FormFileUpload
          name="config"
          label="конфигурация"
          extensions={['zip']}
          value={data.config}
          helperText={
            errors?.config ??
            UPDATE_TEST_TEMPLATE_FORM_PROPS_JOINED.config ??
            ' '
          }
          error={!!errors?.config}
          onChange={handleFileUploadChange}
        />
        <FormMultilineTextField
          name="descriptionText"
          label="описание"
          value={data.descriptionText ?? ''}
          helperText={
            errors?.descriptionText ??
            UPDATE_TEST_TEMPLATE_FORM_PROPS_JOINED.descriptionText ??
            ' '
          }
          error={!!errors?.descriptionText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
      <FormBlock title="дополнительная информация">
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
              addMes(UPDATE_TEST_TEMPLATE_FORM_PROPS_JOINED.tagIds)
              addMes(UPDATE_TEST_TEMPLATE_FORM_PROPS_JOINED.tagCodesToCreate)
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
            UPDATE_TEST_TEMPLATE_FORM_PROPS_JOINED.remarkText ??
            ' '
          }
          error={!!errors?.remarkText}
          onChange={handleTextFieldChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
