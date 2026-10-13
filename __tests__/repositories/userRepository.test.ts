import { describe, it, expect, vi, beforeEach } from "vitest"
import { findUserById } from "@/repositories/userRepository"
import { createClient } from "@/lib/supabase/client"

vi.mock("@/lib/supabase/client")

const dbProfile = {
  id: "user-1",
  username: "testuser",
  display_name: "테스트 사용자",
  avatar_url: null,
  bio: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

function mockMaybeSingle(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result)
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })
  vi.mocked(createClient).mockReturnValue({ from } as unknown as ReturnType<typeof createClient>)
}

describe("userRepository.findUserById", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("행이 없으면 null을 반환한다", async () => {
    mockMaybeSingle({ data: null, error: null })

    await expect(findUserById("not-exist")).resolves.toBeNull()
  })

  it("행이 있으면 camelCase 도메인 타입으로 변환해 반환한다", async () => {
    mockMaybeSingle({ data: dbProfile, error: null })

    const user = await findUserById("user-1")

    expect(user).toMatchObject({ id: "user-1", displayName: "테스트 사용자" })
  })

  it("DB 에러는 삼키지 않고 던진다", async () => {
    const dbError = { message: "permission denied", code: "42501" }
    mockMaybeSingle({ data: null, error: dbError })

    await expect(findUserById("user-1")).rejects.toBe(dbError)
  })
})
