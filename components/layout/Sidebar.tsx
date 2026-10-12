"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutGrid, FormInput, Table, Plug, Home } from "lucide-react"

const navItems = [
  { label: "홈", href: "/", icon: Home },
  { label: "컴포넌트 갤러리", href: "/components", icon: LayoutGrid },
  { label: "폼 예제", href: "/forms", icon: FormInput },
  { label: "데이터 테이블", href: "/data-table", icon: Table },
  { label: "API 데모", href: "/api-demo", icon: Plug },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 flex-col gap-1 border-r px-3 py-6">
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        쇼케이스
      </p>
      {navItems.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
            pathname === href
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}
    </aside>
  )
}
