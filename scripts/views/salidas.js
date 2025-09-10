// scripts/views/salidas.js
import { api } from '../core/api.js';
import { loadPartialFromUrl, setMsg, ensureCss } from '../core/ui.js';

const can = (p) => (window.AUTH?.perms || []).includes(p);

function itemRow() {
  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = `
    <input type="number" placeholder="Producto ID" class="it_prod" min="1">
    <input type="number" placeholder="Cantidad" class="it_cant" min="1">
    <input type="text" placeholder="Observaciones" class="it_obs">
    <button type="button" class="it_del">X</button>
  `;
  row.querySelector('.it_del').onclick = () => row.remove();
  return row;
}

export async function render(container) {
  if (!can('salidas.crear')) {
    container.innerHTML = `<p style="color:#ff6b6b">No autorizado</p>`;
    return () => {};
  }

  container.innerHTML = '';
  await ensureCss('../estilos/salidas.css');
  const node = await loadPartialFromUrl('modal-salida', '../modulos/partials/modal-salida.html');
  const close = () => node.remove();

  // Cargar clientes
  try {
    const { items } = await api('clientes_listar.php');
    const sel = node.querySelector('#sal_cliente');
    sel.innerHTML = `<option value="">— Selecciona cliente —</option>` +
      items.map(c => `<option value="${c.Id}">${c.Nombre}</option>`).join('');
  } catch {
    // si falla, deja el combo con la opción por defecto
  }

  // Ítems
  const itemsWrap = node.querySelector('#sal_items');
  const add = () => itemsWrap.appendChild(itemRow());
  add();
  node.querySelector('#sal_add').onclick = add;
  node.querySelector('#sal_cancel').onclick = close;

  // Validación visual del producto
  node.addEventListener('blur', async (e) => {
    if (!e.target.classList?.contains('it_prod')) return;
    const id = Number(e.target.value);
    if (!id) return;
    try {
      await api(`producto_validar.php?id=${id}`);
      e.target.style.borderColor = '#7CFC98';
    } catch {
      e.target.style.borderColor = '#ff6b6b';
    }
  }, true);

  // Guardar
  node.querySelector('#sal_guardar').onclick = async () => {
    const clienteSel = node.querySelector('#sal_cliente');
    const clienteId  = Number(clienteSel?.value || 0);
    const obs        = node.querySelector('#sal_obs').value.trim();
    const motivo     = node.querySelector('#sal_motivo').value.trim();
    const msg        = node.querySelector('#sal_msg');
    setMsg(msg, '');

    if (!clienteId) { setMsg(msg, 'Selecciona un cliente'); return; }

    const items = [...itemsWrap.querySelectorAll('.item-row')].map(r => {
      const productoId    = Number(r.querySelector('.it_prod').value);
      const cantidad      = Number(r.querySelector('.it_cant').value);
      const observaciones = r.querySelector('.it_obs').value.trim();
      return { productoId, cantidad, observaciones };
    }).filter(x => x.productoId > 0 && x.cantidad > 0);

    if (!items.length) { setMsg(msg, 'Agrega al menos un ítem'); return; }

    // Verificar productos existen
    try {
      await Promise.all(items.map(it => api(`producto_validar.php?id=${it.productoId}`)));
    } catch {
      setMsg(msg, 'Uno o más productos no existen'); return;
    }

    try {
      const data = await api('salidas_crear.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clienteId, observaciones: obs, motivo, items })
      });
      setMsg(msg, `Salida registrada: ${data.numero}`, true);
      setTimeout(close, 800);
    } catch (e) {
      setMsg(msg, e.message);
    }
  };

  return () => { try { node.remove(); } catch {} };
}
