// scripts/views/ingresos.js
import { api } from '../core/api.js';
import { loadPartialFromUrl, setMsg, ensureCss } from '../core/ui.js';

// helper de permisos (inyectados por main en window.AUTH)
const can = (p) => (window.AUTH?.perms || []).includes(p);

export async function render(container) {
  // Seguridad extra: si no tiene permiso, no renderizamos el modal
  if (!can('ingresos.crear')) {
    container.innerHTML = `<p style="color:#ff6b6b">No autorizado</p>`;
    return () => {};
  }

  container.innerHTML = ''; // solo modal

  // Cargar CSS del módulo y el HTML del modal
  await ensureCss('../estilos/ingresos.css');
  const node = await loadPartialFromUrl('modal-ingreso', '../modulos/partials/modal-ingreso.html');

  const close = () => node.remove();
  const $msg  = node.querySelector('#ing_msg');

  // Botones
  node.querySelector('#ing_cancel')?.addEventListener('click', close);

  // Validación visual del Producto ID al perder foco
  node.querySelector('#ing_productoId')?.addEventListener('blur', async (e) => {
    const id = Number(e.target.value);
    if (!id) return;
    try {
      await api(`producto_validar.php?id=${id}`);
      e.target.style.borderColor = '#7CFC98'; // OK
    } catch {
      e.target.style.borderColor = '#ff6b6b'; // inválido
    }
  });

  // Guardar ingreso
  node.querySelector('#ing_guardar')?.addEventListener('click', async () => {
    const productoId = Number(node.querySelector('#ing_productoId')?.value);
    const cantidad   = Number(node.querySelector('#ing_cantidad')?.value);
    const motivo     = (node.querySelector('#ing_motivo')?.value || '').trim();
    const referencia = (node.querySelector('#ing_ref')?.value || '').trim();

    setMsg($msg, '');

    // Validaciones rápidas
    if (!productoId || productoId <= 0) { setMsg($msg, 'Producto ID inválido'); return; }
    if (!Number.isFinite(cantidad) || cantidad <= 0) { setMsg($msg, 'La cantidad debe ser mayor a 0'); return; }

    // Verificar que el producto exista y esté activo con inventario
    try {
      await api(`producto_validar.php?id=${productoId}`);
    } catch {
      setMsg($msg, 'El producto no existe o está inactivo'); 
      return;
    }

    const btn = node.querySelector('#ing_guardar');
    try {
      btn.disabled = true;
      await api('ingresos_crear.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productoId, cantidad, motivo, referencia })
      });
      setMsg($msg, 'Ingreso registrado', true);
      setTimeout(close, 700);
    } catch (e) {
      setMsg($msg, e.message || 'No se pudo registrar el ingreso');
    } finally {
      btn.disabled = false;
    }
  });

  // Enter en inputs => Guardar
  ['#ing_productoId', '#ing_cantidad', '#ing_motivo', '#ing_ref'].forEach((sel) => {
    node.querySelector(sel)?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') node.querySelector('#ing_guardar')?.click();
    });
  });

  // Cleanup al cambiar de pestaña
  return () => { try { node.remove(); } catch {} };
}
