import { query } from './index';
import * as types from '@/types/database';

// User Queries
export const userQueries = {
  // Create new user
  createUser: async (email: string, passwordHash?: string, authProvider: string = 'email'): Promise<types.User> => {
    const result = await query(
      'INSERT INTO users (email, password_hash, auth_provider) VALUES ($1, $2, $3) RETURNING *',
      [email, passwordHash, authProvider]
    );
    return result.rows[0];
  },

  // Get user by email
  getUserByEmail: async (email: string): Promise<types.User | null> => {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  // Get user by ID with profile
  getUserById: async (id: string): Promise<types.UserWithProfile | null> => {
    const result = await query(
      `SELECT u.*, p.*, json_agg(r.*) as roles
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = $1
       GROUP BY u.id, p.id`,
      [id]
    );
    return result.rows[0] || null;
  },

  // Update user
  updateUser: async (id: string, updates: Partial<types.User>): Promise<types.User> => {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  },

  // Create or update profile
  upsertProfile: async (userId: string, profile: Partial<types.Profile>): Promise<types.Profile> => {
    const result = await query(
      `INSERT INTO profiles (user_id, full_name, avatar_url, phone, company_name, bio)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
       full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
       avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
       phone = COALESCE(EXCLUDED.phone, profiles.phone),
       company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
       bio = COALESCE(EXCLUDED.bio, profiles.bio)
       RETURNING *`,
      [userId, profile.full_name, profile.avatar_url, profile.phone, profile.company_name, profile.bio]
    );
    return result.rows[0];
  },
};

// Studio Queries
export const studioQueries = {
  // Get all active studios with filters
  getStudios: async (filters?: { city?: string; minPrice?: number; maxPrice?: number }): Promise<types.Studio[]> => {
    let sql = `
      SELECT s.*, 
        json_agg(DISTINCT si.*) as images,
        json_agg(DISTINCT a.*) as amenities,
        json_agg(DISTINCT r.*) as rooms
      FROM studios s
      LEFT JOIN studio_images si ON s.id = si.studio_id
      LEFT JOIN studio_amenities sa ON s.id = sa.studio_id
      LEFT JOIN amenities a ON sa.amenity_id = a.id
      LEFT JOIN rooms r ON s.id = r.studio_id AND r.is_active = true
      WHERE s.is_active = true
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (filters?.city) {
      sql += ` AND s.city ILIKE $${paramIndex}`;
      params.push(`%${filters.city}%`);
      paramIndex++;
    }
    
    sql += ` GROUP BY s.id ORDER BY s.created_at DESC`;
    
    const result = await query(sql, params);
    return result.rows;
  },

  // Get studio by ID with all details
  getStudioById: async (id: string): Promise<types.Studio | null> => {
    const result = await query(
      `SELECT s.*,
        json_agg(DISTINCT si.*) as images,
        json_agg(DISTINCT a.*) as amenities,
        json_agg(DISTINCT r.*) as rooms,
        json_agg(DISTINCT sh.*) as hours
      FROM studios s
      LEFT JOIN studio_images si ON s.id = si.studio_id
      LEFT JOIN studio_amenities sa ON s.id = sa.studio_id
      LEFT JOIN amenities a ON sa.amenity_id = a.id
      LEFT JOIN rooms r ON s.id = r.studio_id AND r.is_active = true
      LEFT JOIN studio_hours sh ON s.id = sh.studio_id
      WHERE s.id = $1
      GROUP BY s.id`,
      [id]
    );
    return result.rows[0] || null;
  },

  // Create studio
  createStudio: async (studio: Omit<types.Studio, 'id' | 'created_at' | 'updated_at'>): Promise<types.Studio> => {
    const result = await query(
      `INSERT INTO studios (owner_id, name, slug, description, short_description, address, city, state, country, postal_code, latitude, longitude, phone, email, website)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [studio.owner_id, studio.name, studio.slug, studio.description, studio.short_description, 
       studio.address, studio.city, studio.state, studio.country, studio.postal_code,
       studio.latitude, studio.longitude, studio.phone, studio.email, studio.website]
    );
    return result.rows[0];
  },
};

// Room Queries
export const roomQueries = {
  // Get room by ID with equipment
  getRoomById: async (id: string): Promise<types.Room | null> => {
    const result = await query(
      `SELECT r.*,
        json_agg(DISTINCT re.*) as equipment
      FROM rooms r
      LEFT JOIN room_equipment re ON r.id = re.room_id
      WHERE r.id = $1
      GROUP BY r.id`,
      [id]
    );
    return result.rows[0] || null;
  },

  // Get available slots for a room
  getAvailableSlots: async (roomId: string, startDate: Date, endDate: Date): Promise<types.AvailabilitySlot[]> => {
    const result = await query(
      `SELECT * FROM availability_slots
       WHERE room_id = $1
       AND start_time >= $2
       AND end_time <= $3
       AND is_available = true
       ORDER BY start_time`,
      [roomId, startDate, endDate]
    );
    return result.rows;
  },
};

// Booking Queries
export const bookingQueries = {
  // Create booking
  createBooking: async (booking: Omit<types.Booking, 'id' | 'booking_number' | 'created_at' | 'updated_at'>): Promise<types.Booking> => {
    const result = await query(
      `INSERT INTO bookings (user_id, room_id, studio_id, start_time, end_time, status, total_price, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [booking.user_id, booking.room_id, booking.studio_id, booking.start_time, 
       booking.end_time, booking.status, booking.total_price, booking.notes]
    );
    return result.rows[0];
  },

  // Get user bookings
  getUserBookings: async (userId: string): Promise<types.Booking[]> => {
    const result = await query(
      `SELECT b.*,
        json_build_object(
          'id', s.id,
          'name', s.name,
          'city', s.city,
          'featured_image_url', s.featured_image_url
        ) as studio,
        json_build_object(
          'id', r.id,
          'name', r.name,
          'capacity', r.capacity
        ) as room
      FROM bookings b
      LEFT JOIN studios s ON b.studio_id = s.id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.user_id = $1
      ORDER BY b.start_time DESC`,
      [userId]
    );
    return result.rows;
  },

  // Update booking status
  updateBookingStatus: async (bookingId: string, status: types.BookingStatus, reason?: string): Promise<types.Booking> => {
    const result = await query(
      `UPDATE bookings 
       SET status = $2, cancellation_reason = $3, cancelled_at = CASE WHEN $2 = 'cancelled' THEN NOW() ELSE cancelled_at END
       WHERE id = $1 
       RETURNING *`,
      [bookingId, status, reason]
    );
    return result.rows[0];
  },
};

// Payment Queries
export const paymentQueries = {
  // Create payment
  createPayment: async (payment: Omit<types.Payment, 'id' | 'created_at' | 'updated_at'>): Promise<types.Payment> => {
    const result = await query(
      `INSERT INTO payments (booking_id, user_id, provider, provider_payment_id, amount, currency, status, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [payment.booking_id, payment.user_id, payment.provider, payment.provider_payment_id, 
       payment.amount, payment.currency, payment.status, payment.payment_method]
    );
    return result.rows[0];
  },

  // Update payment status
  updatePaymentStatus: async (paymentId: string, status: types.PaymentStatus): Promise<types.Payment> => {
    const result = await query(
      'UPDATE payments SET status = $2 WHERE id = $1 RETURNING *',
      [paymentId, status]
    );
    return result.rows[0];
  },
};

// Session Queries
export const sessionQueries = {
  // Create session
  createSession: async (session: Omit<types.Session, 'id' | 'created_at' | 'updated_at'>): Promise<types.Session> => {
    const result = await query(
      `INSERT INTO sessions (booking_id, studio_id, room_id, session_date, notes, status, engineer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [session.booking_id, session.studio_id, session.room_id, session.session_date, 
       session.notes, session.status, session.engineer_id]
    );
    return result.rows[0];
  },

  // Get sessions for user
  getUserSessions: async (userId: string): Promise<types.Session[]> => {
    const result = await query(
      `SELECT s.*,
        json_build_object(
          'id', st.id,
          'name', st.name,
          'featured_image_url', st.featured_image_url
        ) as studio,
        json_build_object(
          'id', r.id,
          'name', r.name
        ) as room
      FROM sessions s
      INNER JOIN bookings b ON s.booking_id = b.id
      LEFT JOIN studios st ON s.studio_id = st.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE b.user_id = $1
      ORDER BY s.session_date DESC`,
      [userId]
    );
    return result.rows;
  },
};

// Task Queries
export const taskQueries = {
  // Create task
  createTask: async (task: Omit<types.Task, 'id' | 'created_at' | 'updated_at'>): Promise<types.Task> => {
    const result = await query(
      `INSERT INTO tasks (session_id, assigned_to, created_by, title, description, task_type, priority, due_date, estimated_hours, price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [task.session_id, task.assigned_to, task.created_by, task.title, task.description,
       task.task_type, task.priority, task.due_date, task.estimated_hours, task.price]
    );
    return result.rows[0];
  },

  // Get tasks for user
  getUserTasks: async (userId: string): Promise<types.Task[]> => {
    const result = await query(
      `SELECT t.*,
        json_build_object(
          'id', s.id,
          'session_code', s.session_code
        ) as session
      FROM tasks t
      LEFT JOIN sessions s ON t.session_id = s.id
      WHERE t.assigned_to = $1
      ORDER BY t.due_date ASC`,
      [userId]
    );
    return result.rows;
  },

  // Update task status
  updateTaskStatus: async (taskId: string, status: types.TaskStatus): Promise<types.Task> => {
    const result = await query(
      `UPDATE tasks 
       SET status = $2, completed_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE completed_at END
       WHERE id = $1 
       RETURNING *`,
      [taskId, status]
    );
    return result.rows[0];
  },
};

// Review Queries
export const reviewQueries = {
  // Create review
  createReview: async (review: Omit<types.Review, 'id' | 'created_at' | 'updated_at'>): Promise<types.Review> => {
    const result = await query(
      `INSERT INTO reviews (studio_id, user_id, booking_id, rating, title, content)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [review.studio_id, review.user_id, review.booking_id, review.rating, review.title, review.content]
    );
    return result.rows[0];
  },

  // Get studio reviews
  getStudioReviews: async (studioId: string): Promise<types.Review[]> => {
    const result = await query(
      `SELECT r.*,
        json_build_object(
          'id', u.id,
          'full_name', p.full_name,
          'avatar_url', p.avatar_url
        ) as user
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE r.studio_id = $1 AND r.status = 'published'
      ORDER BY r.created_at DESC`,
      [studioId]
    );
    return result.rows;
  },
};

// Notification Queries
export const notificationQueries = {
  // Create notification
  createNotification: async (notification: Omit<types.Notification, 'id' | 'created_at'>): Promise<types.Notification> => {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, content, data, action_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [notification.user_id, notification.type, notification.title, notification.content, 
       JSON.stringify(notification.data), notification.action_url]
    );
    return result.rows[0];
  },

  // Get user notifications
  getUserNotifications: async (userId: string, unreadOnly: boolean = false): Promise<types.Notification[]> => {
    let sql = 'SELECT * FROM notifications WHERE user_id = $1';
    const params: any[] = [userId];
    
    if (unreadOnly) {
      sql += ' AND is_read = false';
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const result = await query(sql, params);
    return result.rows;
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    await query(
      'UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1',
      [notificationId]
    );
  },
};
