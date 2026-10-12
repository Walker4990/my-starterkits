"use client"

import Link from "next/link"
import { useAuthStore } from "@/store/authStore"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const { user } = useAuthStore()
  const { signOut } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          스타터킷 쇼케이스
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/components" className="text-muted-foreground hover:text-foreground transition-colors">
            컴포넌트
          </Link>
          <Link href="/forms" className="text-muted-foreground hover:text-foreground transition-colors">
            폼
          </Link>
          <Link href="/data-table" className="text-muted-foreground hover:text-foreground transition-colors">
            데이터 테이블
          </Link>
          <Link href="/api-demo" className="text-muted-foreground hover:text-foreground transition-colors">
            API 데모
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-muted-foreground text-xs" disabled>
                  {user.username}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>로그아웃</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" render={<Link href="/login" />}>
              로그인
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
