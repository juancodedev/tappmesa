// api/admin/users.js
//
// CRUD de usuarios admin (task 1.9, spec ADM-001). Detrás de `requireAuth`
// + chequeo de rol. Todo hash/scope se resuelve server-side:
//
//   POST   /api/admin/users        → crear (bcrypt 12, tenant/rol desde claims)
//   GET    /api/admin/users        → listar (tenant_admin: propio tenant; super_admin: ?tenant_id o todos)
//   PUT    /api/admin/users/:id    → actualizar (password opcional → re-hash)
//   DELETE /api/admin/users/:id    → borrar (409 self-delete)
//
// Reglas (ADM-001):
//   * tenant_id/role NUNCA del body salvo super_admin (tenant_id).
//   * tenant_admin → sólo su tenant + allowlist de roles (jamás super_admin).
//   * Respuestas SIEMPRE sin password_hash.
//   * Chequeo de email duplicado por tenant antes de crear/actualizar.
//   * Filas de auditoría en admin_audit_logs (sin hashes).
//   * 201/200/204 | 400 | 403 | 404 | 409 | 401 | 429.
//
// Factory `createAdminUsersHandler({ supabase, requireAuth })` para tests;
// el default export usa client service-role + createRequireAuth().

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const { createRequireAuth } = require('../middleware/requireAuth');
const { corsMiddleware } = require('../middleware/cors');
const { rateLimiter, blacklistMiddleware } = require('../middleware/rateLimit');
const { validatePassword } = require('../middleware/validation');
const logger = require('../utils/logger');

const BCRYPT_ROUNDS = 12;
const TENANT_ROLE_ALLOWLIST = ['staff', 'waiter', 'kitchen', 'manager', 'cashier', 'tenant_admin'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAFE_FIELDS = [
  'id', 'tenant_id', 'email', 'full_name', 'phone', 'role', 'is_active',
  'last_login', 'created_at', 'updated_at', 'needs_password_reset',
];

function getPathSegments(req) {
  return (req.url || '').split('?')[0].split('/').filter(Boolean); // ['api','admin','users', id?]
}

function sanitizeUser(user) {
  if (!user) return null;
  const out = {};
  for (const key of SAFE_FIELDS) {
    if (key in user) out[key] = user[key];
  }
  return out;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function writeAudit(supabase, { userId, tenantId, action, resource, resourceId, oldValues, newValues, req }) {
  try {
    const { error } = await supabase.from('admin_audit_logs').insert({
      user_id: userId,
      tenant_id: tenantId,
      action,
      resource,
      resource_id: resourceId || null,
      old_values: oldValues || null,
      new_values: newValues || null,
      ip_address: req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || null,
      user_agent: req.headers?.['user-agent'] || null,
    });
    if (error) logger.error('audit write failed', error);
  } catch (auditError) {
    logger.error('audit write failed', auditError);
  }
}

// ---------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------

async function createUser(supabase, req, res) {
  const body = req.body || {};
  const claims = req.adminSession;

  const email = normalizeEmail(body.email);
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  const pw = validatePassword(body.password);
  if (!pw.valid) {
    return res.status(400).json({ error: pw.error });
  }
  if (!body.full_name || !String(body.full_name).trim()) {
    return res.status(400).json({ error: 'full_name es requerido' });
  }

  const isSuper = claims.admin.role === 'super_admin';

  // tenant_id/role desde claims (ADM-001)
  let tenantId = claims.admin.tenant_id;
  let role = body.role || 'staff';
  if (isSuper) {
    tenantId = body.tenant_id || null;
  } else {
    if (body.tenant_id && body.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'No puedes crear usuarios en otro tenant' });
    }
    if (!TENANT_ROLE_ALLOWLIST.includes(role)) {
      return res.status(403).json({ error: 'Rol no permitido' });
    }
  }

  if (tenantId === null || tenantId === undefined) {
    return res.status(400).json({ error: 'tenant_id es requerido' });
  }

  // Email duplicado por tenant
  const { data: dup } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', email)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (dup) {
    return res.status(400).json({ error: 'Ya existe un usuario con ese email en este tenant' });
  }

  const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);

  const { data: created, error } = await supabase
    .from('admin_users')
    .insert({
      tenant_id: tenantId,
      full_name: String(body.full_name).trim(),
      email,
      phone: body.phone || null,
      role,
      password_hash: passwordHash,
      is_active: body.is_active !== false,
    })
    .select()
    .single();

  if (error) {
    if (/23505|duplicate/.test(error.message || '')) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }
    logger.error('admin_users create error', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }

  await writeAudit(supabase, {
    userId: claims.admin.id,
    tenantId,
    action: 'create',
    resource: 'admin_users',
    resourceId: created.id,
    newValues: sanitizeUser(created),
    req,
  });

  return res.status(201).json({ user: sanitizeUser(created) });
}

async function listUsers(supabase, req, res) {
  const claims = req.adminSession;
  const isSuper = claims.admin.role === 'super_admin';
  const requestedTenant = req.query?.tenant_id;

  let query = supabase.from('admin_users').select('*');
  if (isSuper) {
    if (requestedTenant) query = query.eq('tenant_id', requestedTenant);
  } else {
    query = query.eq('tenant_id', claims.admin.tenant_id);
  }
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    logger.error('admin_users list error', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
  return res.status(200).json({ users: (data || []).map(sanitizeUser) });
}

async function updateUser(supabase, req, res, userId) {
  const body = req.body || {};
  const claims = req.adminSession;
  const isSuper = claims.admin.role === 'super_admin';

  // Reglas de rol/tenant ANTES de tocar la BD (ADM-001)
  if (!isSuper) {
    if (body.tenant_id && body.tenant_id !== claims.admin.tenant_id) {
      return res.status(403).json({ error: 'No puedes mover usuarios entre tenants' });
    }
    if (body.role && !TENANT_ROLE_ALLOWLIST.includes(body.role)) {
      return res.status(403).json({ error: 'Rol no permitido' });
    }
  }

  // Scope: el UPDATE lleva el tenant del claims como filtro server-side
  // (sin pre-fetch: una sola query, sin TOCTOU). 0 filas → 404.
  const updateData = {};
  if (body.full_name !== undefined) updateData.full_name = String(body.full_name).trim();
  if (body.email !== undefined) {
    const email = normalizeEmail(body.email);
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    // dup email por tenant, excluyendo al propio usuario
    let dupQuery = supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .neq('id', userId);
    if (!isSuper) dupQuery = dupQuery.eq('tenant_id', claims.admin.tenant_id);
    const { data: dup } = await dupQuery.maybeSingle();
    if (dup) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email en este tenant' });
    }
    updateData.email = email;
  }
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.is_active !== undefined) updateData.is_active = body.is_active === true;
  if (body.role !== undefined) updateData.role = body.role;
  if (body.password) {
    const pw = validatePassword(body.password);
    if (!pw.valid) {
      return res.status(400).json({ error: pw.error });
    }
    updateData.password_hash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
  }
  updateData.updated_at = new Date().toISOString();

  let query = supabase.from('admin_users').update(updateData).eq('id', userId);
  if (!isSuper) query = query.eq('tenant_id', claims.admin.tenant_id);
  query = query.select().single();

  const { data: updated, error } = await query;

  if (error) {
    if (/PGRST116/.test(error.message || '')) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (/23505|duplicate/.test(error.message || '')) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }
    logger.error('admin_users update error', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
  if (!updated) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  await writeAudit(supabase, {
    userId: claims.admin.id,
    tenantId: updated.tenant_id,
    action: 'update',
    resource: 'admin_users',
    resourceId: updated.id,
    newValues: sanitizeUser(updated),
    req,
  });

  return res.status(200).json({ user: sanitizeUser(updated) });
}

async function deleteUser(supabase, req, res, userId) {
  const claims = req.adminSession;
  const isSuper = claims.admin.role === 'super_admin';

  if (userId === claims.admin.id) {
    return res.status(409).json({ error: 'No puedes eliminar tu propio usuario' });
  }

  let query = supabase.from('admin_users').delete().eq('id', userId);
  if (!isSuper) query = query.eq('tenant_id', claims.admin.tenant_id);

  const { data: deletedRows, error } = await query;
  if (error) {
    logger.error('admin_users delete error', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
  if (!Array.isArray(deletedRows) || deletedRows.length === 0) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  await writeAudit(supabase, {
    userId: claims.admin.id,
    tenantId: deletedRows[0]?.tenant_id || claims.admin.tenant_id,
    action: 'delete',
    resource: 'admin_users',
    resourceId: userId,
    req,
  });

  return res.status(204).json({});
}

// ---------------------------------------------------------------------
// Factory + default export
// ---------------------------------------------------------------------

function createAdminUsersHandler({ supabase, requireAuth }) {
  return async function adminUsersHandler(req, res) {
    if (corsMiddleware(req, res, ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'])) return;

    if (blacklistMiddleware(req, res)) return;
    if (await requireAuth(req, res)) return; // 401 gestionado por el middleware

    if (await rateLimiter('admin/users')(req, res)) return; // 429

    const segments = getPathSegments(req); // ['api','admin','users', id?]
    const userId = segments[3];

    try {
      switch (req.method) {
        case 'POST':
          return await createUser(supabase, req, res);
        case 'GET':
          return await listUsers(supabase, req, res);
        case 'PUT':
        case 'PATCH':
          if (!userId) return res.status(400).json({ error: 'user id requerido' });
          return await updateUser(supabase, req, res, userId);
        case 'DELETE':
          if (!userId) return res.status(400).json({ error: 'user id requerido' });
          return await deleteUser(supabase, req, res, userId);
        default:
          return res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (error) {
      logger.error('admin-users handler error', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = createAdminUsersHandler({
  supabase,
  requireAuth: createRequireAuth(),
});
module.exports.createAdminUsersHandler = createAdminUsersHandler;