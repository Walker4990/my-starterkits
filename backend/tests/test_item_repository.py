from unittest.mock import MagicMock

from backend.models.item import ItemCreate, ItemUpdate
from backend.repositories.item_repository import ItemRepository
from backend.tests.conftest import make_builder, make_db, make_response

ITEM_ROW = {
    "id": "item-1",
    "title": "테스트 아이템",
    "description": None,
    "status": "active",
    "category": None,
    "price": None,
    "owner_id": "user-1",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z",
}


class TestFindById:
    def test_행이_없으면_None을_반환한다(self):
        # maybe_single().execute()는 0행이면 응답 없이 None을 반환한다
        builder = make_builder(None, "select", "eq", "maybe_single")
        repo = ItemRepository(make_db(builder))

        assert repo.find_by_id("not-exist") is None

    def test_행이_있으면_Item을_반환한다(self):
        builder = make_builder(make_response(ITEM_ROW), "select", "eq", "maybe_single")
        repo = ItemRepository(make_db(builder))

        item = repo.find_by_id("item-1")

        assert item is not None
        assert item.id == "item-1"
        builder.maybe_single.assert_called_once()


class TestCreate:
    def test_insert_후_execute로_생성된_행을_반환한다(self):
        # insert()가 반환하는 빌더는 execute만 가진다 (select/single 없음)
        insert_builder = MagicMock(spec=["execute"])
        insert_builder.execute.return_value = make_response([ITEM_ROW])
        table = MagicMock()
        table.insert.return_value = insert_builder
        db = MagicMock()
        db.table.return_value = table
        repo = ItemRepository(db)

        item = repo.create(ItemCreate(title="테스트 아이템"), owner_id="user-1")

        assert item.id == "item-1"
        payload = table.insert.call_args.args[0]
        assert payload["owner_id"] == "user-1"


class TestUpdate:
    def test_수정된_행이_없으면_None을_반환한다(self):
        filter_builder = MagicMock(spec=["eq", "execute"])
        filter_builder.eq.return_value = filter_builder
        filter_builder.execute.return_value = make_response([])
        table = MagicMock()
        table.update.return_value = filter_builder
        db = MagicMock()
        db.table.return_value = table
        repo = ItemRepository(db)

        assert repo.update("not-exist", ItemUpdate(title="x")) is None

    def test_수정된_행이_있으면_Item을_반환한다(self):
        filter_builder = MagicMock(spec=["eq", "execute"])
        filter_builder.eq.return_value = filter_builder
        filter_builder.execute.return_value = make_response([ITEM_ROW])
        table = MagicMock()
        table.update.return_value = filter_builder
        db = MagicMock()
        db.table.return_value = table
        repo = ItemRepository(db)

        item = repo.update("item-1", ItemUpdate(title="테스트 아이템"))

        assert item is not None
        assert item.id == "item-1"
