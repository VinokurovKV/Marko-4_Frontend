// Project
import type { TaskMode } from '@common/enums'

export const localizationForTaskMode = new Map<TaskMode, string>([
  ['TEST', 'тестирование'],
  [
    'GENERATE_PASS_CRITERIA_WITHOUT_UPDATE',
    'генерирование критериев прохождения без обновления тестов'
  ],
  [
    'GENERATE_PASS_CRITERIA_WITH_UPDATE',
    'генерирование критериев прохождения с обновлением тестов'
  ]
])
