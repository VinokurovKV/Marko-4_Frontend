export interface ServerConnectorDelegate {
  getRefreshTokenData(): { token: string; expirationTime: Date } | null
  setRefreshTokenData(token: string, expirationTime: Date): void
  deleteRefreshTokenData(): void
  getAccessTokenData(): { token: string; expirationTime: Date } | null
  setAccessTokenData(token: string, expirationTime: Date): void
  deleteAccessTokenData(): void
}
