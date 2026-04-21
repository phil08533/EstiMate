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
      notes: { Row: Note; Insert: NoteInsert; Update: Partial<NoteInsert> }
      note_shares: { Row: NoteShare; Insert: NoteShareInsert; Update: Partial<NoteShareInsert> }
      company_settings: { Row: CompanySettings; Insert: CompanySettingsInsert; Update: Partial<CompanySettingsInsert> }
      service_items: { Row: ServiceItem; Insert: ServiceItemInsert; Update: Partial<ServiceItemInsert> }
      estimate_line_items: { Row: EstimateLineItem; Insert: EstimateLineItemInsert; Update: Partial<EstimateLineItemInsert> }
      payments: { Row: Payment; Insert: PaymentInsert; Update: Partial<PaymentInsert> }
      expenses: { Row: Expense; Insert: ExpenseInsert; Update: Partial<ExpenseInsert> }
      equipment: { Row: Equipment; Insert: EquipmentInsert; Update: Partial<EquipmentInsert> }
      equipment_logs: { Row: EquipmentLog; Insert: EquipmentLogInsert; Update: Partial<EquipmentLogInsert> }
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
export type CustomerResponse = 'accepted' | 'declined' | 'modification_requested'

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
  follow_up_date: string | null
  service_date: string | null
  customer_id: string | null
  category_id: string | null
  crew_id: string | null
  estimated_hours: number | null
  recurring_job_id: string | null
  // Quote acceptance flow
  quote_token: string | null
  customer_response: CustomerResponse | null
  customer_response_at: string | null
  customer_response_notes: string | null
  completed_at: string | null
  quote_show_line_items: boolean
  created_at: string
  updated_at: string
}
export type EstimateInsert = Omit<Estimate, 'id' | 'total_area' | 'created_at' | 'updated_at' | 'quote_token' | 'customer_response' | 'customer_response_at' | 'customer_response_notes' | 'category_id' | 'crew_id' | 'estimated_hours' | 'recurring_job_id' | 'completed_at' | 'quote_show_line_items'> & {
  quote_token?: string | null
  customer_response?: CustomerResponse | null
  customer_response_at?: string | null
  customer_response_notes?: string | null
  category_id?: string | null
  crew_id?: string | null
  estimated_hours?: number | null
  recurring_job_id?: string | null
  completed_at?: string | null
  quote_show_line_items?: boolean
}

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

export interface MeasurementGroup {
  id: string
  estimate_id: string
  name: string
  display_order: number
  created_at: string
}
export type MeasurementGroupInsert = Omit<MeasurementGroup, 'id' | 'created_at'>

export interface Measurement {
  id: string
  estimate_id: string
  media_id: string | null
  group_id: string | null
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

// ─── Notes ────────────────────────────────────────────────────────────────────

export type NoteMode = 'text' | 'draw'
export type NoteCanvasTool = 'pen' | 'text' | 'eraser' | 'pan'

export interface NoteCanvasShape {
  type: 'pen' | 'text' | 'eraser'
  id: string
  points?: number[]   // logical coords (not scaled)
  x?: number
  y?: number
  text?: string
  color: string
  strokeWidth: number
}

export interface NoteCanvasData {
  shapes: NoteCanvasShape[]
}

export interface Note {
  id: string
  team_id: string
  created_by: string
  title: string | null
  content: string | null
  canvas_data: NoteCanvasData | null
  mode: NoteMode
  note_date: string   // ISO date "2026-04-14"
  created_at: string
  updated_at: string
}
export type NoteInsert = Omit<Note, 'id' | 'created_at' | 'updated_at'>

export interface NoteShare {
  id: string
  team_id: string
  created_by: string
  note_id: string | null   // null = all notes
  token: string
  expires_at: string | null
  created_at: string
}
export type NoteShareInsert = Omit<NoteShare, 'id' | 'created_at'>

// ─── Company & billing types ──────────────────────────────────────────────────

export interface CompanySettings {
  id: string
  team_id: string
  company_name: string | null
  logo_path: string | null
  logo_scale: number
  phone: string | null
  email: string | null
  address: string | null
  website: string | null
  license_number: string | null
  tax_rate: number
  default_markup_pct: number
  payment_terms: string | null
  footer_notes: string | null
  created_at: string
  updated_at: string
}
export type CompanySettingsInsert = Omit<CompanySettings, 'id' | 'created_at' | 'updated_at'>

export interface ServiceItem {
  id: string
  team_id: string
  name: string
  description: string | null
  unit: string
  default_price: number
  category: string | null
  created_at: string
}
export type ServiceItemInsert = Omit<ServiceItem, 'id' | 'created_at'>

export type LineItemCategory = 'labor' | 'equipment' | 'material' | 'subs' | 'other'

export interface EstimateLineItem {
  id: string
  estimate_id: string
  service_item_id: string | null
  description: string
  quantity: number
  unit_price: number
  unit_cost: number
  markup_pct: number
  unit: string
  tax_exempt: boolean
  sort_order: number
  category: LineItemCategory
  created_at: string
}
export type EstimateLineItemInsert = Omit<EstimateLineItem, 'id' | 'created_at' | 'unit_cost' | 'markup_pct'> & {
  unit_cost?: number
  markup_pct?: number
}

export type PaymentMethod = 'cash' | 'check' | 'card' | 'bank_transfer' | 'other'

export interface Payment {
  id: string
  estimate_id: string
  team_id: string
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  notes: string | null
  created_by: string | null
  created_at: string
}
export type PaymentInsert = Omit<Payment, 'id' | 'created_at'>

export interface PaymentLink {
  id: string
  team_id: string
  estimate_id: string
  created_by: string | null
  token: string
  deposit_pct: number
  deposit_amount: number
  total_amount: number
  status: 'pending' | 'paid' | 'expired'
  stripe_payment_intent_id: string | null
  customer_email: string | null
  customer_name: string | null
  expires_at: string | null
  paid_at: string | null
  created_at: string
}
export type PaymentLinkInsert = Omit<PaymentLink, 'id' | 'token' | 'created_at' | 'paid_at'>

export type ExpenseCategory =
  | 'materials' | 'labor' | 'equipment' | 'fuel'
  | 'insurance' | 'marketing' | 'office' | 'utilities'
  | 'subcontractor' | 'other'

export interface Expense {
  id: string
  team_id: string
  category: ExpenseCategory
  description: string
  amount: number
  expense_date: string
  vendor: string | null
  receipt_path: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}
export type ExpenseInsert = Omit<Expense, 'id' | 'created_at'>

export type EquipmentStatus = 'active' | 'maintenance' | 'retired'

export interface Equipment {
  id: string
  team_id: string
  name: string
  description: string | null
  make: string | null
  model: string | null
  year: number | null
  serial_number: string | null
  purchase_date: string | null
  purchase_price: number | null
  status: EquipmentStatus
  category: string | null
  useful_life_years: number | null
  salvage_value: number | null
  notes: string | null
  created_at: string
}
export type EquipmentInsert = Omit<Equipment, 'id' | 'created_at'>

export type EquipmentLogType = 'maintenance' | 'repair' | 'fuel' | 'note'

export interface EquipmentLog {
  id: string
  equipment_id: string
  log_type: EquipmentLogType
  description: string
  cost: number | null
  log_date: string
  created_by: string | null
  created_at: string
}
export type EquipmentLogInsert = Omit<EquipmentLog, 'id' | 'created_at'>

// ─── Estimate templates ───────────────────────────────────────────────────────

export interface EstimateTemplate {
  id: string
  team_id: string
  created_by: string
  name: string
  description: string | null
  created_at: string
}
export type EstimateTemplateInsert = Omit<EstimateTemplate, 'id' | 'created_at'>

export interface TemplateLineItem {
  id: string
  template_id: string
  description: string
  quantity: number
  unit_price: number
  unit: string
  tax_exempt: boolean
  sort_order: number
  created_at: string
}
export type TemplateLineItemInsert = Omit<TemplateLineItem, 'id' | 'created_at'>

// ─── CRM ─────────────────────────────────────────────────────────────────────

export type LeadStage = 'new_lead' | 'estimate_scheduled' | 'proposal_sent' | 'won' | 'lost'

export interface Customer {
  id: string
  team_id: string
  created_by: string
  full_name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  tags: string[] | null
  notes: string | null
  source: string | null
  is_active: boolean
  portal_token: string | null
  created_at: string
  updated_at: string
}
export type CustomerInsert = Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'portal_token'> & {
  portal_token?: string | null
}

export interface Lead {
  id: string
  team_id: string
  created_by: string
  customer_id: string | null
  full_name: string
  email: string | null
  phone: string | null
  address: string | null
  service_interest: string | null
  notes: string | null
  source: string | null
  stage: LeadStage
  estimated_value: number | null
  assigned_to: string | null
  follow_up_date: string | null
  created_at: string
  updated_at: string
}
export type LeadInsert = Omit<Lead, 'id' | 'created_at' | 'updated_at'>

export type ContactLogType = 'call' | 'email' | 'text' | 'visit' | 'note'

export interface ContactLog {
  id: string
  team_id: string
  customer_id: string | null
  lead_id: string | null
  created_by: string
  log_type: ContactLogType
  summary: string
  created_at: string
}
export type ContactLogInsert = Omit<ContactLog, 'id' | 'created_at'>

// ─── Employees ────────────────────────────────────────────────────────────────

export type EmployeeRole = 'owner' | 'manager' | 'estimator' | 'crew_lead' | 'crew_member' | 'office' | 'subcontractor'
export type PayType = 'hourly' | 'salary'

export interface Employee {
  id: string
  team_id: string
  profile_id: string | null
  manager_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  role: EmployeeRole
  pay_rate: number | null
  pay_type: PayType
  hire_date: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}
export type EmployeeInsert = Omit<Employee, 'id' | 'created_at' | 'updated_at'>

export interface TimeEntry {
  id: string
  team_id: string
  employee_id: string
  estimate_id: string | null
  clock_in: string
  clock_out: string | null
  break_mins: number
  notes: string | null
  created_at: string
}
export type TimeEntryInsert = Omit<TimeEntry, 'id' | 'created_at' | 'clock_out'> & { clock_out?: string | null }

// ─── Reminder settings ────────────────────────────────────────────────────────

export interface ReminderSettings {
  id: string
  team_id: string
  is_enabled: boolean
  reminder_days_before: number[]
  send_email: boolean
  send_sms: boolean
  message_template: string | null
  created_at: string
  updated_at: string
}
export type ReminderSettingsInsert = Omit<ReminderSettings, 'id' | 'created_at' | 'updated_at'>

export interface ReminderLog {
  id: string
  team_id: string
  estimate_id: string
  sent_at: string
  days_before: number
  method: 'email' | 'sms'
  recipient: string | null
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'quote_accepted'
  | 'quote_declined'
  | 'quote_modification'
  | 'reminder_sent'
  | 'payment_received'
  | 'follow_up_due'
  | 'job_today'

export interface Notification {
  id: string
  team_id: string
  user_id: string | null
  type: NotificationType
  title: string
  body: string | null
  data: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}
export type NotificationInsert = Omit<Notification, 'id' | 'created_at'>

// ─── Vendors ─────────────────────────────────────────────────────────────────

export type VendorCategory = 'nursery' | 'stone' | 'lumber' | 'rental' | 'fuel' | 'hardware' | 'landscaping' | 'other'

export interface Vendor {
  id: string
  team_id: string
  created_by: string | null
  name: string
  category: VendorCategory | null
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  website: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
export type VendorInsert = Omit<Vendor, 'id' | 'created_at' | 'updated_at'>

// ─── Subscriptions ────────────────────────────────────────────────────────────

export type SubscriptionPlan = 'free' | 'pro' | 'business'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete'

export interface Subscription {
  id: string
  team_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_ends_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string
}

// ─── Recurring Jobs ───────────────────────────────────────────────────────────
export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'

export interface RecurringJob {
  id: string
  team_id: string
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  customer_address: string | null
  customer_id: string | null
  title: string
  description: string | null
  frequency: RecurrenceFrequency
  next_date: string
  assigned_to: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type RecurringJobInsert = Omit<RecurringJob, 'id' | 'created_at' | 'updated_at'>

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

// ─── Service Categories ────────────────────────────────────────────────────────
export interface ServiceCategory {
  id: string
  team_id: string
  name: string
  color: string
  is_active: boolean
  created_at: string
}
export type ServiceCategoryInsert = Omit<ServiceCategory, 'id' | 'created_at'>

// ─── Crews ────────────────────────────────────────────────────────────────────
export interface Crew {
  id: string
  team_id: string
  name: string
  color: string
  is_active: boolean
  created_at: string
}
export type CrewInsert = Omit<Crew, 'id' | 'created_at'>

export interface CrewMember {
  crew_id: string
  employee_id: string
}

export interface ScheduleBlock {
  id: string
  team_id: string
  estimate_id: string
  crew_id: string | null
  block_date: string
  hours: number
  notes: string | null
  created_at: string
}
export type ScheduleBlockInsert = Omit<ScheduleBlock, 'id' | 'created_at'>

// ─── Training ─────────────────────────────────────────────────────────────────
export type TrainingItemType = 'checklist' | 'text' | 'video_url'

export interface TrainingModule {
  id: string
  team_id: string
  title: string
  description: string | null
  is_public: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}
export type TrainingModuleInsert = Omit<TrainingModule, 'id' | 'created_at' | 'updated_at'>

export interface TrainingItem {
  id: string
  module_id: string
  content: string
  item_type: TrainingItemType
  position: number
  created_at: string
}
export type TrainingItemInsert = Omit<TrainingItem, 'id' | 'created_at'>

export interface TrainingCompletion {
  id: string
  item_id: string
  employee_id: string
  completed_at: string
}

// ─── Job Notes ────────────────────────────────────────────────────────────────
export interface JobNote {
  id: string
  estimate_id: string
  team_id: string
  created_by: string
  content: string
  created_at: string
}
export type JobNoteInsert = Omit<JobNote, 'id' | 'created_at'>

// ─── Equipment Assignments ────────────────────────────────────────────────────
export interface EquipmentAssignment {
  id: string
  equipment_id: string
  estimate_id: string
  team_id: string
  assigned_date: string
  notes: string | null
  created_by: string
  created_at: string
}
export type EquipmentAssignmentInsert = Omit<EquipmentAssignment, 'id' | 'created_at'>
