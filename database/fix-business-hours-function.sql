-- Corregir función is_business_open

CREATE OR REPLACE FUNCTION is_business_open(tenant_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_day INTEGER;
  current_time_val TIME;
  business_hours_data JSON;
  day_name TEXT;
  is_open BOOLEAN;
BEGIN
  -- Obtener día actual (0 = domingo, 1 = lunes, etc.)
  current_day := EXTRACT(DOW FROM CURRENT_TIMESTAMP);
  current_time_val := CURRENT_TIME;

  -- Mapear número de día a nombre
  day_name := CASE current_day
    WHEN 0 THEN 'sunday'
    WHEN 1 THEN 'monday'
    WHEN 2 THEN 'tuesday'
    WHEN 3 THEN 'wednesday'
    WHEN 4 THEN 'thursday'
    WHEN 5 THEN 'friday'
    WHEN 6 THEN 'saturday'
  END;

  -- Obtener configuración de horarios
  SELECT business_hours INTO business_hours_data
  FROM tenant_settings
  WHERE tenant_id = tenant_id_param;

  IF business_hours_data IS NULL THEN
    RETURN true; -- Si no hay configuración, asumir abierto
  END IF;

  -- Verificar si está cerrado el día actual
  IF (business_hours_data->day_name->>'closed')::BOOLEAN = true THEN
    RETURN false;
  END IF;

  -- Verificar horario
  is_open := current_time_val BETWEEN
    (business_hours_data->day_name->>'open')::TIME AND
    (business_hours_data->day_name->>'close')::TIME;

  RETURN is_open;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Función is_business_open corregida' as resultado;