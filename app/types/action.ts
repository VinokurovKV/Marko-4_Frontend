import type { ReadActionSuccessResultDto } from '@common/dtos/server-api/actions.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type Action = DtoWithoutEnums<ReadActionSuccessResultDto>
