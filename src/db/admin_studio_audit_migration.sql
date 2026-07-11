-- Admin audit fields on studios (run once on your database)
ALTER TABLE studios
  ADD COLUMN IF NOT EXISTS admin_last_edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_last_edited_by TEXT;

COMMENT ON COLUMN studios.admin_last_edited_at IS 'Last time an admin saved changes via admin panel';
COMMENT ON COLUMN studios.admin_last_edited_by IS 'Admin email that last edited this studio';
