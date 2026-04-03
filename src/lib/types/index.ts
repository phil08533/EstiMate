// ─── Supabase Database type (minimal — expand as needed) ─────────────────────
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: ProfileInsert; Update: Partial<ProfileInsert> }
      teams: { Row: Team; Insert: TeamInsert; Update: Partial<TeamInsert> }
      team_members: { Row: TeamMember; Insert: TeamMemberInsert; Update: Partial<TeamMemberInsert> }
      estimates: { Row: Estimate; Insert: EstimateInsert; Update: Partial<EstimateInsert> }
      estimate_media: { Row: EstimateMedia; Insert: EstimateMediaInsert; Update: Partial<EstimateMediaInsert> }
      measurements: { Row: Measurement; Insert: MeasurementInsert; Update: Partial<MeasurementInsert> }
      share_tokens: { Row: ShareToken; Insert: ShareTokenInsert; Update: Partial<ShareTokenInsert> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ─── Domain types ──────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
}
export type ProfileInsert = Omit<Profile, 'created_at'>

export interface Team {
  id: string
  name: string
  owner_id: string
  created_at: string
}
export type TeamInsert = Omit<Team, 'id' | 'created_at'>

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'owner' | 'member' | 'viewer'
  created_at: string
}
export type TeamMemberInsert = Omit<TeamMember, 'id' | 'created_at'>

export type EstimateStatus = 'need_to_estimate' | 'sent' | 'sold' | 'lost'

export interface Estimate {
  id: string
  team_id: string
  assigned_to: string | null
  created_by: string
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  customer_address: string | null
  comments: string | null
  status: EstimateStatus
  total_area: number
  created_at: string
  updated_at: string
}
export type EstimateInsert = Omit<Estimate, 'id' | 'total_area' | 'created_at' | 'updated_at'>

// Estimate with joined profile data
export interface EstimateWithProfiles extends Estimate {
  assignee?: Profile | null
  creator?: Profile | null
}

export interface EstimateMedia {
  id: string
  estimate_id: string
  uploaded_by: string
  storage_path: string
  media_type: 'photo' | 'video'
  comment: string | null
  annotation_data: object | null
  display_order: number
  created_at: string
}
export type EstimateMediaInsert = Omit<EstimateMedia, 'id' | 'created_at'>

export interface Measurement {
  id: string
  estimate_id: string
  media_id: string | null
  length: number
  width: number
  area: number
  label: string | null
  created_at: string
}
export type MeasurementInsert = Omit<Measurement, 'id' | 'area' | 'created_at'>

export interface ShareToken {
  id: string
  team_id: string
  created_by: string
  token: string
  expires_at: string | null
  created_at: string
}
export type ShareTokenInsert = Omit<ShareToken, 'id' | 'created_at'>

// ─── Sort / filter types ───────────────────────────────────────────────────────
export type SortField = 'customer_name' | 'status' | 'created_at' | 'updated_at' | 'total_area'
export type SortDirection = 'asc' | 'desc'

export interface EstimateFilters {
  status?: EstimateStatus | 'all'
  assignedTo?: string | 'all'
  sortField: SortField
  sortDirection: SortDirection
  search?: string
}
