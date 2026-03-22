export type LibraryStatus = 'private' | 'available' | 'with_compensation'
export type ProposalStatus =
  | 'pending'
  | 'counter_proposed'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'cancelled'
  | 'completed'
export type GameCondition = 'mint' | 'good' | 'fair'
export type UserPlan = 'free' | 'pro'
export type OfferedBy = 'proposer' | 'receiver'
export type NotificationType =
  | 'proposal_received'
  | 'proposal_accepted'
  | 'proposal_declined'
  | 'counter_received'
  | 'message_received'
  | 'swap_completed'
  | 'review_received'
  | 'wishlist_match'

export interface UserRow {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  city: string
  country: string
  email_confirmed: boolean
  plan: UserPlan
  plan_expires_at: string | null
  rating_avg: number
  swaps_completed: number
  is_suspended: boolean
  created_at: string
  updated_at: string
}

export interface GameRow {
  id: number
  title: string
  cover_url: string | null
  platforms: string[] | null
  genres: string[] | null
  release_year: number | null
  igdb_slug: string | null
}

export interface LibraryItemRow {
  id: string
  user_id: string
  game_id: number
  status: LibraryStatus
  min_compensation: number | null
  condition: GameCondition
  notes: string | null
  created_at: string
  updated_at: string
}

export interface WishlistItemRow {
  id: string
  user_id: string
  game_id: number
  platform_preference: string | null
  created_at: string
}

export interface ProposalRow {
  id: string
  proposer_id: string
  receiver_id: string
  requested_item_id: string
  status: ProposalStatus
  message: string | null
  expires_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ProposalItemRow {
  id: string
  proposal_id: string
  library_item_id: string
  compensation_amount: number
  offered_by: OfferedBy
  created_at: string
}

export interface MessageRow {
  id: string
  proposal_id: string
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
}

export interface ReviewRow {
  id: string
  proposal_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface NotificationRow {
  id: string
  user_id: string
  type: NotificationType
  payload: Record<string, unknown>
  read_at: string | null
  created_at: string
}

// Joined types
export interface LibraryItemWithGame extends LibraryItemRow {
  games: GameRow
}

export interface LibraryItemWithGameAndUser extends LibraryItemRow {
  games: GameRow
  users: UserRow
}

export interface WishlistItemWithGame extends WishlistItemRow {
  games: GameRow
}

export interface ProposalWithUsers extends ProposalRow {
  proposer: UserRow
  receiver: UserRow
  requested_item: LibraryItemWithGame
  proposal_items: (ProposalItemRow & { library_item: LibraryItemWithGame })[]
}

export interface MessageWithSender extends MessageRow {
  sender: UserRow
}

export interface ReviewWithUsers extends ReviewRow {
  reviewer: UserRow
  reviewee: UserRow
}

// Insert types
export type LibraryItemInsert = Omit<LibraryItemRow, 'id' | 'created_at' | 'updated_at'>
export type WishlistItemInsert = Omit<WishlistItemRow, 'id' | 'created_at'>
export type ProposalInsert = Omit<ProposalRow, 'id' | 'created_at' | 'updated_at' | 'completed_at'>
export type ProposalItemInsert = Omit<ProposalItemRow, 'id' | 'created_at'>
export type MessageInsert = Omit<MessageRow, 'id' | 'created_at' | 'read_at'>
export type ReviewInsert = Omit<ReviewRow, 'id' | 'created_at'>
