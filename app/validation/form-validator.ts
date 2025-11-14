// Project
import { restrictionConfig } from '@common/restriction-config'

type FormValidatorOneFieldRuleType =
  | 'REQUIRED'
  | 'NAME_WITHOUT_UNIQUENESS'
  | 'LOGIN_WITHOUT_UNIQUENESS'
  | 'PASS'

type FormValidatorManyFieldsRuleType =
  | 'DISTINCT_NAMES'
  | 'DISTINCT_LOGINS'
  | 'EQUAL_PASSES'

type FormValidatorOneFieldRule<Field extends string> = [
  FormValidatorOneFieldRuleType,
  Field
]

type FormValidatorManyFieldsRule<Field extends string> = [
  FormValidatorManyFieldsRuleType,
  Field[]
]

type FormData = { [index: string]: any }

type FormKey<Data extends FormData> = keyof Data & string

interface FormValidatorRules<Data extends FormData> {
  oneField: FormValidatorOneFieldRule<FormKey<Data>>[]
  manyField: FormValidatorManyFieldsRule<FormKey<Data>>[]
}

type FormValidatorPrompts<Data extends FormData> = {
  [property in keyof Data]?: string[]
}

type FormValidatorErrors<Data extends FormData> = {
  [property in keyof Data]?: string[]
}

type FormValidatorResult<Data extends FormData> =
  | {
      success: true
      result: Data
    }
  | {
      success: false
      errors: FormValidatorErrors<Data>
    }

export class FormValidator<Data extends FormData> {
  constructor(private readonly rules: FormValidatorRules<FormData>) {}

  getPrompts(): FormValidatorPrompts<Data> {
    const prompts: FormValidatorPrompts<Data> = {}
    this.rules.oneField.forEach((rule) => {
      this.addPromptsForOneField({ prompts, rule })
    })
    return prompts
  }

  private addPromptsForOneField(props: {
    prompts: FormValidatorPrompts<Data>
    rule: FormValidatorOneFieldRule<FormKey<FormData>>
  }): void {
    const { prompts } = props
    const [ruleType, field] = props.rule
    switch (ruleType) {
      case 'REQUIRED':
        this.addPrompt(field, prompts, 'обязательное поле')
        return
      case 'NAME_WITHOUT_UNIQUENESS':
        ;(() => {
          const { minLength, maxLength } = restrictionConfig.common.name
          this.addPrompt(field, prompts, `${minLength}-${maxLength} символов`)
        })()
        return
      case 'LOGIN_WITHOUT_UNIQUENESS':
        ;(() => {
          const { minLength, maxLength } = restrictionConfig.common.login
          this.addPrompt(field, prompts, 'ASCII-строка')
          this.addPrompt(field, prompts, 'без пробелов')
          this.addPrompt(field, prompts, `${minLength}-${maxLength} символов`)
        })()
        return
      case 'PASS':
        ;(() => {
          const { minLength, maxLength } = restrictionConfig.common.pass
          this.addPrompt(field, prompts, `${minLength}-${maxLength} символов`)
        })()
        return
    }
  }

  private addPrompt(
    field: FormKey<Data>,
    prompts: FormValidatorPrompts<Data>,
    prompt: string
  ): void {
    if (prompts[field] === undefined) {
      ;(prompts[field] as string[] | undefined) = []
    }
    ;(prompts[field] as string[]).push(prompt)
  }

  validate(data: Data): FormValidatorResult<Data> {
    const result = structuredClone(data)
    const errors: FormValidatorErrors<Data> = {}
    this.prepareData(data)
    this.rules.oneField.forEach((rule) => {
      this.validateOneField({ data: result, errors, rule })
    })
    this.rules.manyField.forEach((rule) => {
      this.validateManyFields({ data: result, errors, rule })
    })
    return Object.keys(errors).every(
      (key) => errors[key] === undefined || errors[key].length === 0
    )
      ? {
          success: true,
          result: result
        }
      : {
          success: false,
          errors: errors
        }
  }

  private prepareData(data: Data): void {
    for (const key of Object.keys(data)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const val = data[key]
      if (typeof val === 'string' && key !== 'pass') {
        ;(data[key] as string) = val.trim()
      }
    }
  }

  private validateOneField(props: {
    data: Data
    errors: FormValidatorErrors<Data>
    rule: FormValidatorOneFieldRule<FormKey<FormData>>
  }): void {
    const { data, errors } = props
    const [ruleType, field] = props.rule
    switch (ruleType) {
      case 'REQUIRED':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        if ([undefined, null, ''].includes(data[field])) {
          this.addError(field, errors, 'поле обязательно для заполнения')
        }
        return
      case 'NAME_WITHOUT_UNIQUENESS':
        this.assertString(
          data[field],
          field,
          errors,
          restrictionConfig.common.name.minLength,
          restrictionConfig.common.name.maxLength
        )
        return
      case 'LOGIN_WITHOUT_UNIQUENESS':
        this.assertString(
          data[field],
          field,
          errors,
          restrictionConfig.common.login.minLength,
          restrictionConfig.common.login.maxLength,
          true,
          true
        )
        return
      case 'PASS':
        this.assertString(
          data[field],
          field,
          errors,
          restrictionConfig.common.pass.minLength,
          restrictionConfig.common.pass.maxLength
        )
        return
    }
  }

  private validateManyFields(props: {
    data: Data
    errors: FormValidatorErrors<Data>
    rule: FormValidatorManyFieldsRule<FormKey<FormData>>
  }): void {
    const { data, errors } = props
    const [ruleType, fields] = props.rule
    switch (ruleType) {
      case 'DISTINCT_NAMES':
        this.assertUniqueness(data, errors, fields, 'неуникальное название')
        return
      case 'DISTINCT_LOGINS':
        this.assertUniqueness(data, errors, fields, 'неуникальный логин')
        return
      case 'EQUAL_PASSES':
        if (fields.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const pass = data[fields[0]]
          for (let i = 1; i < fields.length; i++) {
            const field = fields[i]
            if (data[field] !== pass) {
              this.addError(field, errors, 'пароли должны совпадать')
            }
          }
        }
        return
    }
  }

  private assertString(
    val: any,
    field: FormKey<Data>,
    errors: FormValidatorErrors<Data>,
    minLength: number | undefined,
    maxLength: number | undefined,
    isAscii: boolean = false,
    withoutWhitespace: boolean = false
  ) {
    if (typeof val !== 'string') {
      this.addError(field, errors, 'значение должно быть строкой')
    } else {
      if (minLength !== undefined && val !== '' && val.length < minLength) {
        this.addError(
          field,
          errors,
          `должно быть не менее ${minLength} символов`
        )
      }
      if (maxLength !== undefined && val.length > maxLength) {
        this.addError(
          field,
          errors,
          `должно быть не более ${maxLength} символов`
        )
      }
      if (isAscii && this.isAscii(val) === false) {
        this.addError(field, errors, `допускаются только ASCII-символы`)
      }
      if (withoutWhitespace && this.withWhitespace(val)) {
        this.addError(field, errors, `пробелы не допускаются`)
      }
    }
  }

  private isAscii(str: string): boolean {
    // eslint-disable-next-line no-control-regex
    return /^[\x00-\x7F]*$/.test(str)
  }

  private withWhitespace(str: string): boolean {
    return /^\s*$/.test(str)
  }

  private assertUniqueness(
    data: Data,
    errors: FormValidatorErrors<Data>,
    fields: FormKey<FormData>[],
    message: string
  ) {
    /* eslint-disable */
    for (const field of fields) {
      const val = data[field]
      if (
        [undefined, null, ''].includes(val) === false &&
        fields.some(
          (otherField) => otherField !== field && data[otherField] === val
        )
      ) {
        this.addError(field, errors, message)
      }
    }
    /* eslint-enable */
  }

  private addError(
    field: FormKey<Data>,
    errors: FormValidatorErrors<Data>,
    error: string
  ): void {
    if (errors[field] === undefined) {
      ;(errors[field] as string[] | undefined) = []
    }
    ;(errors[field] as string[]).push(error)
  }
}
