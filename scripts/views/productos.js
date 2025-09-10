// scripts/views/productos.js
import { api } from '../core/api.js';
import { table, ensureCss, loadPartialFromUrl, setMsg, $ } from '../core/ui.js';

// helper de permisos (inyectados por main en window.AUTH)
const can = (p) => (window.AUTH?.perms || []).includes(p);

/* ---- helpers combos/detalle ---- */
async function categoriasSel(sel){
  const { items } = await api('categorias_listar.php');
  sel.innerHTML = items.map(c=>`<option value="${c.Id}">${c.Nombre}</option>`).join('');
}
async function proveedoresSel(sel){
  const { items } = await api('proveedores_listar.php');
  sel.innerHTML = `<option value="">— Ninguno —</option>` + items.map(p=>`<option value="${p.Id}">${p.Nombre}</option>`).join('');
}

/* ---- CREAR ---- */
async function openCrear(){
  if (!can('productos.crear')) { alert('No autorizado'); return; }

  await ensureCss('../estilos/productos-crear.css');
  const node = await loadPartialFromUrl('modal-producto-crear','../modulos/partials/productos-crear.html');
  const $msg = node.querySelector('#prdC_msg');

  try {
    await categoriasSel(node.querySelector('#prdC_categoria'));
    await proveedoresSel(node.querySelector('#prdC_proveedor'));
  } catch (e) {
    setMsg($msg, e.message || 'Error cargando catálogos');
  }

  node.querySelector('#prdC_cancel').onclick = ()=> node.remove();
  node.querySelector('#prdC_guardar').onclick = async ()=>{
    setMsg($msg,'');
    const payload = {
      sku: node.querySelector('#prdC_sku').value.trim(),
      nombre: node.querySelector('#prdC_nombre').value.trim(),
      precio: Number(node.querySelector('#prdC_precio').value),
      categoriaId: Number(node.querySelector('#prdC_categoria').value),
      proveedorId: node.querySelector('#prdC_proveedor').value ? Number(node.querySelector('#prdC_proveedor').value) : null
    };
    try{
      await api('productos_crear.php',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      setMsg($msg,'Producto creado',true);
      setTimeout(()=> node.remove(), 600);
      const v=$('#view'); if(v){ const m=await import('./productos.js'); await m.render(v); }
    }catch(e){ setMsg($msg,e.message); }
  };
}

/* ---- EDITAR ---- */
async function openEditar(id){
  if (!can('productos.editar')) { alert('No autorizado'); return; }

  await ensureCss('../estilos/productos-editar.css');
  const node = await loadPartialFromUrl('modal-producto-editar','../modulos/partials/productos-editar.html');
  const $msg = node.querySelector('#prdE_msg');

  try {
    await categoriasSel(node.querySelector('#prdE_categoria'));
    await proveedoresSel(node.querySelector('#prdE_proveedor'));
  } catch (e) {
    setMsg($msg, e.message || 'Error cargando catálogos');
  }

  try{
    const { item } = await api(`productos_detalle.php?id=${id}`);
    node.querySelector('#prdE_id').value = item.Id;
    node.querySelector('#prdE_sku').value = item.SKU || '';
    node.querySelector('#prdE_nombre').value = item.Nombre || '';
    node.querySelector('#prdE_precio').value = item.Precio ?? '';
    node.querySelector('#prdE_categoria').value = item.CategoriaId;
    node.querySelector('#prdE_proveedor').value = item.ProveedorId ?? '';
    node.querySelector('#prdE_estado').value = String(item.Estado?1:0);
  }catch(e){
    setMsg($msg, e.message || 'No se pudo cargar el producto');
  }

  node.querySelector('#prdE_cancel').onclick = ()=> node.remove();
  node.querySelector('#prdE_guardar').onclick = async ()=>{
    setMsg($msg,'');
    const payload = {
      id: Number(node.querySelector('#prdE_id').value),
      sku: node.querySelector('#prdE_sku').value.trim(),
      nombre: node.querySelector('#prdE_nombre').value.trim(),
      precio: Number(node.querySelector('#prdE_precio').value),
      categoriaId: Number(node.querySelector('#prdE_categoria').value),
      proveedorId: node.querySelector('#prdE_proveedor').value ? Number(node.querySelector('#prdE_proveedor').value) : null,
      estado: Number(node.querySelector('#prdE_estado').value)
    };
    try{
      await api('productos_actualizar.php',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      setMsg($msg,'Producto actualizado',true);
      setTimeout(()=> node.remove(), 600);
      const v=$('#view'); if(v){ const m=await import('./productos.js'); await m.render(v); }
    }catch(e){ setMsg($msg,e.message); }
  };
}

/* ---- ELIMINAR (desactivar) ---- */
async function openEliminar(id){
  if (!can('productos.eliminar')) { alert('No autorizado'); return; }

  await ensureCss('../estilos/productos-eliminar.css');
  const node = await loadPartialFromUrl('modal-producto-eliminar','../modulos/partials/productos-eliminar.html');
  const $msg = node.querySelector('#prdD_msg');

  node.querySelector('#prdD_id').textContent = id;
  try{
    const { item } = await api(`productos_detalle.php?id=${id}`);
    node.querySelector('#prdD_sku').textContent      = item.SKU || '-';
    node.querySelector('#prdD_nombre').textContent   = item.Nombre || '-';
    node.querySelector('#prdD_categoria').textContent= item.CategoriaNombre || '-';
    node.querySelector('#prdD_proveedor').textContent= item.ProveedorNombre || '-';
  }catch(e){
    setMsg($msg, e.message || 'No se pudo cargar el producto');
  }

  node.querySelector('#prdD_cancel').onclick = ()=> node.remove();
  node.querySelector('#prdD_confirm').onclick = async ()=>{
    setMsg($msg,'');
    try{
      // Usa GET si tu endpoint espera ?id=..., o ajusta a POST JSON si lo cambiaste
      await api(`productos_eliminar.php?id=${id}`);
      setMsg($msg,'Producto desactivado',true);
      setTimeout(()=> node.remove(), 600);
      const v=$('#view'); if(v){ const m=await import('./productos.js'); await m.render(v); }
    }catch(e){ setMsg($msg,e.message); }
  };
}

/* ---- LISTA + listeners con AbortController ---- */
export async function render(container){
  // permiso de vista
  if (!can('productos.ver')) {
    container.innerHTML = `<p style="color:#ff6b6b">No autorizado</p>`;
    return () => {};
  }

  const canCreate = can('productos.crear');
  const canEdit   = can('productos.editar');
  const canDel    = can('productos.eliminar');

  const { items } = await api('productos_listar.php');
  const headers = ['ID','SKU','Nombre','Precio','Estado','Categoría','Proveedor','Acciones'];
  const rows = items.map(x=>{
    const acciones = `
      <div class="btn-row">
        ${canEdit ? `<button class="btn btn-editar" data-id="${x.Id}">Editar</button>` : ''}
        ${canDel  ? `<button class="btn btn-eliminar" data-id="${x.Id}" ${x.Estado?'':'disabled'}>Desactivar</button>` : ''}
      </div>`;
    return [
      x.Id, x.SKU, x.Nombre, Number(x.Precio).toFixed(2),
      x.Estado ? 'Activo' : 'Inactivo',
      x.Categoria, x.Proveedor ?? '-',
      acciones
    ];
  });

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h3 style="margin:0;">Productos</h3>
      ${canCreate ? '<button id="btnNuevoProducto" class="btn primary">+ Nuevo producto</button>' : ''}
    </div>
    ${table(headers, rows)}
  `;

  const ctrl = new AbortController();
  container.addEventListener('click', async (e)=>{
    if (e.target.closest('#btnNuevoProducto')) { await openCrear(); return; }
    const ed  = e.target.closest('.btn-editar');    if (ed)  { await openEditar(Number(ed.dataset.id)); return; }
    const del = e.target.closest('.btn-eliminar');  if (del) { await openEliminar(Number(del.dataset.id)); return; }
  }, { signal: ctrl.signal });

  // función de limpieza
  return () => ctrl.abort();
}
