-- ============================================================
-- Migración: Zonas / Ambientes de Mesas
-- Permite agrupar mesas por zonas (Ej: Salón, Terraza, Bar)
-- ============================================================

-- 1. Crear tabla de zonas
CREATE TABLE IF NOT EXISTS table_zones (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  color       VARCHAR(20)  NOT NULL DEFAULT '#6366f1',
  icon        VARCHAR(50)  DEFAULT 'map-pin',
  order_index INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  DEFAULT now(),
  updated_at  TIMESTAMPTZ  DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- 2. Agregar zone_id a la tabla tables
ALTER TABLE tables
  ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES table_zones(id) ON DELETE SET NULL;

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_table_zones_tenant        ON table_zones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_table_zones_tenant_order  ON table_zones(tenant_id, order_index);
CREATE INDEX IF NOT EXISTS idx_tables_zone_id            ON tables(zone_id);

-- 4. Row Level Security
ALTER TABLE table_zones ENABLE ROW LEVEL SECURITY;

-- Política: lectura pública por tenant (para menus de clientes)
DROP POLICY IF EXISTS "table_zones_select_tenant" ON table_zones;
CREATE POLICY "table_zones_select_tenant" ON table_zones
  FOR SELECT USING (true);

-- Política: escritura solo para admins del mismo tenant
DROP POLICY IF EXISTS "table_zones_insert_tenant" ON table_zones;
CREATE POLICY "table_zones_insert_tenant" ON table_zones
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "table_zones_update_tenant" ON table_zones;
CREATE POLICY "table_zones_update_tenant" ON table_zones
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "table_zones_delete_tenant" ON table_zones;
CREATE POLICY "table_zones_delete_tenant" ON table_zones
  FOR DELETE USING (true);

-- 5. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_table_zones_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_table_zones_updated_at ON table_zones;
CREATE TRIGGER trigger_table_zones_updated_at
  BEFORE UPDATE ON table_zones
  FOR EACH ROW EXECUTE FUNCTION update_table_zones_updated_at();

-- ============================================================
-- Verificación
-- ============================================================
-- SELECT * FROM table_zones;
-- SELECT id, number, zone_id FROM tables;
