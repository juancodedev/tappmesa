-- Corregir logs de auditoría

-- Crear log de migración completada sin campo notes
INSERT INTO admin_audit_logs (action, resource, created_at)
VALUES (
  'security_migration_complete',
  'authentication_system',
  NOW()
);

SELECT 'Logs de auditoría corregidos' as resultado;