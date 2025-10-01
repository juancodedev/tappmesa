-- Add missing columns to tables table for QR code management
-- Run this in Supabase SQL Editor

-- 1. Check if columns exist
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tables'
  AND column_name IN ('qr_code_generated_at', 'qr_code_expires_at')
ORDER BY column_name;

-- 2. Add qr_code_generated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tables' AND column_name = 'qr_code_generated_at'
  ) THEN
    ALTER TABLE tables ADD COLUMN qr_code_generated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Column qr_code_generated_at added successfully';
  ELSE
    RAISE NOTICE 'Column qr_code_generated_at already exists';
  END IF;
END $$;

-- 3. Add qr_code_expires_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tables' AND column_name = 'qr_code_expires_at'
  ) THEN
    ALTER TABLE tables ADD COLUMN qr_code_expires_at TIMESTAMPTZ DEFAULT NULL;
    RAISE NOTICE 'Column qr_code_expires_at added successfully';
  ELSE
    RAISE NOTICE 'Column qr_code_expires_at already exists';
  END IF;
END $$;

-- 4. Update existing tables with generated_at = created_at
UPDATE tables
SET qr_code_generated_at = created_at
WHERE qr_code_generated_at IS NULL AND created_at IS NOT NULL;

-- 5. Verify columns were added
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tables'
  AND column_name IN ('qr_code_generated_at', 'qr_code_expires_at', 'unique_code', 'created_at', 'updated_at')
ORDER BY column_name;

-- 6. Add qr_code_expiration_days to tenant_settings if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenant_settings' AND column_name = 'qr_code_expiration_days'
  ) THEN
    ALTER TABLE tenant_settings ADD COLUMN qr_code_expiration_days INTEGER DEFAULT NULL;
    RAISE NOTICE 'Column qr_code_expiration_days added to tenant_settings';
  ELSE
    RAISE NOTICE 'Column qr_code_expiration_days already exists in tenant_settings';
  END IF;
END $$;

-- 7. Create helper functions if they don't exist

-- Function to check if QR code is expired
CREATE OR REPLACE FUNCTION is_qr_code_expired(p_table_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT qr_code_expires_at INTO v_expires_at
  FROM tables
  WHERE id = p_table_id;

  -- If expires_at is NULL, code never expires
  IF v_expires_at IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if current time is past expiration
  RETURN NOW() > v_expires_at;
END;
$$;

-- Function to regenerate QR code with new expiration
CREATE OR REPLACE FUNCTION regenerate_table_qr_code(
  p_table_id UUID,
  p_new_code VARCHAR DEFAULT NULL
)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_expiration_days INTEGER;
  v_new_code VARCHAR;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Get tenant_id for this table
  SELECT tenant_id INTO v_tenant_id
  FROM tables
  WHERE id = p_table_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Table not found';
  END IF;

  -- Get expiration setting for tenant
  SELECT qr_code_expiration_days INTO v_expiration_days
  FROM tenant_settings
  WHERE tenant_id = v_tenant_id;

  -- Calculate expiration date if configured
  IF v_expiration_days IS NOT NULL AND v_expiration_days > 0 THEN
    v_expires_at := NOW() + (v_expiration_days || ' days')::INTERVAL;
  ELSE
    v_expires_at := NULL; -- Never expires
  END IF;

  -- Use provided code or keep existing one
  IF p_new_code IS NOT NULL THEN
    v_new_code := p_new_code;
  ELSE
    SELECT unique_code INTO v_new_code
    FROM tables
    WHERE id = p_table_id;
  END IF;

  -- Update table with new timestamps
  UPDATE tables
  SET
    unique_code = v_new_code,
    qr_code_generated_at = NOW(),
    qr_code_expires_at = v_expires_at,
    updated_at = NOW()
  WHERE id = p_table_id;

  RETURN v_new_code;
END;
$$;

-- 8. Success message
SELECT
  'SUCCESS: All required columns and functions created!' as status,
  COUNT(*) FILTER (WHERE column_name = 'qr_code_generated_at') as has_generated_at,
  COUNT(*) FILTER (WHERE column_name = 'qr_code_expires_at') as has_expires_at
FROM information_schema.columns
WHERE table_name = 'tables';

-- 9. Show sample of table structure
SELECT
  id,
  number,
  unique_code,
  qr_code_generated_at,
  qr_code_expires_at,
  created_at
FROM tables
LIMIT 5;