import type {
  EventsFilterDto,
  ReadEventsSuccessResultItemDto
} from '@common/dtos/server-api/events.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type EventsFilter = DtoWithoutEnums<EventsFilterDto>
export type SystemEvent = DtoWithoutEnums<ReadEventsSuccessResultItemDto>
