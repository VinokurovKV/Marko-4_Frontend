// Project
import type { VersionedResourceType } from '@common/enums'

export const localizationForVersionedResourceType = new Map<
  VersionedResourceType,
  string
>([
  ['ROLE', 'роль'],
  ['USER', 'пользователь'],
  ['TAG', 'тег'],
  ['DOCUMENT', 'документ'],
  ['FRAGMENT', 'фрагмент документа'],
  ['REQUIREMENT', 'требование'],
  ['COMMON_TOPOLOGY', 'общая топология'],
  ['TOPOLOGY', 'топология'],
  // ['DSEF', 'дополнительный формат'],
  ['DBC', 'базовая конфигурация'],
  ['TEST_TEMPLATE', 'шаблон'],
  ['TEST', 'тест'],
  ['SUBGROUP', 'подгруппа'],
  ['GROUP', 'группа'],
  ['DEVICE', 'устройство'],
  ['TASK', 'задание'],
  ['TASK_TEMPLATE', 'шаблон задания']
])
