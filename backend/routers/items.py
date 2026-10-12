from typing import Optional
from fastapi import APIRouter, Request, Depends
from supabase import Client
from backend.models.item import Item, ItemCreate, ItemUpdate, ItemStatus
from backend.models.common import ApiResponse, PaginatedResponse
from backend.repositories.item_repository import ItemRepository
from backend.services.item_service import ItemService
from backend.database.supabase import get_supabase

router = APIRouter(prefix="/api/v1/items", tags=["items"])


def get_service(db: Client = Depends(get_supabase)) -> ItemService:
    return ItemService(ItemRepository(db))


@router.get("", response_model=PaginatedResponse[Item])
async def list_items(
    request: Request,
    page: int = 1,
    limit: int = 20,
    status: Optional[ItemStatus] = None,
    category: Optional[str] = None,
    service: ItemService = Depends(get_service),
):
    items, total = service.get_items(page=page, limit=limit, status=status, category=category)
    return PaginatedResponse(
        data=items,
        total=total,
        page=page,
        limit=limit,
        has_next=(page * limit) < total,
        request_id=request.state.request_id,
    )


@router.get("/{item_id}", response_model=ApiResponse[Item])
async def get_item(
    item_id: str,
    request: Request,
    service: ItemService = Depends(get_service),
):
    item = service.get_item(item_id)
    return ApiResponse(data=item, request_id=request.state.request_id)


@router.post("", response_model=ApiResponse[Item], status_code=201)
async def create_item(
    body: ItemCreate,
    request: Request,
    service: ItemService = Depends(get_service),
):
    item = service.create_item(body)
    return ApiResponse(data=item, request_id=request.state.request_id)


@router.put("/{item_id}", response_model=ApiResponse[Item])
async def update_item(
    item_id: str,
    body: ItemUpdate,
    request: Request,
    service: ItemService = Depends(get_service),
):
    item = service.update_item(item_id, body)
    return ApiResponse(data=item, request_id=request.state.request_id)


@router.delete("/{item_id}", status_code=204)
async def delete_item(
    item_id: str,
    service: ItemService = Depends(get_service),
):
    service.delete_item(item_id)
