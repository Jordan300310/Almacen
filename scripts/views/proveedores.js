// scripts/views/proveedores.js
import { api } from '../core/api.js';
import { table, ensureCss, loadPartialFromUrl, setMsg, $ } from '../core/ui.js';

// helper de permisos (inyectados por main en window.AUTH)
const can = (p) => (window.AUTH?.perms || []).includes(p);

/* CREAR */
async function openCrear(){
  if (!can('proveedores.crear')) { alert('No autorizado'); return; }

  await ensureCss('../estilos/proveedores-crear.css');
  const node = await loadPartialFromUrl('modal-prov-crear','../modulos/partials/proveedores-crear.html');
  const $msg = node.querySelector('#provC_msg');

  node.querySelector('#provC_cancel').onclick = ()=> node.remove();
  node.querySelector('#provC_guardar').onclick = async ()=>{
    setMsg($msg,'');
    const payload = {
      nombre:   node.querySelector('#provC_nombre').value.trim(),
      telefono: node.querySelector('#provC_telefono').value.trim(),
      email:    node.querySelector('#provC_email').value.trim(),
      direccion:node.querySelector('#provC_direccion').value.trim()
    };
    try{
      await api('proveedores_crear.php',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      setMsg($msg,'Proveedor creado',true);
      setTimeout(()=> node.remove(), 600);
      const v=$('#view'); if(v){ const m=await import('./proveedores.js'); await m.render(v); }
    }catch(e){ setMsg($msg, e.message); }
  };
}

/* EDITAR */
async function openEditar(id){
  if (!can('proveedores.editar')) { alert('No autorizado'); return; }

  await ensureCss('../estilos/proveedores-editar.css');
  const node = await loadPartialFromUrl('modal-prov-editar','../modulos/partials/proveedores-editar.html');
  const $msg = node.querySelector('#provE_msg');

  try{
    const { item } = await api(`proveedores_detalle.php?id=${id}`);
    node.querySelector('#provE_id').value        = item.Id;
    node.querySelector('#provE_nombre').value    = item.Nombre || '';
    node.querySelector('#provE_telefono').value  = item.Telefono || '';
    node.querySelector('#provE_email').value     = item.Email || '';
    node.querySelector('#provE_direccion').value = item.Direccion || '';
    node.querySelector('#provE_estado').value    = String(item.Estado?1:0);
  }catch(e){
    setMsg($msg, e.message || 'No se pudo cargar el proveedor');
  }

  node.querySelector('#provE_cancel').onclick = ()=> node.remove();
  node.querySelector('#provE_guardar').onclick = async ()=>{
    setMsg($msg,'');
    const payload = {
      id:        Number(node.querySelector('#provE_id').value),
      nombre:    node.querySelector('#provE_nombre').value.trim(),
      telefono:  node.querySelector('#provE_telefono').value.trim(),
      email:     node.querySelector('#provE_email').value.trim(),
      direccion: node.querySelector('#provE_direccion').value.trim(),
      estado:    Number(node.querySelector('#provE_estado').value)
    };
    try{
      await api('proveedores_actualizar.php',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      setMsg($msg,'Proveedor actualizado',true);
      setTimeout(()=> node.remove(), 600);
      const v=$('#view'); if(v){ const m=await import('./proveedores.js'); await m.render(v); }
    }catch(e){ setMsg($msg, e.message); }
  };
}

/* ELIMINAR (desactivar) */
async function openEliminar(id){
  if (!can('proveedores.eliminar')) { alert('No autorizado'); return; }

  await ensureCss('../estilos/proveedores-eliminar.css');
  const node = await loadPartialFromUrl('modal-prov-eliminar','../modulos/partials/proveedores-eliminar.html');
  const $msg = node.querySelector('#provD_msg');

  node.querySelector('#provD_id').textContent = id;
  try{
    const { item } = await api(`proveedores_detalle.php?id=${id}`);
    node.querySelector('#provD_nombre').textContent    = item.Nombre || '-';
    node.querySelector('#provD_telefono').textContent  = item.Telefono || '-';
    node.querySelector('#provD_email').textContent     = item.Email || '-';
    node.querySelector('#provD_direccion').textContent = item.Direccion || '-';
  }catch(e){
    setMsg($msg, e.message || 'No se pudo cargar el proveedor');
  }

  node.querySelector('#provD_cancel').onclick = ()=> node.remove();
  node.querySelector('#provD_confirm').onclick = async ()=>{
    setMsg($msg,'');
    try{
      // Usa el mismo método que tu endpoint soporte (GET con ?id=... en tu caso actual)
      await api(`proveedores_eliminar.php?id=${id}`);
      setMsg($msg,'Proveedor desactivado',true);
      setTimeout(()=> node.remove(), 600);
      const v=$('#view'); if(v){ const m=await import('./proveedores.js'); await m.render(v); }
    }catch(e){ setMsg($msg, e.message); }
  };
}

/* LISTA + cleanup */
export async function render(container){
  // permiso de vista
  if (!can('proveedores.ver')) {
    container.innerHTML = `<p style="color:#ff6b6b">No autorizado</p>`;
    return () => {};
  }

  const canCreate = can('proveedores.crear');
  const canEdit   = can('proveedores.editar');
  const canDel    = can('proveedores.eliminar');

  const { items } = await api('proveedores_listar.php');
  const headers = ['ID','Nombre','Teléfono','Email','Dirección','Estado','Acciones'];
  const rows = items.map(x=>{
    const acciones = `
      <div class="btn-row">
        ${canEdit ? `<button class="btn btn-editar" data-id="${x.Id}">Editar</button>` : ''}
        ${canDel  ? `<button class="btn btn-eliminar" data-id="${x.Id}" ${x.Estado?'':'disabled'}>Desactivar</button>` : ''}
      </div>`;
    return [
      x.Id, x.Nombre, x.Telefono ?? '-', x.Email ?? '-', x.Direccion ?? '-',
      x.Estado ? 'Activo':'Inactivo',
      acciones
    ];
  });

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h3 style="margin:0;">Proveedores</h3>
      ${canCreate ? '<button id="btnNuevoProv" class="btn primary">+ Nuevo proveedor</button>' : ''}
    </div>
    ${table(headers, rows)}
  `;

  const ctrl = new AbortController();
  container.addEventListener('click', async (e)=>{
    if (e.target.closest('#btnNuevoProv')) { await openCrear(); return; }
    const ed  = e.target.closest('.btn-editar');    if (ed)  { await openEditar(Number(ed.dataset.id)); return; }
    const del = e.target.closest('.btn-eliminar');  if (del) { await openEliminar(Number(del.dataset.id)); return; }
  }, { signal: ctrl.signal });

  return () => ctrl.abort();
}

