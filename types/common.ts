export type ApiResponse<T> = {
  data: T
  requestId: string
  timestamp: string
}

export type ApiError = {
  message: string
  code: string
  requestId: string
  statusCode: number
}

export type PaginationParams = {
  page: number
  limit: number
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}
