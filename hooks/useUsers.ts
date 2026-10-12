import { useQuery } from "@tanstack/react-query"
import { getUsers, getUser } from "@/services/userService"
import type { PaginationParams } from "@/types/common"

export function useUsers(params: PaginationParams = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => getUsers(params),
    staleTime: 5 * 60 * 1000, // 5분
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => getUser(id),
    enabled: !!id,
  })
}
