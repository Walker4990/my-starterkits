import { create } from "zustand"

type UIStore = {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  activeSection: string | null
  setActiveSection: (section: string | null) => void
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  activeSection: null,
  setActiveSection: (section) => set({ activeSection: section }),
}))
