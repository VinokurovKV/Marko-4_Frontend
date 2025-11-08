// Other
import { format } from 'date-fns'

export type LogMessageType =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'importantError'
  | 'point'
  | 'essential'

export function log(
  messages: (string | number | boolean | object | undefined)[],
  messageType: LogMessageType = 'default'
) {
  logCommon(messages, messageType, false)
}
export function logWithoutTime(
  messages: (string | number | boolean | object | undefined)[],
  messageType: LogMessageType
): void {
  logCommon(messages, messageType, true)
}
export function logCommon(
  messages: (string | number | boolean | object | undefined)[],
  messageType: LogMessageType,
  withoutTime: boolean
): void {
  // eslint-disable-next-line no-constant-binary-expression
  if (2 + 3 === 5 + 2 && messageType === 'default') {
    // TODO: do if app mode === release
    return
  }
  const timeStr = format(new Date(), 'yyyy-MM-dd/HH:mm:ss:SSS')
  const successStyleStr =
    'margin: 0 0 0 3px; border-radius: 5px; background-color: #dcf9db; padding: 3px; color: #123b0e;'
  const warningStyleStr =
    'margin: 0 0 0 3px; border-radius: 5px; background-color: #efefef; padding: 3px; color: #ff9900;'
  const errorStyleStr =
    'margin: 0 0 0 3px; border-radius: 5px; background-color: #f9eceb; padding: 3px; color: #3b120e;'
  const importantErrorStyleStr =
    'margin: 0 0 0 3px; border-radius: 5px; background-color: #f99c9b; padding: 3px 6px; font-weight: bold; color: #3b322e;'
  const pointStyleStr =
    'margin: 0 0 0 3px; border-radius: 5px; background-color: #f9f9dc; padding: 3px; color: #123b0e;'
  const essentialStyleStr = 'font-weight: bold;'
  const boldStyleStr = 'font-weight: bold'
  const normalStyleStr = 'font-weight: normal'
  for (const [index, message] of messages.entries()) {
    if (index === 0 && typeof message === 'string' && withoutTime === false) {
      switch (messageType) {
        case 'default':
          console.log(
            `%c${timeStr}:%c ${message}`,
            boldStyleStr,
            normalStyleStr
          )
          break
        case 'success':
          console.log(
            `%c${timeStr}:%c ${message}`,
            boldStyleStr,
            successStyleStr
          )
          break
        case 'warning':
          console.log(
            `%c${timeStr}:%c ${message}`,
            boldStyleStr,
            warningStyleStr
          )
          break
        case 'error':
          console.log(`%c${timeStr}:%c ${message}`, boldStyleStr, errorStyleStr)
          break
        case 'importantError':
          console.log(
            `%c${timeStr}:%c ${message}`,
            boldStyleStr,
            importantErrorStyleStr
          )
          break
        case 'point':
          console.log(`%c${timeStr}:%c ${message}`, boldStyleStr, pointStyleStr)
          break
        case 'essential':
          console.log(
            `%c${timeStr}:%c ${message}`,
            boldStyleStr,
            essentialStyleStr
          )
          break
      }
    }
    if (index === 0 && typeof message !== 'string' && withoutTime === false) {
      console.log(`%c${timeStr}:`, boldStyleStr)
    }
    if (index > 0 || typeof message !== 'string' || withoutTime) {
      if (typeof message !== 'string') {
        console.log(message)
      } else {
        switch (messageType) {
          case 'default':
            console.log(`%c${message}`, normalStyleStr)
            break
          case 'success':
            console.log(`%c${message}`, successStyleStr)
            break
          case 'warning':
            console.log(`%c${message}`, warningStyleStr)
            break
          case 'error':
            console.log(`%c${message}`, errorStyleStr)
            break
          case 'point':
            console.log(`%c${message}`, pointStyleStr)
            break
          case 'essential':
            console.log(`%c${message}`, essentialStyleStr)
            break
        }
      }
    }
  }
}
export function logPoint(pointNumber: number, prompt?: string): void {
  log(
    [
      `${pointNumber.toString()}${prompt !== undefined ? ' --- ' + prompt : ''}`
    ],
    'point'
  )
}
export function logSeparator(): void {
  console.log('')
}
export function logError(error: Error): void {
  console.error(error)
}
