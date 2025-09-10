// scripts/views/movimientos.js
import { api } from '../core/api.js';
import { table } from '../core/ui.js';

const can = (p) => (window.AUTH?.perms || []).includes(p);

export async function render(container) {
  // Permiso (el main ya oculta la pestaña, pero doble check)
  if (!can('movimientos.ver')) {
    container.innerHTML = `<p style="color:#ff6b6b">No autorizado</p>`;
    return () => {};
  }

  const ctrl = new AbortController();

  async function load() {
    container.innerHTML = 'Cargando…';
    try {
      const { items } = await api('movimientos_listar.php');
      const headers = ['ID','Fecha (UTC)','Tipo','Producto','Cantidad','Stock Después','Empleado','Motivo','Referencia'];
      const rows = items.map(x => [
        x.Id,
        x.FechaUtc,
        x.Tipo,
        x.Producto,
        x.Cantidad,
        x.StockDespues,
        x.Empleado ?? '-',
        x.Motivo ?? '-',
        x.Referencia ?? '-'
      ]);

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 style="margin:0;">Movimientos</h3>
          <button id="btnMovReload" class="btn">Recargar</button>
        </div>
        ${table(headers, rows)}
      `;

      document.getElementById('btnMovReload')?.addEventListener('click', load, { signal: ctrl.signal });
    } catch (e) {
      container.innerHTML = `<p style="color:#ff6b6b">${e.message || 'Error cargando movimientos'}</p>`;
    }
  }

  await load();

  // cleanup
  return () => ctrl.abort();
}
