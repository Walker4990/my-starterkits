import { findManyUsers, findUserById } from "@/repositories/userRepository"
import type { Profile } from "@/types/database"
import type { PaginationParams, PaginatedResponse } from "@/types/common"

export async function getUsers(
  params: PaginationParams
): Promise<PaginatedResponse<Profile>> {
  return findManyUsers(params)
}

export async function getUser(id: string): Promise<Profile | null> {
  return findUserById(id)
}
