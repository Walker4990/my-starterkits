from unittest.mock import MagicMock

from backend.models.user import UserCreate, UserUpdate
from backend.repositories.user_repository import UserRepository
from backend.tests.conftest import make_builder, make_db, make_response

USER_ROW = {
    "id": "user-1",
    "username": "testuser",
    "display_name": None,
    "bio": None,
    "avatar_url": None,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z",
}


class TestFindById:
    def test_행이_없으면_None을_반환한다(self):
        builder = make_builder(None, "select", "eq", "maybe_single")
        repo = UserRepository(make_db(builder))

        assert repo.find_by_id("not-exist") is None

    def test_행이_있으면_User를_반환한다(self):
        builder = make_builder(make_response(USER_ROW), "select", "eq", "maybe_single")
        repo = UserRepository(make_db(builder))

        user = repo.find_by_id("user-1")

        assert user is not None
        assert user.id == "user-1"


class TestCreate:
    def test_전달한_id로_프로필을_생성한다(self):
        insert_builder = MagicMock(spec=["execute"])
        insert_builder.execute.return_value = make_response([USER_ROW])
        table = MagicMock()
        table.insert.return_value = insert_builder
        db = MagicMock()
        db.table.return_value = table
        repo = UserRepository(db)

        user = repo.create(UserCreate(username="testuser"), user_id="user-1")

        assert user.id == "user-1"
        assert table.insert.call_args.args[0]["id"] == "user-1"


class TestUpdate:
    def test_수정된_행이_없으면_None을_반환한다(self):
        filter_builder = MagicMock(spec=["eq", "execute"])
        filter_builder.eq.return_value = filter_builder
        filter_builder.execute.return_value = make_response([])
        table = MagicMock()
        table.update.return_value = filter_builder
        db = MagicMock()
        db.table.return_value = table
        repo = UserRepository(db)

        assert repo.update("not-exist", UserUpdate(username="x")) is None
