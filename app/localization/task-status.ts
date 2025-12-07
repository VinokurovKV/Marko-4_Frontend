// Project
import type { TaskStatus } from '@common/enums'

export const localizationForTaskStatus = new Map<TaskStatus, string>([
  ['CREATED', 'создано'],
  ['CREATED_PAUSED', 'создано (приостановлено)'],
  ['CANCELED', 'отменено'],
  ['LAUNCHED', 'запущено'],
  ['LAUNCHED_PAUSED', 'запущено (приостановлено)'],
  ['ABORTED_BY_USER', 'прервано пользователем'],
  ['ABORTED_DUE_TO_NOT_PASSED', 'прервано из-за непрохождения либо ошибки'],
  ['COMPLETED', 'завершено']
])
