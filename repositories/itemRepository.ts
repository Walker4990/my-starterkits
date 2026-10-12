import { createClient } from "@/lib/supabase/client"
import type { Item, DbItem } from "@/types/database"
import { toItem } from "@/types/database"
import type { PaginationParams, PaginatedResponse } from "@/types/common"
import type { CreateItemRequest, UpdateItemRequest, ItemFilterParams } from "@/types/api"

export async function findManyItems(
  params: PaginationParams & ItemFilterParams
): Promise<PaginatedResponse<Item>> {
  const supabase = createClient()
  const { page, limit, status, category } = params
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase.from("items").select("*", { count: "exact" })

  if (status) query = query.eq("status", status)
  if (category) query = query.eq("category", category)

  const { data, count, error } = await query.range(from, to)

  if (error) throw error

  const total = count ?? 0
  return {
    data: (data as DbItem[]).map(toItem),
    total,
    page,
    limit,
    hasNext: page * limit < total,
  }
}

export async function findItemById(id: string): Promise<Item | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single()

  if (error) return null
  return toItem(data as DbItem)
}

export async function createItem(payload: CreateItemRequest): Promise<Item> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("items")
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return toItem(data as DbItem)
}

export async function updateItem(
  id: string,
  payload: UpdateItemRequest
): Promise<Item> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("items")
    .update(payload)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return toItem(data as DbItem)
}

export async function deleteItem(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("items").delete().eq("id", id)
  if (error) throw error
}
