"use client"

import { useState } from "react"
import Link from "next/link"
import { LayoutGrid, FormInput, Table, Plug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ContactForm } from "@/components/forms/ContactForm"
import { UserTable } from "@/components/data/UserTable"

type SectionKey = "components" | "forms" | "data-table" | "api-demo"

type Section = {
  key: SectionKey
  href: string
  icon: React.ElementType
  title: string
  description: string
  badge: string
}

const sections: Section[] = [
  {
    key: "components",
    href: "/components",
    icon: LayoutGrid,
    title: "컴포넌트 갤러리",
    description: "shadcn/ui 컴포넌트를 직접 체험해보세요.",
    badge: "shadcn/ui",
  },
  {
    key: "forms",
    href: "/forms",
    icon: FormInput,
    title: "폼 예제",
    description: "React Hook Form + Zod로 구현한 타입 안전한 폼을 체험하세요.",
    badge: "React Hook Form",
  },
  {
    key: "data-table",
    href: "/data-table",
    icon: Table,
    title: "데이터 테이블",
    description: "TanStack Query와 Supabase를 연동한 데이터 테이블입니다.",
    badge: "TanStack Query",
  },
  {
    key: "api-demo",
    href: "/api-demo",
    icon: Plug,
    title: "API 데모",
    description: "FastAPI 백엔드와 통신하는 예제를 확인하세요.",
    badge: "FastAPI",
  },
]

const endpoints = [
  { method: "GET", path: "/health" },
  { method: "GET", path: "/api/v1/users" },
  { method: "GET", path: "/api/v1/users/:id" },
  { method: "POST", path: "/api/v1/users" },
  { method: "PUT", path: "/api/v1/users/:id" },
  { method: "DELETE", path: "/api/v1/users/:id" },
  { method: "GET", path: "/api/v1/items" },
  { method: "POST", path: "/api/v1/items" },
  { method: "PUT", path: "/api/v1/items/:id" },
  { method: "DELETE", path: "/api/v1/items/:id" },
]

function ShowcasePreview({ sectionKey }: { sectionKey: SectionKey | null }) {
  switch (sectionKey) {
    case "components":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Button</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">기본</Button>
              <Button size="sm" variant="secondary">보조</Button>
              <Button size="sm" variant="outline">아웃라인</Button>
              <Button size="sm" variant="ghost">고스트</Button>
              <Button size="sm" variant="destructive">위험</Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Badge</p>
            <div className="flex flex-wrap gap-2">
              <Badge>기본</Badge>
              <Badge variant="secondary">보조</Badge>
              <Badge variant="outline">아웃라인</Badge>
              <Badge variant="destructive">위험</Badge>
            </div>
          </div>
        </div>
      )
    case "forms":
      return <ContactForm />
    case "data-table":
      return <UserTable />
    case "api-demo":
      return (
        <div className="space-y-2 text-sm font-mono">
          {endpoints.map(({ method, path }) => (
            <div key={`${method}-${path}`} className="flex items-center gap-3">
              <Badge
                variant={method === "GET" ? "secondary" : method === "POST" ? "default" : "outline"}
                className="w-16 justify-center text-xs"
              >
                {method}
              </Badge>
              <span className="text-muted-foreground">{path}</span>
            </div>
          ))}
        </div>
      )
    default:
      return null
  }
}

export function ShowcaseCards() {
  const [openKey, setOpenKey] = useState<SectionKey | null>(null)
  const activeSection = sections.find((s) => s.key === openKey) ?? null

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ key, icon: Icon, title, description, badge }) => (
          <button
            key={key}
            onClick={() => setOpenKey(key)}
            className="w-full text-left"
          >
            <Card className="h-full cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <Badge variant="secondary" className="text-xs">{badge}</Badge>
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </button>
        ))}
      </section>

      <Dialog open={openKey !== null} onOpenChange={(open) => { if (!open) setOpenKey(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{activeSection?.title}</DialogTitle>
          </DialogHeader>
          <ShowcasePreview sectionKey={openKey} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenKey(null)}>
              닫기
            </Button>
            {activeSection && (
              <Button
                render={<Link href={activeSection.href} />}
                onClick={() => setOpenKey(null)}
              >
                전체 보기 →
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
