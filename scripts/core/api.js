export async function api(path, opts = {}) {
  const res = await fetch(`../backend/api/${path}`, {
    credentials: 'include',
    ...opts
  });

  if (res.status === 401) {
    console.warn('401 (No autenticado) en', path);
    const next = encodeURIComponent(
      (location.pathname.split('/').pop() || '') + location.search + location.hash
    );
    location.href = `./login.html?next=${next}`;
    throw new Error('No autenticado');
  }

  let data;
  try { data = await res.json(); }
  catch { data = { ok:false, error: 'JSON inválido' }; }

  if (res.status === 403 || data?.error === 'No autorizado') {
    throw new Error('No autorizado');
  }

  if (!res.ok || !data.ok) {
    const det = data?.extra?.detalle || data?.error || `HTTP ${res.status}`;
    throw new Error(det);
  }
  return data.data;
}
