// Project
import { allRequirementModifiers, allRequirementOrigins } from '@common/enums'
import { allTextFormats } from '@common/formats'
import type { RequirementPrimary, TestPrimary } from '~/types'
import { readFileAsStr } from '~/utilities'
import { serverConnector } from '~/server-connector'
import { useNotifier } from '~/providers/notifier'
import { useTags } from '~/hooks/resources'
import {
  type ImportRequirementsFormData,
  INITIAL_IMPORT_REQUIREMENTS_FORM_DATA,
  importRequirementsFormValidator
} from '~/data/forms/resources/import-requirements'
import {
  FormBlock,
  FormCheckbox,
  FormDialog,
  FormFileUpload,
  useForm
} from '../common'
// React
import * as React from 'react'
// Other
import JSZip from 'jszip'
import * as zod from 'zod'

const MAX_REQUIREMENTS_IN_MESSAGES = 3
const MAX_FILES_IN_MESSAGES = 3

const IMPORT_REQUIREMENTS_FORM_PROPS_JOINED =
  importRequirementsFormValidator.getPromptsJoined()

interface ImportResult {
  createdRequirementCodes: string[]
  ignoredRequirementCodes: string[]
  errorRequirementCodes: string[]
}

const CreateRequirementsConfigValidationSchema = zod.array(
  zod.object({
    code: zod.string(),
    name: zod.string().nullable().optional(),
    origin: zod.literal(allRequirementOrigins),
    modifier: zod.literal(allRequirementModifiers),
    rate: zod.int().min(1),
    testCode: zod.string().nullable().optional(),
    description: zod
      .object({
        format: zod.literal(allTextFormats),
        text: zod.string()
      })
      .nullable()
      .optional(),
    remark: zod
      .object({
        format: zod.literal(allTextFormats),
        text: zod.string()
      })
      .nullable()
      .optional(),
    tagCodes: zod.array(zod.string()).optional(),
    parentRequirementCodes: zod.array(zod.string()).optional(),
    childRequirementCodes: zod.array(zod.string()).optional()
  })
)

type CreateRequirementsConfig = ReturnType<
  (typeof CreateRequirementsConfigValidationSchema)['parse']
>

type CreateRequirementConfig = CreateRequirementsConfig[0]

const OrderConfigValidationSchema = zod.array(zod.string())

export interface ImportRequirementsFormDialogProps {
  requirements: RequirementPrimary[] | null
  tests: TestPrimary[] | null
  importModeIsActive: boolean
  setImportModeIsActive: React.Dispatch<React.SetStateAction<boolean>>
  onSuccessImportRequirements?: () => void
  onCancelClick?: () => void
}

export function ImportRequirementsFormDialog(
  props: ImportRequirementsFormDialogProps
) {
  const notifier = useNotifier()

  const tags = useTags('PRIMARY_PROPS', false, props.importModeIsActive)

  const notifyAboutImportResults = React.useCallback(
    (result: ImportResult) => {
      const successCodes = result.createdRequirementCodes
      const ignoredCodes = result.ignoredRequirementCodes
      const errorCodes = result.errorRequirementCodes
      const successCount = successCodes.length
      const ignoredCount = ignoredCodes.length
      const errorCount = errorCodes.length
      const displayedSuccessCodes = successCodes.slice(
        0,
        MAX_REQUIREMENTS_IN_MESSAGES
      )
      const displayedIgnoredCodes = ignoredCodes.slice(
        0,
        MAX_REQUIREMENTS_IN_MESSAGES
      )
      const displayedErrorCodes = errorCodes.slice(
        0,
        MAX_REQUIREMENTS_IN_MESSAGES
      )
      const hiddenSuccessCount = successCount - displayedSuccessCodes.length
      const hiddenIgnoredCount = ignoredCount - displayedIgnoredCodes.length
      const hiddenErrorCount = errorCount - displayedErrorCodes.length
      const successMessage =
        successCount === 0
          ? '0 требований добавлено'
          : `требовани${successCount === 1 ? 'е' : 'я'}${displayedSuccessCodes.map((code) => ` '${code}'`).join()}${hiddenSuccessCount > 0 ? ` и еще ${hiddenSuccessCount}` : ''} создан${successCount === 1 ? 'о' : 'ы'}`
      const ignoredMessage =
        ignoredCount === 0
          ? null
          : `требовани${ignoredCount === 1 ? 'е' : 'я'}${displayedIgnoredCodes.map((code) => ` '${code}'`).join()}${hiddenIgnoredCount > 0 ? ` и еще ${hiddenIgnoredCount}` : ''} проигнорирован${ignoredCount === 1 ? 'о' : 'ы'}`
      const errorMessage =
        errorCount === 0
          ? null
          : `требовани${errorCount === 1 ? 'е' : 'я'}${displayedErrorCodes.map((code) => ` '${code}'`).join()}${hiddenErrorCount > 0 ? ` и еще ${hiddenErrorCount}` : ''} не создан${errorCount === 1 ? 'о' : 'ы'}`
      if (ignoredMessage === null && errorMessage === null) {
        if (successCount > 0) {
          notifier.showSuccess(successMessage)
        } else {
          notifier.showWarning(successMessage)
        }
      } else if (successCount > 0) {
        notifier.showWarning(
          `${successMessage}${ignoredMessage ? `; ${ignoredMessage}` : ''}${errorMessage ? `; ${errorMessage}` : ''}`
        )
      } else {
        notifier.showError(errorMessage)
      }
    },
    [notifier]
  )

  const submitAction = React.useCallback(
    async (validatedData: ImportRequirementsFormData) => {
      const { config, ignoreTestIfNotExists, interruptIfError } = validatedData

      const tagIdForCode = new Map(
        (tags ?? []).map((tag) => [tag.code, tag.id])
      )

      const requirementIdForCode = new Map(
        (props.requirements ?? []).map((requirement) => [
          requirement.code,
          requirement.id
        ])
      )

      const testIdForCode = new Map(
        (props.tests ?? []).map((test) => [test.code, test.id])
      )

      const result: ImportResult = {
        createdRequirementCodes: [],
        ignoredRequirementCodes: [],
        errorRequirementCodes: []
      }

      const processRequirement = async (params: CreateRequirementConfig) => {
        try {
          if (requirementIdForCode.has(params.code)) {
            if (validatedData.ignoreExistingRequirements) {
              // notifier.showWarning(
              //   `проигнорировано существующее требование «${params.code}»`
              // )
              result.ignoredRequirementCodes.push(params.code)
              return
            } else {
              throw new Error(`существующее требование '${params.code}'`)
            }
          }
          //
          for (const tagCode of params.tagCodes ?? []) {
            if (tagIdForCode.has(tagCode) === false) {
              try {
                const createdTagId = await serverConnector
                  .createTag({
                    code: tagCode
                  })
                  .then((result) => result.result.createdResourceId)
                tagIdForCode.set(tagCode, createdTagId)
              } catch (error) {
                notifier.showError(error, `не удалось создать тег «${tagCode}»`)
                throw error
              }
            }
          }
          const tagIds = params.tagCodes?.map(
            (tagCode) => tagIdForCode.get(tagCode)!
          )
          //
          const nonexistentParentRequirementCodes = (
            params.parentRequirementCodes ?? []
          ).filter((code) => requirementIdForCode.has(code) === false)
          if (nonexistentParentRequirementCodes.length > 0) {
            throw new Error(
              `несуществующие родительские требования ${nonexistentParentRequirementCodes.map((code) => ` '${code}'`).join()}`
            )
          }
          const parentRequirementIds = params.parentRequirementCodes?.map(
            (requirementCode) => requirementIdForCode.get(requirementCode)!
          )
          //
          const nonexistentChildRequirementCodes = (
            params.childRequirementCodes ?? []
          ).filter((code) => requirementIdForCode.has(code) === false)
          if (nonexistentChildRequirementCodes.length > 0) {
            throw new Error(
              `несуществующие дочерние требования ${nonexistentChildRequirementCodes.map((code) => ` '${code}'`).join()}`
            )
          }
          const childRequirementIds = params.childRequirementCodes?.map(
            (requirementCode) => requirementIdForCode.get(requirementCode)!
          )
          //
          const testId = (() => {
            const testCode = params.testCode
            if (testCode !== null && testCode !== undefined) {
              const testId = testIdForCode.get(testCode)
              if (testId === undefined) {
                if (ignoreTestIfNotExists) {
                  notifier.showWarning(
                    `проигнорирован несуществующий тест «${testCode}» для требования «${params.code}»`
                  )
                  return null
                } else {
                  throw new Error(`несуществующий тест «${testCode}»`)
                }
              } else {
                return testId
              }
            } else {
              return null
            }
          })()
          //
          const createdRequirementId = await serverConnector
            .createRequirement({
              code: params.code,
              name: params.name,
              modifier: params.modifier,
              origin: params.origin,
              rate: params.rate,
              testId: testId,
              description: params.description,
              remark: params.remark,
              tagIds: tagIds,
              parentRequirementIds: parentRequirementIds,
              childRequirementIds: childRequirementIds
            })
            .then((result) => result.result.createdResourceId)
          requirementIdForCode.set(params.code, createdRequirementId)
          result.createdRequirementCodes.push(params.code)
        } catch (error) {
          result.errorRequirementCodes.push(params.code)
          notifier.showError(
            error,
            `не удалось создать требование «${params.code}»`
          )
          if (validatedData.interruptIfError) {
            throw error
          }
        }
      }

      const processJsonFile = async (file: File) => {
        const str = await (async () => {
          try {
            return await readFileAsStr(file)
          } catch (error) {
            notifier.showError(
              error,
              `не удалось прочитать JSON-файл «${file.name}»`
            )
            throw error
          }
        })()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const createRequirementsConfig = await (async () => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return await JSON.parse(str)
          } catch (error) {
            notifier.showError(
              error,
              `не удалось распарсить JSON-файл «${file.name}»`
            )
            throw error
          }
        })()
        const createRequirementsConfigValidated = (() => {
          try {
            return CreateRequirementsConfigValidationSchema.parse(
              createRequirementsConfig
            )
          } catch (error) {
            notifier.showError(
              error,
              `неверный формат JSON-файла «${file.name}»`
            )
            throw error
          }
        })()
        for (const config of createRequirementsConfigValidated) {
          await processRequirement(config)
        }
      }

      const processZipFile = async (file: File) => {
        const ORDER_FILE_NAME = 'order.json'
        const zip = await (async () => {
          try {
            return await JSZip.loadAsync(file)
          } catch (error) {
            notifier.showError(
              error,
              `не удалось прочитать ZIP-архив «${file.name}»`
            )
            throw error
          }
        })()
        const fileNames = Object.keys(zip.files)
        if (fileNames.includes(ORDER_FILE_NAME) === false) {
          const error = new Error(
            `в ZIP-архиве «${file.name}» отсутствует файл «${ORDER_FILE_NAME}»`
          )
          notifier.showError(error)
          throw error
        }
        const orderConfig = await (async () => {
          try {
            return await zip.file(ORDER_FILE_NAME)!.async('string')
          } catch (error) {
            notifier.showError(
              error,
              `не удалось прочитать файл «${ORDER_FILE_NAME}» из ZIP-архива «${file.name}»`
            )
            throw error
          }
        })()
        const orderConfigValidated = (() => {
          try {
            return OrderConfigValidationSchema.parse(orderConfig)
          } catch (error) {
            notifier.showError(
              error,
              `неверный формат файла «${ORDER_FILE_NAME}» из ZIP-архива «${file.name}»`
            )
            throw error
          }
        })()
        const fileNamesSet = new Set(fileNames)
        const nonexistentFiles = orderConfigValidated.filter(
          (fileName) => fileNamesSet.has(fileName) === false
        )
        const nonexistentFilesCount = nonexistentFiles.length
        const displayedNonexistentFiles = nonexistentFiles.slice(
          0,
          MAX_FILES_IN_MESSAGES
        )
        const hiddenNonexistentFilesCount =
          nonexistentFilesCount - displayedNonexistentFiles.length
        if (nonexistentFiles.length > 0) {
          const error = new Error(
            `в ZIP-архиве «${file.name}» отсутству${nonexistentFilesCount === 1 ? 'е' : 'ю'}т файл${nonexistentFilesCount === 1 ? '' : 'ы'}${displayedNonexistentFiles.map((fileName) => ` «${fileName}»`).join()}${hiddenNonexistentFilesCount > 0 ? ` и еще ${hiddenNonexistentFilesCount}` : ''}`
          )
          notifier.showError(error)
          throw error
        }
        for (const fileName of orderConfigValidated) {
          const blob = await (async () => {
            try {
              return await zip.file(fileName)!.async('blob')
            } catch (error) {
              notifier.showError(
                error,
                `не удалось прочитать файл «${fileName}» из ZIP-архива «${file.name}»`
              )
              throw error
            }
          })()
          try {
            await processJsonFile(new File([blob], fileName))
          } catch (error) {
            if (interruptIfError) {
              throw error
            }
          }
        }
      }

      const extension = (() => {
        const parts = config!.name.split('.')
        return parts.length <= 1 ? null : parts[parts.length - 1]
      })()

      try {
        if (extension !== 'json' && extension !== 'zip') {
          const error = new Error(`некорректное расширение файла`)
          notifier.showError(error)
          throw error
        } else if (extension === 'json') {
          await processJsonFile(config!)
        } else {
          await processZipFile(config!)
        }
      } catch (error) {
        notifyAboutImportResults(result)
        throw error
      }

      notifyAboutImportResults(result)
      if (result.errorRequirementCodes.length > 0) {
        throw new Error(
          `не созданы требования ${result.errorRequirementCodes.map((code) => ` «${code}»`).join()}`
        )
      }
      return result
    },
    [notifier, tags, props.requirements, props.tests]
  )

  const {
    formInternal,
    data,
    errors,
    handleCheckboxChange,
    handleFileUploadChange
  } = useForm<ImportRequirementsFormData, ImportResult>({
    INITIAL_FORM_DATA: INITIAL_IMPORT_REQUIREMENTS_FORM_DATA,
    validator: importRequirementsFormValidator,
    submitAction: submitAction,
    onSuccessSubmit: props.onSuccessImportRequirements
  })

  return (
    <FormDialog
      formInternal={formInternal}
      title="импортировать требования"
      submitButtonTitle="импортировать"
      cancelButton={{
        title: 'отменить',
        onClick: props.onCancelClick
      }}
      clearButton={{
        title: 'очистить'
      }}
      isActive={props.importModeIsActive}
      setIsActive={props.setImportModeIsActive}
    >
      <FormBlock title="импортируемые данные">
        <FormFileUpload
          required
          name="config"
          label="файл со списком импортируемых требований"
          extensions={['json', 'zip']}
          value={data.config}
          helperText={
            errors?.config ??
            IMPORT_REQUIREMENTS_FORM_PROPS_JOINED.config ??
            ' '
          }
          error={!!errors?.config}
          onChange={handleFileUploadChange}
        />
      </FormBlock>
      <FormBlock title="параметры импорта">
        <FormCheckbox
          name="ignoreExistingRequirements"
          label="игнорировать требование при его наличии в системе"
          checked={data.ignoreExistingRequirements}
          onChange={handleCheckboxChange}
        />
        <FormCheckbox
          name="ignoreTestIfNotExists"
          label="игнорировать тест при его отсутствии в системе"
          checked={data.ignoreTestIfNotExists}
          onChange={handleCheckboxChange}
        />
        <FormCheckbox
          name="interruptIfError"
          label="прерывать создание оставшихся требований при возникновении ошибки"
          checked={data.interruptIfError}
          onChange={handleCheckboxChange}
        />
      </FormBlock>
    </FormDialog>
  )
}
