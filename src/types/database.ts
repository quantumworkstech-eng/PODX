// Database Types for PodX

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  auth_provider: 'email' | 'google' | string;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  company_name?: string;
  bio?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: string;
  name: 'podcaster' | 'studio_owner' | 'admin' | 'editor';
  description?: string;
  created_at: Date;
}

export interface UserWithProfile extends User {
  profile?: Profile;
  roles: Role[];
}

// Studio Types
export interface Studio {
  id: string;
  owner_id: string;
  name: string;
  slug?: string;
  description?: string;
  short_description?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  is_active: boolean;
  is_verified: boolean;
  featured_image_url?: string;
  created_at: Date;
  updated_at: Date;
  images?: StudioImage[];
  amenities?: Amenity[];
  rooms?: Room[];
  hours?: StudioHours[];
}

export interface StudioImage {
  id: string;
  studio_id: string;
  image_url: string;
  caption?: string;
  display_order: number;
  created_at: Date;
}

export interface Amenity {
  id: string;
  name: string;
  icon?: string;
  category: string;
}

export interface StudioHours {
  id: string;
  studio_id: string;
  day_of_week: number;
  open_time?: string;
  close_time?: string;
  is_closed: boolean;
}

// Room Types
export interface Room {
  id: string;
  studio_id: string;
  name: string;
  description?: string;
  capacity: number;
  price_per_hour: number;
  min_booking_hours: number;
  max_booking_hours: number;
  is_active: boolean;
  featured_image_url?: string;
  created_at: Date;
  updated_at: Date;
  images?: RoomImage[];
  equipment?: RoomEquipment[];
}

export interface RoomImage {
  id: string;
  room_id: string;
  image_url: string;
  caption?: string;
  display_order: number;
  created_at: Date;
}

export interface Equipment {
  id: string;
  name: string;
  description?: string;
  category: 'mic' | 'camera' | 'lighting' | 'mixer' | 'headphones' | 'accessories';
  brand?: string;
  model?: string;
  icon?: string;
  created_at: Date;
}

export interface RoomEquipment {
  room_id: string;
  equipment_id: string;
  quantity: number;
  equipment?: Equipment;
}

// Availability Types
export interface AvailabilitySlot {
  id: string;
  room_id: string;
  start_time: Date;
  end_time: Date;
  is_available: boolean;
  price_override?: number;
  created_at: Date;
}

// Booking Types
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Booking {
  id: string;
  booking_number?: string;
  user_id: string;
  room_id: string;
  studio_id: string;
  start_time: Date;
  end_time: Date;
  status: BookingStatus;
  total_price: number;
  notes?: string;
  cancellation_reason?: string;
  cancelled_at?: Date;
  created_at: Date;
  updated_at: Date;
  user?: UserWithProfile;
  room?: Room;
  studio?: Studio;
  guests?: BookingGuest[];
  addons?: BookingAddon[];
  session?: Session;
  payment?: Payment;
}

export interface BookingGuest {
  id: string;
  booking_id: string;
  guest_name: string;
  guest_email?: string;
  created_at: Date;
}

export interface BookingAddon {
  id: string;
  booking_id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

export interface CancellationPolicy {
  id: string;
  studio_id: string;
  hours_before: number;
  refund_percentage: number;
  description?: string;
  created_at: Date;
}

// Payment Types
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded';

export interface Payment {
  id: string;
  booking_id?: string;
  user_id?: string;
  provider: 'stripe' | 'razorpay' | 'paypal';
  provider_payment_id?: string;
  provider_customer_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method?: string;
  receipt_url?: string;
  metadata?: Record<string, any>;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Invoice {
  id: string;
  user_id: string;
  booking_id?: string;
  payment_id?: string;
  invoice_number: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  invoice_url?: string;
  issued_at?: Date;
  paid_at?: Date;
  created_at: Date;
}

// Session Types
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Session {
  id: string;
  booking_id?: string;
  studio_id?: string;
  room_id?: string;
  session_code?: string;
  session_date: Date;
  start_time?: string;
  end_time?: string;
  actual_start?: Date;
  actual_end?: Date;
  notes?: string;
  status: SessionStatus;
  engineer_id?: string;
  created_at: Date;
  updated_at: Date;
  media_assets?: MediaAsset[];
  tasks?: Task[];
}

export interface MediaAsset {
  id: string;
  session_id: string;
  file_name: string;
  file_url: string;
  file_type: 'audio' | 'video' | 'image' | 'document' | 'thumbnail';
  file_format?: string;
  file_size?: number;
  duration?: number;
  uploaded_by?: string;
  is_public: boolean;
  download_count: number;
  metadata?: Record<string, any>;
  created_at: Date;
}

// Task Types
export type TaskStatus = 'pending' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
export type TaskType = 'editing' | 'sound_mix' | 'color_grade' | 'thumbnail' | 'show_notes' | 'distribution';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  session_id?: string;
  assigned_to?: string;
  created_by?: string;
  title: string;
  description?: string;
  task_type?: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: Date;
  completed_at?: Date;
  estimated_hours?: number;
  actual_hours?: number;
  price?: number;
  created_at: Date;
  updated_at: Date;
  assignee?: UserWithProfile;
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  is_internal: boolean;
  created_at: Date;
  user?: UserWithProfile;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name?: string;
  file_url: string;
  file_type?: string;
  uploaded_by?: string;
  created_at: Date;
}

// Review Types
export interface Review {
  id: string;
  studio_id: string;
  user_id: string;
  booking_id?: string;
  rating: number;
  title?: string;
  content?: string;
  is_verified: boolean;
  helpful_count: number;
  status: 'pending' | 'published' | 'rejected';
  created_at: Date;
  updated_at: Date;
  user?: UserWithProfile;
  responses?: ReviewResponse[];
}

export interface ReviewResponse {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  created_at: Date;
  user?: UserWithProfile;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content?: string;
  data?: Record<string, any>;
  is_read: boolean;
  read_at?: Date;
  action_url?: string;
  created_at: Date;
}

// Analytics Types
export interface EpisodeMetric {
  id: string;
  session_id?: string;
  episode_title?: string;
  platform: string;
  listens: number;
  downloads: number;
  likes: number;
  comments: number;
  shares: number;
  recorded_at: Date;
}

export interface StudioAnalytics {
  id: string;
  studio_id: string;
  date: Date;
  total_bookings: number;
  total_revenue: number;
  total_hours_booked: number;
  unique_customers: number;
  avg_rating?: number;
  page_views: number;
  created_at: Date;
}
