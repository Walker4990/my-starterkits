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

    def _get_owned_item(self, item_id: str, user_id: str) -> Item:
        """아이템을 조회하고 소유자가 아니면 403을 던진다."""
        item = self.get_item(item_id)
        if item.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "아이템에 대한 권한이 없습니다.", "code": "FORBIDDEN"},
            )
        return item

    def create_item(self, data: ItemCreate, owner_id: Optional[str] = None) -> Item:
        return self._repo.create(data, owner_id=owner_id)

    def update_item(self, item_id: str, data: ItemUpdate, user_id: str) -> Item:
        self._get_owned_item(item_id, user_id)
        item = self._repo.update(item_id, data)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "아이템을 찾을 수 없습니다.", "code": "ITEM_NOT_FOUND"},
            )
        return item

    def delete_item(self, item_id: str, user_id: str) -> None:
        self._get_owned_item(item_id, user_id)
        deleted = self._repo.delete(item_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "아이템을 찾을 수 없습니다.", "code": "ITEM_NOT_FOUND"},
            )
