// Project
import type { TextWithFormatDto } from '@common/dtos'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { serverConnector } from '~/server-connector'
import type { Notifier } from '~/providers/notifier'

type TextWithFormat = DtoWithoutEnums<TextWithFormatDto>

export function prepareRequiredFieldForUpdate<Type>(
  currentVal: Type,
  newVal: Type
) {
  return newVal !== currentVal ? newVal : undefined
}

export function prepareOptionalFieldForUpdate<Type>(
  currentVal: Type | null,
  newVal: Type | undefined
) {
  return newVal === undefined
    ? currentVal === null
      ? undefined
      : null
    : newVal !== currentVal
      ? newVal
      : undefined
}

export function prepareTextFieldForUpdate(
  currentText: TextWithFormat | null,
  newText: string | undefined
) {
  return newText === undefined
    ? currentText === null
      ? undefined
      : null
    : currentText === null ||
        currentText.format !== 'PLAIN' ||
        currentText.text !== newText
      ? ({
          format: 'PLAIN',
          text: newText
        } as const)
      : undefined
}

export function prepareArrFieldForUpdate<Item>(
  currentArr: Item[],
  newArr: Item[] | undefined
) {
  const currentArrSet = new Set(currentArr)
  const newArrSet = new Set(newArr)
  const added = (newArr ?? []).filter(
    (item) => currentArrSet.has(item) === false
  )
  const removed = currentArr.filter((item) => newArrSet.has(item) === false)
  return added.length !== 0 || removed.length !== 0
    ? {
        added: added.length !== 0 ? added : undefined,
        removed: removed.length !== 0 ? removed : undefined
      }
    : undefined
}

export async function createTagsAndGetIds(
  tagIdForCode: Map<string, number>,
  tagCodesToCreate: string[] | undefined,
  notifier: Notifier
) {
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
    .map((result) => (result.status === 'fulfilled' ? result.value : null))
    .filter((result) => result !== null)
  return newCreatedTagIds
}
