// scripts/views/inventario.js
import { api } from '../core/api.js';
import { table } from '../core/ui.js';

const can = (p) => (window.AUTH?.perms || []).includes(p);

export async function render(container) {
  // Doble check de permiso (el main ya oculta la pestaña)
  if (!can('inventario.ver')) {
    container.innerHTML = `<p style="color:#ff6b6b">No autorizado</p>`;
    return () => {};
  }

  const ctrl = new AbortController();

  async function load() {
    container.innerHTML = 'Cargando…';
    try {
      const { items } = await api('inventario_listar.php');
      const headers = ['ID','SKU','Producto','Precio','Categoría','Proveedor','Stock','Min'];
      const rows = items.map(x => [
        x.ProductoId,
        x.SKU,
        x.Producto,
        Number(x.Precio).toFixed(2),
        x.Categoria,
        x.Proveedor ?? '-',
        x.Stock,
        x.MinStock ?? '-'
      ]);

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 style="margin:0;">Inventario</h3>
          <button id="btnInvReload" class="btn">Recargar</button>
        </div>
        ${table(headers, rows)}
      `;

      document.getElementById('btnInvReload')?.addEventListener('click', load, { signal: ctrl.signal });
    } catch (e) {
      container.innerHTML = `<p style="color:#ff6b6b">${e.message || 'Error cargando inventario'}</p>`;
    }
  }

  await load();

  // cleanup
  return () => ctrl.abort();
}
