import { Sidebar } from "@/components/layout/Sidebar"

export default function ShowcaseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <div className="flex-1 overflow-auto p-8">{children}</div>
    </div>
  )
}
