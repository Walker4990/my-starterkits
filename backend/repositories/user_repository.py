from typing import Optional
from supabase import Client
from backend.models.user import User, UserCreate, UserUpdate


class UserRepository:
    def __init__(self, db: Client):
        self._db = db

    def find_many(self, page: int = 1, limit: int = 20) -> tuple[list[User], int]:
        offset = (page - 1) * limit
        response = (
            self._db.table("profiles")
            .select("*", count="exact")
            .range(offset, offset + limit - 1)
            .execute()
        )
        users = [User(**row) for row in response.data]
        total = response.count or 0
        return users, total

    def find_by_id(self, user_id: str) -> Optional[User]:
        response = (
            self._db.table("profiles")
            .select("*")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        # maybe_single은 0행이면 응답 자체가 None
        if response is None or not response.data:
            return None
        return User(**response.data)

    def create(self, data: UserCreate, user_id: str) -> User:
        # profiles.id는 auth.users와 연결되므로 인증된 유저의 id로만 생성한다
        payload = {**data.model_dump(), "id": user_id}
        response = self._db.table("profiles").insert(payload).execute()
        return User(**response.data[0])

    def update(self, user_id: str, data: UserUpdate) -> Optional[User]:
        payload = {k: v for k, v in data.model_dump().items() if v is not None}
        response = (
            self._db.table("profiles")
            .update(payload)
            .eq("id", user_id)
            .execute()
        )
        if not response.data:
            return None
        return User(**response.data[0])

    def delete(self, user_id: str) -> bool:
        response = (
            self._db.table("profiles")
            .delete()
            .eq("id", user_id)
            .execute()
        )
        return bool(response.data)
