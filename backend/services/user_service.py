from typing import Optional
from fastapi import HTTPException, status
from backend.models.user import User, UserCreate, UserUpdate
from backend.repositories.user_repository import UserRepository


class UserService:
    def __init__(self, repository: UserRepository):
        self._repo = repository

    def get_users(self, page: int = 1, limit: int = 20) -> tuple[list[User], int]:
        return self._repo.find_many(page=page, limit=limit)

    def get_user(self, user_id: str) -> User:
        user = self._repo.find_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "유저를 찾을 수 없습니다.", "code": "USER_NOT_FOUND"},
            )
        return user

    @staticmethod
    def _ensure_self(user_id: str, current_user_id: str) -> None:
        if user_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "본인 정보만 변경할 수 있습니다.", "code": "FORBIDDEN"},
            )

    def create_user(self, data: UserCreate, user_id: str) -> User:
        return self._repo.create(data, user_id=user_id)

    def update_user(self, user_id: str, data: UserUpdate, current_user_id: str) -> User:
        self._ensure_self(user_id, current_user_id)
        user = self._repo.update(user_id, data)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "유저를 찾을 수 없습니다.", "code": "USER_NOT_FOUND"},
            )
        return user

    def delete_user(self, user_id: str, current_user_id: str) -> None:
        self._ensure_self(user_id, current_user_id)
        deleted = self._repo.delete(user_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "유저를 찾을 수 없습니다.", "code": "USER_NOT_FOUND"},
            )
