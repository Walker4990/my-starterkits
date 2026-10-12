import {
  findManyItems,
  findItemById,
  createItem,
  updateItem,
  deleteItem,
} from "@/repositories/itemRepository"
import type { Item } from "@/types/database"
import type { PaginationParams, PaginatedResponse } from "@/types/common"
import type { CreateItemRequest, UpdateItemRequest, ItemFilterParams } from "@/types/api"

export async function getItems(
  params: PaginationParams & ItemFilterParams
): Promise<PaginatedResponse<Item>> {
  return findManyItems(params)
}

export async function getItem(id: string): Promise<Item | null> {
  return findItemById(id)
}

export async function addItem(payload: CreateItemRequest): Promise<Item> {
  return createItem(payload)
}

export async function editItem(
  id: string,
  payload: UpdateItemRequest
): Promise<Item> {
  return updateItem(id, payload)
}

export async function removeItem(id: string): Promise<void> {
  return deleteItem(id)
}
