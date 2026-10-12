"use client"

import { useUsers } from "@/hooks/useUsers"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

export function UserTable() {
  const { data, isLoading, isError } = useUsers({ page: 1, limit: 10 })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-destructive text-sm">
        데이터를 불러오는 중 오류가 발생했습니다.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>사용자명</TableHead>
            <TableHead>표시 이름</TableHead>
            <TableHead>가입일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.data.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground text-center">
                데이터가 없습니다.
              </TableCell>
            </TableRow>
          )}
          {data?.data.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.username}</TableCell>
              <TableCell>{user.displayName ?? "-"}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(user.createdAt).toLocaleDateString("ko-KR")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data && (
        <p className="text-muted-foreground text-xs">
          전체 {data.total}명 중 {data.data.length}명 표시
        </p>
      )}
    </div>
  )
}
