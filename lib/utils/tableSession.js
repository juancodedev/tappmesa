// lib/utils/tableSession.js
//
// Table-session capability lookup shared by the customer routes
// (/api/orders, /api/waiter-calls). The capability is the opaque
// `capability_token` minted by /api/table-sessions; it is matched by equality
// and only an active, open session is accepted.

// Capability → table session. null = invalid, unknown or closed.
async function findSessionByCapability(supabase, capability) {
  if (!capability) return null;
  const { data, error } = await supabase
    .from('table_sessions')
    .select('id, tenant_id, status, ended_at')
    .eq('capability_token', capability)
    .maybeSingle();

  if (error || !data) return null;
  if (data.status !== 'active' || data.ended_at) return null;
  return data;
}

module.exports = { findSessionByCapability };
