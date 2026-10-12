import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getItems, getItem, addItem, editItem, removeItem } from "@/services/itemService"
import type { PaginationParams } from "@/types/common"
import type { CreateItemRequest, UpdateItemRequest, ItemFilterParams } from "@/types/api"

export function useItems(
  params: PaginationParams & ItemFilterParams = { page: 1, limit: 20 }
) {
  return useQuery({
    queryKey: ["items", params],
    queryFn: () => getItems(params),
    staleTime: 60 * 1000, // 1분
  })
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ["items", id],
    queryFn: () => getItem(id),
    enabled: !!id,
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateItemRequest) => addItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateItemRequest }) =>
      editItem(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
      queryClient.invalidateQueries({ queryKey: ["items", id] })
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => removeItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })
}
