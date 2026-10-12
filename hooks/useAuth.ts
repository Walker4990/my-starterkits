"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/store/authStore"

export function useAuth() {
  const { user, setUser, clearUser } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          username: session.user.email ?? session.user.id,
          avatarUrl: session.user.user_metadata?.avatar_url ?? null,
        })
      }
    })

    // 세션 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          username: session.user.email ?? session.user.id,
          avatarUrl: session.user.user_metadata?.avatar_url ?? null,
        })
      } else {
        clearUser()
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    clearUser()
  }

  return { user, signIn, signUp, signOut }
}
