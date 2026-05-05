// Project
import type { TransitionType } from '@common/enums'

export const localizationForTransitionType = new Map<TransitionType, string>([
  ['CREATE', 'создание'],
  ['UPDATE', 'обновление'],
  ['DELETE', 'удаление']
])
