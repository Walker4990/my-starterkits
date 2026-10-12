import { SectionHeader } from "@/components/showcase/SectionHeader"
import { UserTable } from "@/components/data/UserTable"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function DataTablePage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <SectionHeader
        title="데이터 테이블"
        description="TanStack Query로 Supabase 데이터를 페칭하는 테이블 데모입니다."
      />

      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
          <CardDescription>
            Supabase profiles 테이블에서 데이터를 가져옵니다.
            Supabase 연결이 필요합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserTable />
        </CardContent>
      </Card>
    </div>
  )
}
