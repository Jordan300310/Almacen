
import { api } from './api.js';
import { $, $$ } from './ui.js';

let currentCleanup = null;
const TAB_PERM = {
  inventario : 'inventario.ver',
  productos  : 'productos.ver',
  proveedores: 'proveedores.ver',
  empleados  : 'empleados.ver',
  movimientos: 'movimientos.ver',
  ingresos   : 'ingresos.crear',
  salidas    : 'salidas.crear',
  comprobantes: 'movimientos.ver',
  // ajustes   : 'admin.config',
};

const registry = {
  inventario : () => import('../views/inventario.js'),
  productos  : () => import('../views/productos.js'),
  proveedores: () => import('../views/proveedores.js'),
  empleados  : () => import('../views/empleados.js'),
  movimientos: () => import('../views/movimientos.js'),
  ingresos   : () => import('../views/ingresos.js'),
  salidas    : () => import('../views/salidas.js'),
  comprobantes: () => import('../views/comprobantes.js'),
  // ajustes   : () => import('../views/ajustes.js'),
};

const can = (p) => (window.AUTH?.perms || []).includes(p);

// --- Topbar: whoami + logout + permisos ---
async function setupTopbar() {
  try {
    const { user, perms } = await api('me.php'); // me.php debe devolver { user, perms }
    window.AUTH = { user, perms };

    const who = $('#whoami');
    if (who) who.textContent = `${user.username} (${user.cargoNombre || 'Sin rol'})`;

    // Ocultar tabs sin permiso
    document.querySelectorAll('.tabs button').forEach(btn => {
      const t = btn.dataset.tab;
      const need = TAB_PERM[t];
      if (need && !can(need)) btn.style.display = 'none';
    });
  } catch {
    location.href = './login.html';
    return false;
  }

  const btnLogout = $('#btnLogout');
  if (btnLogout && !btnLogout.dataset.bound) {
    btnLogout.dataset.bound = '1';
    btnLogout.addEventListener('click', async () => {
      try { await api('logout.php'); } catch {}
      location.href = './login.html';
    });
  }
  return true;
}

// --- Navegación con cleanup ---
function resetViewNode() {
  const old = $('#view');
  const clone = old.cloneNode(false); // sin hijos ni handlers
  old.replaceWith(clone);
  return clone;
}

async function show(tab) {
  // Chequeo de permiso de la pestaña
  const need = TAB_PERM[tab];
  if (need && !can(need)) {
    const v = resetViewNode();
    v.innerHTML = `<p style="color:#ff6b6b">No autorizado</p>`;
    return;
  }

  if (typeof currentCleanup === 'function') {
    try { currentCleanup(); } catch {}
    currentCleanup = null;
  }

  const view = resetViewNode();
  view.innerHTML = 'Cargando…';
  const modLoader = registry[tab] || registry.inventario;

  try {
    const mod = await modLoader();
    const cleanup = await mod.render(view);   // cada vista puede devolver una función de cleanup
    if (typeof cleanup === 'function') currentCleanup = cleanup;
  } catch (e) {
    view.innerHTML = `<p style="color:#ff6b6b">${e.message || 'Error cargando vista'}</p>`;
  }
}

function bindTabs() {
  $$('.tabs button').forEach(btn => {
    if (btn.dataset.bound) return;
    if (btn.style.display === 'none') return; // no bind a tabs ocultas
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      $$('.tabs button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      history.replaceState(null, '', `#${tab}`);
      show(tab);
    });
  });
}

function pickInitialTab() {
  const fromHash = location.hash?.slice(1);
  if (fromHash && (!TAB_PERM[fromHash] || can(TAB_PERM[fromHash]))) {
    return fromHash;
  }
  // primera visible con permiso
  const visible = [...document.querySelectorAll('.tabs button')]
    .find(b => b.style.display !== 'none');
  return visible?.dataset.tab || 'inventario';
}

// --- Arranque ---
(async function init() {
  const ok = await setupTopbar();
  if (!ok) return;

  bindTabs();

  // primera vista por hash o primera permitida
  const initial = pickInitialTab();
  const btn = document.querySelector(`.tabs button[data-tab="${initial}"]`)
          || document.querySelector('.tabs button:not([style*="display: none"])')
          || $('.tabs button');
  btn?.classList.add('active');
  show(initial);
})();
