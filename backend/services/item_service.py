from typing import Optional
from fastapi import HTTPException, status
from backend.models.item import Item, ItemCreate, ItemUpdate, ItemStatus
from backend.repositories.item_repository import ItemRepository


class ItemService:
    def __init__(self, repository: ItemRepository):
        self._repo = repository

    def get_items(
        self,
        page: int = 1,
        limit: int = 20,
        status: Optional[ItemStatus] = None,
        category: Optional[str] = None,
    ) -> tuple[list[Item], int]:
        return self._repo.find_many(page=page, limit=limit, status=status, category=category)

    def get_item(self, item_id: str) -> Item:
        item = self._repo.find_by_id(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "아이템을 찾을 수 없습니다.", "code": "ITEM_NOT_FOUND"},
            )
        return item

    def create_item(self, data: ItemCreate, owner_id: Optional[str] = None) -> Item:
        return self._repo.create(data, owner_id=owner_id)

    def update_item(self, item_id: str, data: ItemUpdate) -> Item:
        item = self._repo.update(item_id, data)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "아이템을 찾을 수 없습니다.", "code": "ITEM_NOT_FOUND"},
            )
        return item

    def delete_item(self, item_id: str) -> None:
        deleted = self._repo.delete(item_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "아이템을 찾을 수 없습니다.", "code": "ITEM_NOT_FOUND"},
            )
