from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

ItemStatus = Literal["active", "inactive", "pending"]


class ItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: ItemStatus = "active"
    category: Optional[str] = None
    price: Optional[float] = None


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ItemStatus] = None
    category: Optional[str] = None
    price: Optional[float] = None


class Item(ItemBase):
    id: str
    owner_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
