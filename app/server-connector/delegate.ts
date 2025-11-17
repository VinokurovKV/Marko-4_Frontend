// Project
import type { LoginSuccessResultDto } from '@common/dtos/server-api/auth.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'

export type ServerConnectorCredentials = DtoWithoutEnums<LoginSuccessResultDto>

export interface ServerConnectorDelegate {
  getCredentials(): ServerConnectorCredentials | null
  setCredentials(credentials: ServerConnectorCredentials): void
  deleteCredentials(): void
  // getRefreshTokenData(): { token: string; expirationTime: Date } | null
  // setRefreshTokenData(token: string, expirationTime: Date): void
  // deleteRefreshTokenData(): void
  // getAccessTokenData(): { token: string; expirationTime: Date } | null
  // setAccessTokenData(token: string, expirationTime: Date): void
  // deleteAccessTokenData(): void
}
