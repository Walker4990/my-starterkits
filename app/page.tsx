import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LayoutGrid, FormInput, Table, Plug, ArrowRight } from "lucide-react"

const sections = [
  {
    href: "/components",
    icon: LayoutGrid,
    title: "컴포넌트 갤러리",
    description: "shadcn/ui 컴포넌트를 직접 체험해보세요.",
    badge: "shadcn/ui",
  },
  {
    href: "/forms",
    icon: FormInput,
    title: "폼 예제",
    description: "React Hook Form + Zod로 구현한 타입 안전한 폼을 체험하세요.",
    badge: "React Hook Form",
  },
  {
    href: "/data-table",
    icon: Table,
    title: "데이터 테이블",
    description: "TanStack Query와 Supabase를 연동한 데이터 테이블입니다.",
    badge: "TanStack Query",
  },
  {
    href: "/api-demo",
    icon: Plug,
    title: "API 데모",
    description: "FastAPI 백엔드와 통신하는 예제를 확인하세요.",
    badge: "FastAPI",
  },
]

const stack = [
  "Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4",
  "shadcn/ui", "TanStack Query", "React Hook Form", "Zod",
  "Zustand", "FastAPI", "Supabase",
]

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-16">
      {/* 히어로 */}
      <section className="flex flex-col items-center gap-6 text-center">
        <Badge variant="secondary" className="text-xs">웹 개발 스타터킷</Badge>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          검증된 스택으로<br />빠르게 시작하세요
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Next.js, FastAPI, Supabase 기반의 풀스택 스타터킷입니다.
          각 기술 스택을 직접 체험하고, 코드를 참고하여 프로젝트를 시작하세요.
        </p>
        <div className="flex gap-3">
          <Button size="lg" render={<Link href="/components" />}>
            체험 시작하기 <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" render={<Link href="/api-demo" />}>
            API 데모 보기
          </Button>
        </div>
      </section>

      {/* 기술 스택 */}
      <section className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground">기술 스택</p>
        <div className="flex flex-wrap justify-center gap-2">
          {stack.map((tech) => (
            <Badge key={tech} variant="outline">{tech}</Badge>
          ))}
        </div>
      </section>

      {/* 쇼케이스 섹션 */}
      <section className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ href, icon: Icon, title, description, badge }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <Badge variant="secondary" className="text-xs">{badge}</Badge>
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  )
}
