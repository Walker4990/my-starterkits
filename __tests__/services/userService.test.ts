import { describe, it, expect, vi, beforeEach } from "vitest"
import * as userRepository from "@/repositories/userRepository"
import { getUsers, getUser } from "@/services/userService"
import type { Profile } from "@/types/database"
import type { PaginatedResponse } from "@/types/common"

vi.mock("@/repositories/userRepository")

const mockProfile: Profile = {
  id: "user-1",
  username: "testuser",
  displayName: "테스트 사용자",
  avatarUrl: null,
  bio: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

const mockPaginatedResponse: PaginatedResponse<Profile> = {
  data: [mockProfile],
  total: 1,
  page: 1,
  limit: 20,
  hasNext: false,
}

describe("userService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getUsers", () => {
    it("페이지네이션 파라미터를 그대로 repository에 전달한다", async () => {
      vi.mocked(userRepository.findManyUsers).mockResolvedValue(mockPaginatedResponse)

      const result = await getUsers({ page: 2, limit: 10 })

      expect(userRepository.findManyUsers).toHaveBeenCalledWith({ page: 2, limit: 10 })
      expect(result).toEqual(mockPaginatedResponse)
    })
  })

  describe("getUser", () => {
    it("id로 유저를 조회한다", async () => {
      vi.mocked(userRepository.findUserById).mockResolvedValue(mockProfile)

      const result = await getUser("user-1")

      expect(userRepository.findUserById).toHaveBeenCalledWith("user-1")
      expect(result).toEqual(mockProfile)
    })

    it("유저가 없으면 null을 반환한다", async () => {
      vi.mocked(userRepository.findUserById).mockResolvedValue(null)

      const result = await getUser("not-exist")

      expect(result).toBeNull()
    })
  })
})
