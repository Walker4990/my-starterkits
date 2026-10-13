from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from backend.models.item import Item, ItemUpdate
from backend.services.item_service import ItemService


def make_item(owner_id: str | None = "owner-1") -> Item:
    return Item(
        id="item-1",
        title="아이템",
        owner_id=owner_id,
        created_at="2026-01-01T00:00:00Z",
        updated_at="2026-01-01T00:00:00Z",
    )


@pytest.fixture
def repo() -> MagicMock:
    return MagicMock()


class TestUpdateItem:
    def test_소유자는_수정할_수_있다(self, repo):
        repo.find_by_id.return_value = make_item("owner-1")
        repo.update.return_value = make_item("owner-1")
        service = ItemService(repo)

        result = service.update_item("item-1", ItemUpdate(title="새 제목"), user_id="owner-1")

        assert result.id == "item-1"
        repo.update.assert_called_once()

    def test_소유자가_아니면_403이다(self, repo):
        repo.find_by_id.return_value = make_item("owner-1")
        service = ItemService(repo)

        with pytest.raises(HTTPException) as exc:
            service.update_item("item-1", ItemUpdate(title="x"), user_id="other")

        assert exc.value.status_code == 403
        assert exc.value.detail["code"] == "FORBIDDEN"
        repo.update.assert_not_called()

    def test_아이템이_없으면_404이다(self, repo):
        repo.find_by_id.return_value = None
        service = ItemService(repo)

        with pytest.raises(HTTPException) as exc:
            service.update_item("item-1", ItemUpdate(title="x"), user_id="owner-1")

        assert exc.value.status_code == 404
        assert exc.value.detail["code"] == "ITEM_NOT_FOUND"

    def test_소유자가_없는_아이템은_수정할_수_없다(self, repo):
        repo.find_by_id.return_value = make_item(None)
        service = ItemService(repo)

        with pytest.raises(HTTPException) as exc:
            service.update_item("item-1", ItemUpdate(title="x"), user_id="owner-1")

        assert exc.value.status_code == 403


class TestDeleteItem:
    def test_소유자는_삭제할_수_있다(self, repo):
        repo.find_by_id.return_value = make_item("owner-1")
        repo.delete.return_value = True
        service = ItemService(repo)

        service.delete_item("item-1", user_id="owner-1")

        repo.delete.assert_called_once_with("item-1")

    def test_소유자가_아니면_403이다(self, repo):
        repo.find_by_id.return_value = make_item("owner-1")
        service = ItemService(repo)

        with pytest.raises(HTTPException) as exc:
            service.delete_item("item-1", user_id="other")

        assert exc.value.status_code == 403
        repo.delete.assert_not_called()

    def test_아이템이_없으면_404이다(self, repo):
        repo.find_by_id.return_value = None
        service = ItemService(repo)

        with pytest.raises(HTTPException) as exc:
            service.delete_item("item-1", user_id="owner-1")

        assert exc.value.status_code == 404
