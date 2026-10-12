import { create } from "zustand"
import { persist } from "zustand/middleware"

type AuthUser = {
  id: string
  username: string
  avatarUrl: string | null
}

type AuthStore = {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    { name: "auth-store" }
  )
)
