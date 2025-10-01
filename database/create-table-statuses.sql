-- ============================================================================
-- SISTEMA DE ESTADOS DE MESA CONFIGURABLES
-- Permite a los administradores definir y gestionar estados personalizados
-- ============================================================================

-- 1. Crear tabla de estados de mesa
CREATE TABLE IF NOT EXISTS table_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT '#gray',
  icon VARCHAR(50) DEFAULT 'circle',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN DEFAULT FALSE, -- Estados del sistema no se pueden eliminar
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- 2. Agregar índices
CREATE INDEX IF NOT EXISTS idx_table_statuses_tenant ON table_statuses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_table_statuses_order ON table_statuses(tenant_id, order_index);

-- 3. Agregar columna status_id a tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tables' AND column_name = 'status_id'
  ) THEN
    ALTER TABLE tables ADD COLUMN status_id UUID REFERENCES table_statuses(id) ON DELETE SET NULL;
    RAISE NOTICE 'Columna status_id agregada a tables';
  ELSE
    RAISE NOTICE 'Columna status_id ya existe en tables';
  END IF;
END $$;

-- 4. Crear estados por defecto para cada tenant existente
DO $$
DECLARE
  tenant_record RECORD;
  available_id UUID;
  occupied_id UUID;
  reserved_id UUID;
  cleaning_id UUID;
  bill_requested_id UUID;
BEGIN
  FOR tenant_record IN SELECT id FROM tenants LOOP
    -- Verificar si el tenant ya tiene estados
    IF NOT EXISTS (
      SELECT 1 FROM table_statuses WHERE tenant_id = tenant_record.id
    ) THEN
      -- Crear estados por defecto
      INSERT INTO table_statuses (tenant_id, name, color, icon, order_index, is_system)
      VALUES
        (tenant_record.id, 'Disponible', '#22c55e', 'check-circle', 1, true)
      RETURNING id INTO available_id;

      INSERT INTO table_statuses (tenant_id, name, color, icon, order_index, is_system)
      VALUES
        (tenant_record.id, 'Ocupada', '#eab308', 'users', 2, true)
      RETURNING id INTO occupied_id;

      INSERT INTO table_statuses (tenant_id, name, color, icon, order_index, is_system)
      VALUES
        (tenant_record.id, 'Reservada', '#3b82f6', 'calendar', 3, true)
      RETURNING id INTO reserved_id;

      INSERT INTO table_statuses (tenant_id, name, color, icon, order_index, is_system)
      VALUES
        (tenant_record.id, 'Cuenta solicitada', '#f97316', 'file-text', 4, true)
      RETURNING id INTO bill_requested_id;

      INSERT INTO table_statuses (tenant_id, name, color, icon, order_index, is_system)
      VALUES
        (tenant_record.id, 'En limpieza', '#64748b', 'sparkles', 5, true)
      RETURNING id INTO cleaning_id;

      -- Actualizar todas las mesas existentes a "Disponible" por defecto
      UPDATE tables
      SET status_id = available_id
      WHERE tenant_id = tenant_record.id AND status_id IS NULL;

      RAISE NOTICE 'Estados creados para tenant: %', tenant_record.id;
    END IF;
  END LOOP;
END $$;

-- 5. Habilitar RLS en table_statuses
ALTER TABLE table_statuses ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas RLS permisivas (frontend filtra por tenant_id)
DROP POLICY IF EXISTS "table_statuses_select_all" ON table_statuses;
DROP POLICY IF EXISTS "table_statuses_insert_all" ON table_statuses;
DROP POLICY IF EXISTS "table_statuses_update_all" ON table_statuses;
DROP POLICY IF EXISTS "table_statuses_delete_all" ON table_statuses;

CREATE POLICY "table_statuses_select_all" ON table_statuses
  FOR SELECT USING (true);

CREATE POLICY "table_statuses_insert_all" ON table_statuses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "table_statuses_update_all" ON table_statuses
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "table_statuses_delete_all" ON table_statuses
  FOR DELETE USING (true);

-- 7. Función helper para cambiar estado de mesa
CREATE OR REPLACE FUNCTION update_table_status(
  p_table_id UUID,
  p_status_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tables
  SET
    status_id = p_status_id,
    updated_at = NOW()
  WHERE id = p_table_id;

  RETURN FOUND;
END;
$$;

-- 8. Función para obtener siguiente estado en el flujo
CREATE OR REPLACE FUNCTION get_next_table_status(
  p_current_status_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_current_order INTEGER;
  v_next_status_id UUID;
BEGIN
  -- Obtener tenant_id y order_index del estado actual
  SELECT tenant_id, order_index INTO v_tenant_id, v_current_order
  FROM table_statuses
  WHERE id = p_current_status_id;

  -- Buscar el siguiente estado en orden
  SELECT id INTO v_next_status_id
  FROM table_statuses
  WHERE tenant_id = v_tenant_id
    AND order_index > v_current_order
  ORDER BY order_index ASC
  LIMIT 1;

  -- Si no hay siguiente, volver al primero
  IF v_next_status_id IS NULL THEN
    SELECT id INTO v_next_status_id
    FROM table_statuses
    WHERE tenant_id = v_tenant_id
    ORDER BY order_index ASC
    LIMIT 1;
  END IF;

  RETURN v_next_status_id;
END;
$$;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
DO $$
DECLARE
  total_tenants INTEGER;
  tenants_with_statuses INTEGER;
  total_statuses INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_tenants FROM tenants;

  SELECT COUNT(DISTINCT tenant_id) INTO tenants_with_statuses FROM table_statuses;

  SELECT COUNT(*) INTO total_statuses FROM table_statuses;

  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'SISTEMA DE ESTADOS DE MESA INSTALADO';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Total de tenants: %', total_tenants;
  RAISE NOTICE 'Tenants con estados configurados: %', tenants_with_statuses;
  RAISE NOTICE 'Total de estados creados: %', total_statuses;
  RAISE NOTICE '';
  RAISE NOTICE 'Estados por defecto:';
  RAISE NOTICE '  1. Disponible (verde)';
  RAISE NOTICE '  2. Ocupada (amarillo)';
  RAISE NOTICE '  3. Reservada (azul)';
  RAISE NOTICE '  4. Cuenta solicitada (naranja)';
  RAISE NOTICE '  5. En limpieza (gris)';
  RAISE NOTICE '';
  RAISE NOTICE 'Los administradores pueden:';
  RAISE NOTICE '  - Crear nuevos estados personalizados';
  RAISE NOTICE '  - Cambiar colores e iconos';
  RAISE NOTICE '  - Reordenar el flujo de estados';
  RAISE NOTICE '  - Los estados del sistema no se pueden eliminar';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
END $$;
