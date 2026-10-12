import { createClient } from "@/lib/supabase/client"
import type { Profile, DbProfile } from "@/types/database"
import { toProfile as mapToProfile } from "@/types/database"
import type { PaginationParams, PaginatedResponse } from "@/types/common"

export async function findManyUsers(
  params: PaginationParams
): Promise<PaginatedResponse<Profile>> {
  const supabase = createClient()
  const { page, limit } = params
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .range(from, to)

  if (error) throw error

  const total = count ?? 0
  return {
    data: (data as DbProfile[]).map(mapToProfile),
    total,
    page,
    limit,
    hasNext: page * limit < total,
  }
}

export async function findUserById(id: string): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  if (error) return null
  return mapToProfile(data as DbProfile)
}
