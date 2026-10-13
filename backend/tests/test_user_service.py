from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from backend.models.user import User, UserCreate, UserUpdate
from backend.services.user_service import UserService


def make_user() -> User:
    return User(
        id="user-1",
        username="testuser",
        created_at="2026-01-01T00:00:00Z",
        updated_at="2026-01-01T00:00:00Z",
    )


@pytest.fixture
def repo() -> MagicMock:
    return MagicMock()


def test_인증된_유저_id로_프로필을_생성한다(repo):
    repo.create.return_value = make_user()
    service = UserService(repo)
    data = UserCreate(username="testuser")

    service.create_user(data, user_id="user-1")

    repo.create.assert_called_once_with(data, user_id="user-1")


class TestUpdateUser:
    def test_본인은_수정할_수_있다(self, repo):
        repo.update.return_value = make_user()
        service = UserService(repo)

        result = service.update_user("user-1", UserUpdate(bio="소개"), current_user_id="user-1")

        assert result.id == "user-1"

    def test_다른_유저는_수정할_수_없다(self, repo):
        service = UserService(repo)

        with pytest.raises(HTTPException) as exc:
            service.update_user("user-1", UserUpdate(bio="x"), current_user_id="other")

        assert exc.value.status_code == 403
        assert exc.value.detail["code"] == "FORBIDDEN"
        repo.update.assert_not_called()

    def test_대상이_없으면_404이다(self, repo):
        repo.update.return_value = None
        service = UserService(repo)

        with pytest.raises(HTTPException) as exc:
            service.update_user("user-1", UserUpdate(bio="x"), current_user_id="user-1")

        assert exc.value.status_code == 404


class TestDeleteUser:
    def test_본인은_삭제할_수_있다(self, repo):
        repo.delete.return_value = True
        service = UserService(repo)

        service.delete_user("user-1", current_user_id="user-1")

        repo.delete.assert_called_once_with("user-1")

    def test_다른_유저는_삭제할_수_없다(self, repo):
        service = UserService(repo)

        with pytest.raises(HTTPException) as exc:
            service.delete_user("user-1", current_user_id="other")

        assert exc.value.status_code == 403
        repo.delete.assert_not_called()
