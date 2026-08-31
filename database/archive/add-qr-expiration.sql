-- Add QR code expiration configuration to tenant_settings
ALTER TABLE tenant_settings
ADD COLUMN IF NOT EXISTS qr_code_expiration_days INTEGER DEFAULT NULL;

COMMENT ON COLUMN tenant_settings.qr_code_expiration_days IS
'Number of days until QR codes expire. NULL or 0 means never expire. Default is NULL (never expire).';

-- Add QR code tracking fields to tables
ALTER TABLE tables
ADD COLUMN IF NOT EXISTS qr_code_generated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS qr_code_expires_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN tables.qr_code_generated_at IS
'Timestamp when the QR code was generated';

COMMENT ON COLUMN tables.qr_code_expires_at IS
'Timestamp when the QR code expires. NULL means never expires.';

-- Update existing tables to have generated_at set to created_at
UPDATE tables
SET qr_code_generated_at = created_at
WHERE qr_code_generated_at IS NULL AND created_at IS NOT NULL;

-- Function to check if a QR code is expired
CREATE OR REPLACE FUNCTION is_qr_code_expired(
  p_table_id UUID
)
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

-- Function to regenerate QR code for a table
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
    qr_code_expires_at = v_expires_at
  WHERE id = p_table_id;

  RETURN v_new_code;
END;
$$;

COMMENT ON FUNCTION is_qr_code_expired IS
'Check if a table QR code has expired';

COMMENT ON FUNCTION regenerate_table_qr_code IS
'Regenerate QR code for a table with new expiration based on tenant settings';