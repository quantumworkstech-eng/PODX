# PodX Database Setup

## Prerequisites

- PostgreSQL 14+ installed
- Node.js 18+ installed
- npm or yarn package manager

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE podx;

# Exit
\q
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your database credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=podx
DB_USER=postgres
DB_PASSWORD=your_password
```

### 4. Run Schema Migration

```bash
# Option 1: Using psql
psql -U postgres -d podx -f src/db/schema.sql

# Option 2: Using a migration tool (recommended for production)
# See Migration Tools section below
```

### 5. Seed Sample Data (Optional)

```bash
# For development environment
psql -U postgres -d podx -f src/db/seed.sql
```

## Database Schema Overview

### Core Tables

1. **Users & Authentication**
   - `users` - Core identity
   - `profiles` - User metadata
   - `roles` & `user_roles` - Role-based access

2. **Studios & Rooms**
   - `studios` - Studio listings
   - `rooms` - Individual rooms within studios
   - `equipment` & `room_equipment` - Studio equipment
   - `amenities` - Studio features

3. **Booking System**
   - `availability_slots` - Bookable time slots
   - `bookings` - Booking records
   - `cancellation_policies` - Refund rules

4. **Payments**
   - `payments` - Payment transactions
   - `invoices` - Billing records
   - `refunds` - Refund records

5. **Sessions & Media**
   - `sessions` - Recording sessions
   - `media_assets` - Files and recordings
   - `tasks` - Post-production workflow

6. **Reviews & Analytics**
   - `reviews` - User reviews
   - `notifications` - User notifications
   - `studio_analytics` - Performance metrics

## Migration Tools

### Option 1: Simple SQL Files (Development)

```bash
# Apply schema
psql -U postgres -d podx -f src/db/schema.sql

# Apply seed data
psql -U postgres -d podx -f src/db/seed.sql
```

### Option 2: Using a Migration Framework (Production)

For production, consider using:

- **[Prisma](https://prisma.io)** - Recommended for Node.js/Next.js
- **[Drizzle ORM](https://orm.drizzle.team)** - TypeScript-first ORM
- **[pg-migrate](https://github.com/salsita/node-pg-migrate)** - PostgreSQL migrations

#### Using Prisma (Recommended)

```bash
# Install Prisma
npm install prisma @prisma/client

# Initialize Prisma
npx prisma init

# Generate schema from existing database
npx prisma db pull

# Or use introspection
npx prisma introspect

# Create migrations
npx prisma migrate dev --name init

# Deploy migrations
npx prisma migrate deploy
```

## Database Queries

All database queries are organized in `src/db/queries.ts`:

```typescript
import { userQueries, studioQueries, bookingQueries } from '@/db/queries';

// Example: Get all studios
const studios = await studioQueries.getStudios({ city: 'Mumbai' });

// Example: Create a booking
const booking = await bookingQueries.createBooking({
  user_id: 'user-uuid',
  room_id: 'room-uuid',
  studio_id: 'studio-uuid',
  start_time: new Date(),
  end_time: new Date(),
  status: 'pending',
  total_price: 2500
});
```

## Connection Pool

The database connection pool is configured in `src/db/index.ts`:

- **Max connections**: 20
- **Idle timeout**: 30 seconds
- **Connection timeout**: 2 seconds
- **SSL**: Enabled in production

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `podx` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `DATABASE_URL` | Full connection string | - |

## Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore` by default
2. **Use strong passwords** - Especially in production
3. **Enable SSL** - Always use SSL in production
4. **Restrict database access** - Use specific user roles
5. **Regular backups** - Set up automated backups

## Backup & Restore

### Backup

```bash
# Backup entire database
pg_dump -U postgres -d podx > podx_backup_$(date +%Y%m%d).sql

# Backup specific tables
pg_dump -U postgres -d podx -t bookings -t users > podx_tables_backup.sql
```

### Restore

```bash
# Restore from backup
psql -U postgres -d podx < podx_backup_20250220.sql
```

## Troubleshooting

### Connection refused

```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Start PostgreSQL
sudo service postgresql start
```

### Permission denied

```bash
# Grant permissions
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE podx TO your_username;
\q
```

### Migration errors

```bash
# Reset database (⚠️ Destroys all data)
psql -U postgres -c "DROP DATABASE podx;"
psql -U postgres -c "CREATE DATABASE podx;"
psql -U postgres -d podx -f src/db/schema.sql
```

## Next Steps

1. Set up authentication (NextAuth.js)
2. Configure payment providers (Stripe/Razorpay)
3. Set up file storage (AWS S3)
4. Configure email service (Resend/SendGrid)
5. Deploy to production

## Support

For issues or questions:
- Check the [Next.js documentation](https://nextjs.org/docs)
- Review [PostgreSQL documentation](https://www.postgresql.org/docs/)
- Open an issue in the project repository
