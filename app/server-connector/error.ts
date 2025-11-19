export const SERVER_CONNECTOR_ERROR_STATUS = {
  BAD_REQUEST: 400,
  CONFLICT: 409,
  FORBIDDEN: 403,
  ISE: 500,
  NOT_IMPLEMENTED: 501,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401
} as const

export class ServerConnectorError extends Error {
  readonly status?: number
  readonly message: string
  readonly object?: object
  constructor(status: number | undefined, message: string, object?: object) {
    super()
    this.status = status
    this.message = message
    this.object = object
  }
}

export class ServerConnectorBadRequestError extends ServerConnectorError {
  constructor(message?: string, object?: object) {
    super(
      SERVER_CONNECTOR_ERROR_STATUS.BAD_REQUEST,
      message ?? 'Bad request',
      object
    )
  }
}

export class ServerConnectorConflictError extends ServerConnectorError {
  constructor(message?: string, object?: object) {
    super(SERVER_CONNECTOR_ERROR_STATUS.CONFLICT, message ?? 'Conflict', object)
  }
}

export class ServerConnectorForbiddenError extends ServerConnectorError {
  constructor(message?: string) {
    super(SERVER_CONNECTOR_ERROR_STATUS.FORBIDDEN, message ?? 'Forbidden')
  }
}

export class ServerConnectorIseError extends ServerConnectorError {
  constructor(message?: string, object?: object) {
    super(
      SERVER_CONNECTOR_ERROR_STATUS.ISE,
      message ?? 'Internal server error',
      object
    )
  }
}

export class ServerConnectorNotFoundError extends ServerConnectorError {
  constructor(message?: string, object?: object) {
    super(
      SERVER_CONNECTOR_ERROR_STATUS.NOT_FOUND,
      message ?? 'Not found',
      object
    )
  }
}

export class ServerConnectorUnauthorizedError extends ServerConnectorError {
  constructor(message?: string) {
    super(SERVER_CONNECTOR_ERROR_STATUS.UNAUTHORIZED, message ?? 'Unauthorized')
  }
}
