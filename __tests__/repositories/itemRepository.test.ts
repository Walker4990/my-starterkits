import { describe, it, expect, vi, beforeEach } from "vitest"
import { findItemById } from "@/repositories/itemRepository"
import { createClient } from "@/lib/supabase/client"

vi.mock("@/lib/supabase/client")

const dbItem = {
  id: "item-1",
  title: "테스트 아이템",
  description: null,
  status: "active",
  category: null,
  price: null,
  owner_id: "user-1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

function mockMaybeSingle(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result)
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })
  vi.mocked(createClient).mockReturnValue({ from } as unknown as ReturnType<typeof createClient>)
  return { maybeSingle }
}

describe("itemRepository.findItemById", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("행이 없으면 null을 반환한다", async () => {
    mockMaybeSingle({ data: null, error: null })

    await expect(findItemById("not-exist")).resolves.toBeNull()
  })

  it("행이 있으면 camelCase 도메인 타입으로 변환해 반환한다", async () => {
    mockMaybeSingle({ data: dbItem, error: null })

    const item = await findItemById("item-1")

    expect(item).toMatchObject({ id: "item-1", ownerId: "user-1" })
  })

  it("DB 에러는 삼키지 않고 던진다", async () => {
    const dbError = { message: "permission denied", code: "42501" }
    mockMaybeSingle({ data: null, error: dbError })

    await expect(findItemById("item-1")).rejects.toBe(dbError)
  })
})
