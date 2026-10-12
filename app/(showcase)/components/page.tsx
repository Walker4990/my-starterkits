import { SectionHeader } from "@/components/showcase/SectionHeader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ComponentsPage() {
  return (
    <div className="space-y-10 max-w-3xl">
      <SectionHeader
        title="컴포넌트 갤러리"
        description="shadcn/ui 기반 컴포넌트 모음입니다."
      />

      {/* 버튼 */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Button</h3>
        <div className="flex flex-wrap gap-3">
          <Button>기본</Button>
          <Button variant="secondary">보조</Button>
          <Button variant="outline">아웃라인</Button>
          <Button variant="ghost">고스트</Button>
          <Button variant="destructive">위험</Button>
          <Button disabled>비활성화</Button>
          <Button size="sm">작게</Button>
          <Button size="lg">크게</Button>
        </div>
      </section>

      <Separator />

      {/* 배지 */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Badge</h3>
        <div className="flex flex-wrap gap-3">
          <Badge>기본</Badge>
          <Badge variant="secondary">보조</Badge>
          <Badge variant="outline">아웃라인</Badge>
          <Badge variant="destructive">위험</Badge>
        </div>
      </section>

      <Separator />

      {/* 카드 */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Card</h3>
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>카드 제목</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">카드 내용이 여기에 들어갑니다.</p>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* 아바타 */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Avatar</h3>
        <div className="flex gap-3">
          <Avatar>
            <AvatarFallback>홍</AvatarFallback>
          </Avatar>
          <Avatar className="h-12 w-12">
            <AvatarFallback>김</AvatarFallback>
          </Avatar>
        </div>
      </section>

      <Separator />

      {/* 입력 */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Input & Label</h3>
        <div className="max-w-sm space-y-2">
          <Label htmlFor="demo-input">이메일</Label>
          <Input id="demo-input" type="email" placeholder="example@email.com" />
        </div>
        <div className="max-w-sm space-y-2">
          <Label htmlFor="demo-disabled">비활성화</Label>
          <Input id="demo-disabled" disabled placeholder="비활성화된 입력" />
        </div>
      </section>

      <Separator />

      {/* 스켈레톤 */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Skeleton</h3>
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </section>
    </div>
  )
}
