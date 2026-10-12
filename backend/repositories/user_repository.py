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
            .single()
            .execute()
        )
        if not response.data:
            return None
        return User(**response.data)

    def create(self, data: UserCreate) -> User:
        response = (
            self._db.table("profiles")
            .insert(data.model_dump())
            .select()
            .single()
            .execute()
        )
        return User(**response.data)

    def update(self, user_id: str, data: UserUpdate) -> Optional[User]:
        payload = {k: v for k, v in data.model_dump().items() if v is not None}
        response = (
            self._db.table("profiles")
            .update(payload)
            .eq("id", user_id)
            .select()
            .single()
            .execute()
        )
        if not response.data:
            return None
        return User(**response.data)

    def delete(self, user_id: str) -> bool:
        response = (
            self._db.table("profiles")
            .delete()
            .eq("id", user_id)
            .execute()
        )
        return bool(response.data)
