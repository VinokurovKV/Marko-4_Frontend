// Project
import type { TaskResultToSave } from '@common/enums'

export const localizationForTaskResultToSave = new Map<
  TaskResultToSave,
  string
>([
  ['INPUT_PCAPS', 'входной трафик'],
  ['OUTPUT_PCAPS', 'выходной трафик'],
  ['TRAFFIC_GEN_STATS', 'статистика генератора'],
  ['DUT_COUNTERS', 'счетчики устройств'],
  ['DUT_TABLES', 'таблицы устройств'],
  ['LOGS', 'логи']
])
