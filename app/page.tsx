import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"
import { ShowcaseCards } from "@/components/showcase/ShowcaseCards"

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
      <ShowcaseCards />
    </div>
  )
}
