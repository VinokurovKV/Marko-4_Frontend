import type {
  ReadDocumentWithPrimaryPropsSuccessResultDto,
  ReadDocumentWithUpToSecondaryPropsSuccessResultDto,
  ReadDocumentWithUpToTertiaryPropsSuccessResultDto,
  ReadDocumentWithAllPropsSuccessResultDto,
  ReadDocumentVersionSuccessResultDto
} from '@common/dtos/server-api/documents.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type DocumentPrimary =
  DtoWithoutEnums<ReadDocumentWithPrimaryPropsSuccessResultDto>
export type DocumentSecondary =
  DtoWithoutEnums<ReadDocumentWithUpToSecondaryPropsSuccessResultDto>
export type DocumentTertiary =
  DtoWithoutEnums<ReadDocumentWithUpToTertiaryPropsSuccessResultDto>
export type DocumentAll =
  DtoWithoutEnums<ReadDocumentWithAllPropsSuccessResultDto>
export type DocumentVersion =
  DtoWithoutEnums<ReadDocumentVersionSuccessResultDto>
