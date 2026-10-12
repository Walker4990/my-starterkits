from typing import Optional
from supabase import Client
from backend.models.item import Item, ItemCreate, ItemUpdate, ItemStatus


class ItemRepository:
    def __init__(self, db: Client):
        self._db = db

    def find_many(
        self,
        page: int = 1,
        limit: int = 20,
        status: Optional[ItemStatus] = None,
        category: Optional[str] = None,
    ) -> tuple[list[Item], int]:
        offset = (page - 1) * limit
        query = self._db.table("items").select("*", count="exact")

        if status:
            query = query.eq("status", status)
        if category:
            query = query.eq("category", category)

        response = query.range(offset, offset + limit - 1).execute()
        items = [Item(**row) for row in response.data]
        total = response.count or 0
        return items, total

    def find_by_id(self, item_id: str) -> Optional[Item]:
        response = (
            self._db.table("items")
            .select("*")
            .eq("id", item_id)
            .single()
            .execute()
        )
        if not response.data:
            return None
        return Item(**response.data)

    def create(self, data: ItemCreate, owner_id: Optional[str] = None) -> Item:
        payload = data.model_dump()
        if owner_id:
            payload["owner_id"] = owner_id
        response = (
            self._db.table("items")
            .insert(payload)
            .select()
            .single()
            .execute()
        )
        return Item(**response.data)

    def update(self, item_id: str, data: ItemUpdate) -> Optional[Item]:
        payload = {k: v for k, v in data.model_dump().items() if v is not None}
        response = (
            self._db.table("items")
            .update(payload)
            .eq("id", item_id)
            .select()
            .single()
            .execute()
        )
        if not response.data:
            return None
        return Item(**response.data)

    def delete(self, item_id: str) -> bool:
        response = (
            self._db.table("items")
            .delete()
            .eq("id", item_id)
            .execute()
        )
        return bool(response.data)
