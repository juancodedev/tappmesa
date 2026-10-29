// api/utils/hostResolver.js
//
// Resuelve el subdomain de un tenant desde el header Host (flujo takeout,
// task 1.7). Paridad server-side con la lógica del cliente (TenantContext).
//
// Formatos soportados:
//   [name]-tappmesa.vercel.app   → 'name-tappmesa'  (subdomain tal cual en DB)
//   *.tappmesa.com               → subdomain
//   *.localhost / *.local        → dev local (multi-level, sin puerto)
//   <tenant>.<base>              → para cada dominio base en TENANT_BASE_DOMAINS
//                                  (lista separada por comas, ej. "juancode.dev").
//                                  Solo un label de prefijo; www y el dominio pelado → null.
//
// Devuelve null cuando no hay subdomain reconocible (landing, www, custom
// domain sin mapeo: esos requieren configuración explícita, fuera de S1).

function getBaseDomains() {
  return (process.env.TENANT_BASE_DOMAINS || '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

function resolveFromBaseDomains(h) {
  for (const base of getBaseDomains()) {
    if (!h.endsWith(`.${base}`)) continue;
    const prefix = h.slice(0, -(base.length + 1));
    if (!prefix || prefix === 'www' || prefix.includes('.')) return null;
    return prefix;
  }
  return undefined;
}

function stripPort(host) {
  return host.replace(/:\d+$/, '').toLowerCase();
}

function resolveSubdomain(host) {
  if (!host || typeof host !== 'string') return null;

  const h = stripPort(host);
  if (h === 'localhost') return null;

  if (h.endsWith('.localhost')) {
    const parts = h.split('.');
    return parts.length >= 2 ? parts.slice(0, -1).join('.') : null;
  }

  if (h.endsWith('.local')) {
    const parts = h.split('.');
    return parts.length >= 2 ? parts.slice(0, -1).join('.') : null;
  }

  if (h.endsWith('.tappmesa.vercel.app')) {
    return h.replace('.tappmesa.vercel.app', '');
  }

  if (h.endsWith('.vercel.app')) {
    return h.replace('.vercel.app', '');
  }

  if (h.endsWith('.tappmesa.com')) {
    const sub = h.replace('.tappmesa.com', '');
    return sub === 'www' ? null : sub;
  }

  const fromBase = resolveFromBaseDomains(h);
  if (fromBase !== undefined) return fromBase;

  return null; // custom domain sin mapeo en TENANT_BASE_DOMAINS
}

module.exports = { resolveSubdomain };