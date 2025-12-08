// Project
import type { TestStatus } from '@common/enums'

export const localizationForTestStatus = new Map<TestStatus, string>([
  ['WAITING', 'ожидает запуска'],
  ['CANCELED', 'отменен'],
  ['LAUNCHED', 'запущен'],
  ['ABORTED', 'прерван'],
  ['ERROR', 'ошибка'],
  ['FAILED', 'не прошел'],
  ['PASSED', 'прошел']
])
