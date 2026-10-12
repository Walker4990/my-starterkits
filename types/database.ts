export type Profile = {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  createdAt: string
  updatedAt: string
}

export type ItemStatus = "active" | "inactive" | "pending"

export type Item = {
  id: string
  title: string
  description: string | null
  status: ItemStatus
  category: string | null
  price: number | null
  ownerId: string | null
  createdAt: string
  updatedAt: string
}

// Supabase에서 반환되는 snake_case raw 타입
export type DbProfile = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export type DbItem = {
  id: string
  title: string
  description: string | null
  status: ItemStatus
  category: string | null
  price: number | null
  owner_id: string | null
  created_at: string
  updated_at: string
}

// snake_case → camelCase 변환 함수
export function toProfile(db: DbProfile): Profile {
  return {
    id: db.id,
    username: db.username,
    displayName: db.display_name,
    avatarUrl: db.avatar_url,
    bio: db.bio,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

export function toItem(db: DbItem): Item {
  return {
    id: db.id,
    title: db.title,
    description: db.description,
    status: db.status,
    category: db.category,
    price: db.price,
    ownerId: db.owner_id,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}
