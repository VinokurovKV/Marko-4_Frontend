// Project
import type { VersionedResourceTypePlural } from '@common/enums'

export const localizationForVersionedResourceTypePlural = new Map<
  VersionedResourceTypePlural,
  string
>([
  ['ROLES', 'роли'],
  ['USERS', 'пользователи'],
  ['TAGS', 'теги'],
  ['DOCUMENTS', 'документы'],
  ['FRAGMENTS', 'фрагменты документов'],
  ['REQUIREMENTS', 'требования'],
  ['COMMON_TOPOLOGIES', 'общие топологии'],
  ['TOPOLOGIES', 'топологии'],
  // ['DSEFS', 'дополнительные форматы'],
  ['DBCS', 'базовые конфигурации'],
  ['TEST_TEMPLATES', 'шаблоны'],
  ['TESTS', 'тесты'],
  ['SUBGROUPS', 'подгруппы'],
  ['GROUPS', 'группы'],
  ['DEVICES', 'устройства'],
  ['TASKS', 'задания'],
  ['TASK_TEMPLATES', 'шаблоны заданий']
])
