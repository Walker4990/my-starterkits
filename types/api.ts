import type { ItemStatus } from "./database"

// FastAPI 요청 타입
export type CreateItemRequest = {
  title: string
  description?: string
  status?: ItemStatus
  category?: string
  price?: number
}

export type UpdateItemRequest = Partial<CreateItemRequest>

export type CreateUserRequest = {
  username: string
  displayName?: string
  bio?: string
}

export type UpdateUserRequest = Partial<CreateUserRequest> & {
  avatarUrl?: string
}

// FastAPI 쿼리 파라미터
export type ItemFilterParams = {
  page?: number
  limit?: number
  status?: ItemStatus
  category?: string
}

export type UserFilterParams = {
  page?: number
  limit?: number
}
