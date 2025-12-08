// Project
import { restrictionConfig } from '@common/restriction-config'
// Other
import equal from 'fast-deep-equal'

type FormValidatorFieldTransform =
  | 'EMPTY_ARR_TO_UNDEFINED'
  | 'EMPTY_STR_TO_UNDEFINED'
  | 'STR_TO_NUM'
  | 'TRIM'

type FormValidatorOneFieldRule =
  | 'ALLOW_UNDEFINED'
  | 'AUTOCOMPLETE_FREE_ITEMS'
  | 'BIG_CODE'
  | 'BIG_NAME'
  | 'CODE'
  | 'EMAIL'
  | 'FORENAME'
  | 'IFACE_NAME'
  | 'INT_NON_NEGATIVE'
  | 'LOGIN'
  | 'NAME'
  | 'NOT_EMPTY_STR'
  | 'NOT_UNDEFINED'
  | 'PASS'
  | 'PATRONYMIC'
  | 'PERCENT'
  | 'PDF_EXT'
  | 'PHONE'
  | 'PRIORITY'
  | 'PUBLIC_VERSION'
  | 'SURNAME'
  | 'TEXT'
  | 'TXT_EXT'
  | 'URL'
  | 'VERTEX_NAME'
  | 'ZIP_EXT'

type FormValidatorManyFieldsRule =
  | 'EQUAL_PASSES'
  | 'DISTINCT_LOGINS'
  | 'DISTINCT_NAMES'
  | 'DISTINCT_VERTEX_NAMES'

export type FormData = { [index: string]: any }

export type FormKey<Data extends FormData> = keyof Data & string

export type FormVal<Data extends FormData> = Data[FormKey<Data>]

export interface FormValidatorConfig<Data extends FormData> {
  oneField?: {
    [property in keyof Data]?: {
      transforms?: FormValidatorFieldTransform[]
      rules?: FormValidatorOneFieldRule[]
    }
  }
  manyFields?: [FormValidatorManyFieldsRule, ...FormKey<Data>[]][]
}

export type FormValidatorPrompts<Data extends FormData> = {
  [property in keyof Data]?: string[]
}

export type FormValidatorPromptsJoined<Data extends FormData> = {
  [property in keyof Data]?: string
}

export type FormValidatorErrors<Data extends FormData> = {
  [property in keyof Data]?: string[]
}

export type FormValidatorErrorsJoined<Data extends FormData> = {
  [property in keyof Data]?: string
}

export class FormValidator<Data extends FormData> {
  constructor(private readonly config: FormValidatorConfig<Data>) {}

  getPromptsJoined(): FormValidatorPromptsJoined<Data> {
    const promptsJoined: FormValidatorPromptsJoined<Data> = {}
    const prompts = this.getPrompts()
    for (const field of Object.keys(prompts)) {
      promptsJoined[field as keyof Data] = prompts[field]?.join(', ')
    }
    return promptsJoined
  }

  getPrompts(): FormValidatorPrompts<Data> {
    const prompts: FormValidatorPrompts<Data> = {}
    for (const field of Object.keys(this.config.oneField ?? {})) {
      const fieldPrompts = this.getPromptsForOneField(field)
      if (fieldPrompts !== null) {
        prompts[field as keyof Data] = fieldPrompts
      }
    }
    return prompts
  }

  private getPromptsForOneField(field: FormKey<Data>): string[] | null {
    const props: string[] = []
    const rules = this.config.oneField?.[field]?.rules ?? []
    rules.forEach((rule) => {
      switch (rule) {
        case 'ALLOW_UNDEFINED':
          // props.push('необязательное поле')
          break
        case 'BIG_CODE':
          ;(() => {
            const { minLength, maxLength } = restrictionConfig.common.bigCode
            props.push('ASCII-строка')
            props.push('без пробелов')
            props.push(`${minLength}-${maxLength} символов`)
          })()
          break
        case 'AUTOCOMPLETE_FREE_ITEMS':
          props.push(`используйте 'Enter' для добавления элементов в список`)
          break
        case 'BIG_NAME':
          ;(() => {
            const { minLength, maxLength } = restrictionConfig.common.bigName
            props.push(`${minLength}-${maxLength} символов`)
          })()
          break
        case 'CODE':
          ;(() => {
            const { minLength, maxLength } = restrictionConfig.common.code
            props.push('ASCII-строка')
            props.push('без пробелов')
            props.push(`${minLength}-${maxLength} символов`)
          })()
          break
        case 'EMAIL':
          ;(() => {
            const { maxLength } = restrictionConfig.common.email
            props.push(`не более ${maxLength} символов`)
          })()
          break
        case 'FORENAME':
          ;(() => {
            const { minLength, maxLength } = restrictionConfig.common.forename
            props.push(`${minLength}-${maxLength} символов`)
          })()
          break
        case 'IFACE_NAME':
          ;(() => {
            const { maxLength } =
              restrictionConfig.common.commonTopology.ifaceName
            props.push(`не более ${maxLength} символов`)
          })()
          break
        case 'INT_NON_NEGATIVE':
          ;(() => {
            props.push('целое неотрицательное число')
          })()
          break
        case 'LOGIN':
          ;(() => {
            const { minLength, maxLength } = restrictionConfig.common.login
            props.push('ASCII-строка')
            props.push('без пробелов')
            props.push(`${minLength}-${maxLength} символов`)
          })()
          break
        case 'NAME':
          ;(() => {
            const { minLength, maxLength } = restrictionConfig.common.name
            props.push(`${minLength}-${maxLength} символов`)
          })()
          break
        case 'NOT_EMPTY_STR':
          // props.push('обязательное поле')
          break
        case 'NOT_UNDEFINED':
          // props.push('обязательное поле')
          break
        case 'PASS':
          ;(() => {
            const { minLength, maxLength } = restrictionConfig.common.pass
            props.push(`${minLength}-${maxLength} символов`)
          })()
          break
        case 'PATRONYMIC':
          ;(() => {
            const { minLength, maxLength } = restrictionConfig.common.patronymic
            props.push(`${minLength}-${maxLength} символов`)
          })()
          break
        case 'PERCENT':
          ;(() => {
            props.push('число от 0 до 100')
          })()
          break
        case 'PDF_EXT':
          ;(() => {
            props.push(`допустимые  расширения: '.pdf'`)
          })()
          break
        case 'PHONE':
          ;(() => {
            const { maxLength } = restrictionConfig.common.phone
            props.push(`не более ${maxLength} символов`)
          })()
          break
        case 'PRIORITY':
          ;(() => {
            props.push('0 (по умолчанию) - самый низкий приоритет')
          })()
          break
        case 'PUBLIC_VERSION':
          ;(() => {
            const { maxLength } = restrictionConfig.common.publicVersion
            props.push(`не более ${maxLength} символов`)
          })()
          break
        case 'SURNAME':
          ;(() => {
            const { minLength, maxLength } = restrictionConfig.common.surname
            props.push(`${minLength}-${maxLength} символов`)
          })()
          break
        case 'TEXT':
          ;(() => {
            const { maxLength } = restrictionConfig.common.text
            props.push(`не более ${maxLength} символов`)
          })()
          break
        case 'TXT_EXT':
          ;(() => {
            props.push(`допустимые  расширения: '.txt'`)
          })()
          break
        case 'URL':
          ;(() => {
            const { maxLength } = restrictionConfig.common.url
            props.push(`не более ${maxLength} символов`)
          })()
          break
        case 'VERTEX_NAME':
          ;(() => {
            const { maxLength } =
              restrictionConfig.common.commonTopology.vertexName
            props.push(`не более ${maxLength} символов`)
          })()
          break
        case 'ZIP_EXT':
          ;(() => {
            props.push(`допустимые  расширения: '.zip'`)
          })()
          break
      }
    })
    return props.length > 0 ? props : null
  }

  getTransformed(data: Data): Data {
    const result = structuredClone(data)
    for (const field of Object.keys(data)) {
      this.transformField(result, field)
    }
    return result
  }

  private transformField(data: Data, field: FormKey<Data>): void {
    data[field] = this.getTransformedField(data, field)
  }

  private getTransformedField(
    data: Data,
    field: FormKey<Data>
  ): Data[FormKey<Data>] {
    let val = data[field]
    const transforms = this.config.oneField?.[field]?.transforms ?? []
    transforms.forEach((transform) => {
      switch (transform) {
        case 'EMPTY_ARR_TO_UNDEFINED':
          if ((val as any) instanceof Array && val.length === 0) {
            ;(val as string | undefined) = undefined
          }
          break
        case 'EMPTY_STR_TO_UNDEFINED':
          if (val === '') {
            ;(val as string | undefined) = undefined
          }
          break
        case 'STR_TO_NUM':
          if (typeof val === 'string') {
            const num = parseFloat(val)
            if (num.toString() === val) {
              ;(val as number) = num
            }
          }
          break
        case 'TRIM':
          if (typeof val === 'string') {
            ;(val as string) = (val as string).trim()
          }
          break
      }
    })
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return val
  }

  getErrorsJoined(data: Data): FormValidatorErrorsJoined<Data> | null {
    const errorsJoined: FormValidatorErrorsJoined<Data> = {}
    const errors = this.getErrors(data)
    if (errors === null) {
      return null
    }
    for (const field of Object.keys(errors)) {
      errorsJoined[field as keyof Data] = errors[field]?.join(', ')
    }
    return errorsJoined
  }

  getErrors(data: Data): FormValidatorErrors<Data> | null {
    const resultErrors: FormValidatorErrors<Data> = {}
    function addErrors(field: FormKey<Data>, errors: string[]): void {
      if (resultErrors[field] === undefined) {
        ;(resultErrors[field] as string[] | undefined) = []
      }
      ;(resultErrors[field] as string[]).push(...errors)
    }
    const allRuleFields = this.getAllRuleFields()
    for (const field of allRuleFields) {
      const oneFieldErrors = this.getOneFieldErrors(data, field)
      if (oneFieldErrors !== null) {
        addErrors(field, oneFieldErrors)
      }
    }
    const manyFieldsErrors = this.getManyFieldsErrors(data, allRuleFields)
    if (manyFieldsErrors !== null) {
      for (const field of Object.keys(manyFieldsErrors)) {
        const errors = manyFieldsErrors[field]
        if (errors !== undefined) {
          addErrors(field, errors)
        }
      }
    }
    return Object.keys(resultErrors).every(
      (key) => resultErrors[key] === undefined
    )
      ? null
      : resultErrors
  }

  revalidateJoined(
    data: Data,
    oldErrorsJoined: FormValidatorErrorsJoined<Data> | null,
    updatedFields: FormKey<Data>[]
  ):
    | {
        errorsChanged: false
      }
    | {
        errorsChanged: true
        newErrorsJoined: FormValidatorErrorsJoined<Data> | null
      } {
    const oldErrors = (() => {
      let oldErrors: FormValidatorErrors<Data> | null = {}
      if (oldErrorsJoined === null) {
        oldErrors = null
      } else {
        for (const field of Object.keys(oldErrorsJoined)) {
          oldErrors[field as keyof Data] = oldErrorsJoined[field]?.split(', ')
        }
      }
      return oldErrors
    })()
    const revalidateResult = this.revalidate(data, oldErrors, updatedFields)
    if (revalidateResult.errorsChanged) {
      const newErrors = revalidateResult.newErrors
      const newErrorsJoined = (() => {
        let newErrorsJoined: FormValidatorErrorsJoined<Data> | null = {}
        if (newErrors === null) {
          newErrorsJoined = null
        } else {
          for (const field of Object.keys(newErrors)) {
            newErrorsJoined[field as keyof Data] = newErrors[field]?.join(', ')
          }
        }
        return newErrorsJoined
      })()
      return {
        errorsChanged: true,
        newErrorsJoined: newErrorsJoined
      }
    } else {
      return {
        errorsChanged: false
      }
    }
  }

  revalidate(
    data: Data,
    oldErrors: FormValidatorErrors<Data> | null,
    updatedFields: FormKey<Data>[]
  ):
    | {
        errorsChanged: false
      }
    | {
        errorsChanged: true
        newErrors: FormValidatorErrors<Data> | null
      } {
    const updatedFieldsSet = new Set(updatedFields)
    const usedFieldsSet = new Set(updatedFields)
    ;(this.config.manyFields ?? []).forEach(([, ...ruleFields]) => {
      if (ruleFields.some((field) => updatedFieldsSet.has(field))) {
        for (const field of ruleFields) {
          usedFieldsSet.add(field)
        }
      }
    })
    const usedFields = Array.from(usedFieldsSet)
    const newErrors: FormValidatorErrors<Data> = {}
    function addErrors(field: FormKey<Data>, errors: string[]): void {
      if (newErrors[field] === undefined) {
        ;(newErrors[field] as string[] | undefined) = []
      }
      ;(newErrors[field] as string[]).push(...errors)
    }
    for (const field of usedFields) {
      const oneFieldErrors = this.getOneFieldErrors(data, field)
      if (oneFieldErrors !== null) {
        addErrors(field, oneFieldErrors)
      }
    }
    const manyFieldsErrors = this.getManyFieldsErrors(data, usedFields)
    if (manyFieldsErrors !== null) {
      for (const field of Object.keys(manyFieldsErrors)) {
        const errors = manyFieldsErrors[field]
        if (errors !== undefined) {
          addErrors(field, errors)
        }
      }
    }
    const oldErrorsUnnulled: FormValidatorErrors<Data> = oldErrors ?? {}
    if (
      usedFields.every((field) =>
        equal(oldErrorsUnnulled[field], newErrors[field])
      )
    ) {
      return {
        errorsChanged: false
      }
    } else {
      const allRuleFields = this.getAllRuleFields()
      for (const field of allRuleFields) {
        if (usedFieldsSet.has(field) === false) {
          const errors = oldErrorsUnnulled[field]
          if (errors !== undefined) {
            addErrors(field, errors)
          }
        }
      }
      return {
        errorsChanged: true,
        newErrors: Object.keys(newErrors).every(
          (key) => newErrors[key] === undefined
        )
          ? null
          : newErrors
      }
    }
  }

  private getOneFieldErrors(data: Data, field: FormKey<Data>): string[] | null {
    const errors: string[] = []
    const rules = this.config.oneField?.[field]?.rules ?? []
    const val = this.getTransformedField(data, field)
    let interrupt = false
    for (const rule of rules) {
      if (interrupt) {
        break
      }
      switch (rule) {
        case 'ALLOW_UNDEFINED':
          if (val === undefined) {
            interrupt = true
          }
          break
        case 'BIG_CODE':
          ;(() => {
            const codeErrors = this.getStringErrors(
              val,
              restrictionConfig.common.bigCode.minLength,
              restrictionConfig.common.bigCode.maxLength,
              true,
              true
            )
            if (codeErrors !== null) {
              errors.push(...codeErrors)
            }
          })()
          break
        case 'BIG_NAME':
          ;(() => {
            const nameErrors = this.getStringErrors(
              val,
              restrictionConfig.common.bigName.minLength,
              restrictionConfig.common.bigName.maxLength
            )
            if (nameErrors !== null) {
              errors.push(...nameErrors)
            }
          })()
          break
        case 'CODE':
          ;(() => {
            const codeErrors = this.getStringErrors(
              val,
              restrictionConfig.common.code.minLength,
              restrictionConfig.common.code.maxLength,
              true,
              true
            )
            if (codeErrors !== null) {
              errors.push(...codeErrors)
            }
          })()
          break
        case 'EMAIL':
          ;(() => {
            const emailErrors = this.getStringErrors(
              val,
              undefined,
              restrictionConfig.common.email.maxLength,
              false,
              true
            )
            if (emailErrors !== null) {
              errors.push(...emailErrors)
            }
          })()
          break
        case 'FORENAME':
          ;(() => {
            const forenameErrors = this.getStringErrors(
              val,
              restrictionConfig.common.forename.minLength,
              restrictionConfig.common.forename.maxLength
            )
            if (forenameErrors !== null) {
              errors.push(...forenameErrors)
            }
          })()
          break
        case 'IFACE_NAME':
          ;(() => {
            const ifaceNameErrors = this.getStringErrors(
              val,
              undefined,
              restrictionConfig.common.commonTopology.ifaceName.maxLength
            )
            if (ifaceNameErrors !== null) {
              errors.push(...ifaceNameErrors)
            }
          })()
          break
        case 'INT_NON_NEGATIVE':
          ;(() => {
            if (typeof val !== 'number' || Number.isInteger(val) === false) {
              errors.push('значение должно быть целым числом')
            } else if (val < 0) {
              errors.push('значение должно быть не меньше 0')
            }
          })()
          break
        case 'LOGIN':
          ;(() => {
            const loginErrors = this.getStringErrors(
              val,
              restrictionConfig.common.login.minLength,
              restrictionConfig.common.login.maxLength,
              true,
              true
            )
            if (loginErrors !== null) {
              errors.push(...loginErrors)
            }
          })()
          break
        case 'NAME':
          ;(() => {
            const nameErrors = this.getStringErrors(
              val,
              restrictionConfig.common.name.minLength,
              restrictionConfig.common.name.maxLength
            )
            if (nameErrors !== null) {
              errors.push(...nameErrors)
            }
          })()
          break
        case 'NOT_EMPTY_STR':
          if (val === '') {
            errors.push('поле обязательно для заполнения')
            interrupt = true
          }
          break
        case 'NOT_UNDEFINED':
          if (val === undefined) {
            errors.push('поле обязательно для заполнения')
            interrupt = true
          }
          break
        case 'PASS':
          ;(() => {
            const passErrors = this.getStringErrors(
              val,
              restrictionConfig.common.pass.minLength,
              restrictionConfig.common.pass.maxLength
            )
            if (passErrors !== null) {
              errors.push(...passErrors)
            }
          })()
          break
        case 'PATRONYMIC':
          ;(() => {
            const patronymicErrors = this.getStringErrors(
              val,
              restrictionConfig.common.patronymic.minLength,
              restrictionConfig.common.patronymic.maxLength
            )
            if (patronymicErrors !== null) {
              errors.push(...patronymicErrors)
            }
          })()
          break
        case 'PERCENT':
          ;(() => {
            if (typeof val !== 'number') {
              errors.push('значение должно быть числом')
            } else if (val < 0 || val > 100) {
              errors.push('значение должно принадлежать промежутку от 0 до 100')
            }
          })()
          break
        case 'PDF_EXT':
          ;(() => {
            const fileErrors = this.getFileErrors(val, ['pdf'])
            if (fileErrors !== null) {
              errors.push(...fileErrors)
            }
          })()
          break
        case 'PHONE':
          ;(() => {
            const phoneErrors = this.getStringErrors(
              val,
              undefined,
              restrictionConfig.common.phone.maxLength,
              false,
              true
            )
            if (phoneErrors !== null) {
              errors.push(...phoneErrors)
            }
          })()
          break
        case 'PUBLIC_VERSION':
          ;(() => {
            const publicVersionErrors = this.getStringErrors(
              val,
              undefined,
              restrictionConfig.common.publicVersion.maxLength
            )
            if (publicVersionErrors !== null) {
              errors.push(...publicVersionErrors)
            }
          })()
          break
        case 'SURNAME':
          ;(() => {
            const surnameErrors = this.getStringErrors(
              val,
              restrictionConfig.common.surname.minLength,
              restrictionConfig.common.surname.maxLength
            )
            if (surnameErrors !== null) {
              errors.push(...surnameErrors)
            }
          })()
          break
        case 'TEXT':
          ;(() => {
            const textErrors = this.getStringErrors(
              val,
              undefined,
              restrictionConfig.common.text.maxLength
            )
            if (textErrors !== null) {
              errors.push(...textErrors)
            }
          })()
          break
        case 'TXT_EXT':
          ;(() => {
            const fileErrors = this.getFileErrors(val, ['txt'])
            if (fileErrors !== null) {
              errors.push(...fileErrors)
            }
          })()
          break
        case 'URL':
          ;(() => {
            const urlErrors = this.getStringErrors(
              val,
              undefined,
              restrictionConfig.common.url.maxLength
            )
            if (urlErrors !== null) {
              errors.push(...urlErrors)
            }
          })()
          break
        case 'VERTEX_NAME':
          ;(() => {
            const vertexNameErrors = this.getStringErrors(
              val,
              undefined,
              restrictionConfig.common.commonTopology.vertexName.maxLength
            )
            if (vertexNameErrors !== null) {
              errors.push(...vertexNameErrors)
            }
          })()
          break
        case 'ZIP_EXT':
          ;(() => {
            const fileErrors = this.getFileErrors(val, ['zip'])
            if (fileErrors !== null) {
              errors.push(...fileErrors)
            }
          })()
          break
      }
    }
    return errors.length > 0 ? errors : null
  }

  private getManyFieldsErrors(
    data: Data,
    fields: FormKey<Data>[]
  ): FormValidatorErrors<Data> | null {
    const errors: FormValidatorErrors<Data> = {}
    const fieldsSet = new Set(fields)
    function addError(field: FormKey<Data>, error: string): void {
      if (fieldsSet.has(field) === false) {
        return
      }
      if (errors[field] === undefined) {
        ;(errors[field] as string[] | undefined) = []
      }
      ;(errors[field] as string[]).push(error)
    }
    const valForField = (() => {
      const valForField = new Map<FormKey<Data>, any>()
      for (const field of this.getAllRuleFields()) {
        valForField.set(field, this.getTransformedField(data, field))
      }
      return valForField
    })()
    ;(this.config.manyFields ?? []).forEach(([rule, ...ruleFields]) => {
      if (ruleFields.some((field) => fieldsSet.has(field))) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        const vals = ruleFields.map((field) => valForField.get(field))
        switch (rule) {
          case 'EQUAL_PASSES':
            if (this.isEqual(vals) === false) {
              ruleFields.forEach((field, fieldIndex) => {
                if (fieldIndex !== 0) {
                  addError(field, 'пароли должны совпадать')
                }
              })
            }
            break
          case 'DISTINCT_LOGINS':
            if (this.isDistinct(vals) === false) {
              ruleFields.forEach((field) => {
                addError(field, 'неуникальный логин')
              })
            }
            break
          case 'DISTINCT_NAMES':
            if (this.isDistinct(vals) === false) {
              ruleFields.forEach((field) => {
                addError(field, 'неуникальное название')
              })
            }
            break
          case 'DISTINCT_VERTEX_NAMES':
            if (this.isDistinct(vals) === false) {
              ruleFields.forEach((field) => {
                addError(field, 'неуникальное название вершины')
              })
            }
            break
        }
      }
    })
    return Object.keys(errors).length > 0 ? errors : null
  }

  private getAllRuleFields(): FormKey<Data>[] {
    const fieldsSet = new Set<FormKey<Data>>()
    for (const field of Object.keys(this.config.oneField ?? {})) {
      fieldsSet.add(field)
    }
    ;(this.config.manyFields ?? []).forEach(([, fields]) => {
      for (const field of fields) {
        fieldsSet.add(field)
      }
    })
    return Array.from(fieldsSet)
  }

  private getStringErrors(
    val: any,
    minLength: number | undefined,
    maxLength: number | undefined,
    isAscii: boolean = false,
    withoutWhitespace: boolean = false
  ): string[] | null {
    const errors: string[] = []
    if (typeof val !== 'string') {
      errors.push('значение должно быть строкой')
    } else {
      if (minLength !== undefined && val !== '' && val.length < minLength) {
        errors.push(`допускается не менее ${minLength} символов`)
      }
      if (maxLength !== undefined && val.length > maxLength) {
        errors.push(`допускается не более ${maxLength} символов`)
      }
      if (isAscii && this.isAscii(val) === false) {
        errors.push(`допускаются только ASCII-символы`)
      }
      if (withoutWhitespace && this.withWhitespace(val)) {
        errors.push(`пробелы не допускаются`)
      }
    }
    return errors.length > 0 ? errors : null
  }

  private isAscii(str: string): boolean {
    // eslint-disable-next-line no-control-regex
    return /^[\x00-\x7F]*$/.test(str)
  }

  private withWhitespace(str: string): boolean {
    return /\s+/.test(str)
  }

  private isDistinct(vals: any[]): boolean {
    /* eslint-disable */
    const valsFiltered = vals.filter(
      (val) => [undefined, null].includes(val) === false
    )
    return new Set(valsFiltered).size === valsFiltered.length
    /* eslint-enable */
  }

  private isEqual(vals: any[]): boolean {
    return vals.length === 0 || new Set(vals).size === 1
  }

  private getFileErrors(
    val: any,
    allowedExtensions: string[]
  ): string[] | null {
    const errors: string[] = []
    if (val instanceof File === false) {
      errors.push('значение должно быть файлом')
    } else {
      const extension = val.name.split('.').slice(-1)[0]
      if (allowedExtensions.includes(extension) === false) {
        errors.push(
          `некорректное расширение (${extension}), допустимые  расширения: ${allowedExtensions.map((extension) => `.${extension}`).join(', ')}`
        )
      }
    }
    return errors.length > 0 ? errors : null
  }
}
