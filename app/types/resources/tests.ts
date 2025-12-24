import type {
  TestsFilterDto,
  ReadTestWithPrimaryPropsSuccessResultDto,
  ReadTestWithUpToSecondaryPropsSuccessResultDto,
  ReadTestWithUpToTertiaryPropsSuccessResultDto,
  ReadTestWithAllPropsSuccessResultDto,
  ReadTestVersionSuccessResultDto
} from '@common/dtos/server-api/tests.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type TestsFilter = DtoWithoutEnums<TestsFilterDto>
export type TestPrimary =
  DtoWithoutEnums<ReadTestWithPrimaryPropsSuccessResultDto>
export type TestSecondary =
  DtoWithoutEnums<ReadTestWithUpToSecondaryPropsSuccessResultDto>
export type TestTertiary =
  DtoWithoutEnums<ReadTestWithUpToTertiaryPropsSuccessResultDto>
export type TestAll = DtoWithoutEnums<ReadTestWithAllPropsSuccessResultDto>
export type TestVersion = DtoWithoutEnums<ReadTestVersionSuccessResultDto>
