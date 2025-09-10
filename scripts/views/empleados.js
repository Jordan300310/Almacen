// scripts/views/empleados.js
import { api } from '../core/api.js';
import { table, ensureCss, loadPartialFromUrl, setMsg, $ } from '../core/ui.js';

// helper de permisos (inyectados por main en window.AUTH)
const can = (p) => (window.AUTH?.perms || []).includes(p);

async function fillCargos(sel){
  const { items } = await api('cargos_listar.php');
  sel.innerHTML = items.map(c=>`<option value="${c.Id}">${c.Nombre}</option>`).join('');
}

/* CREAR */
async function openCrear(){
  if (!can('empleados.crear')) { alert('No autorizado'); return; }

  await ensureCss('../estilos/empleados-crear.css');
  const node = await loadPartialFromUrl('modal-emp-crear','../modulos/partials/empleados-crear.html');
  const $msg = node.querySelector('#empC_msg');

  try { await fillCargos(node.querySelector('#empC_cargo')); }
  catch(e){ setMsg($msg, e.message || 'Error cargando cargos'); }

  node.querySelector('#empC_cancel').onclick = ()=> node.remove();
  node.querySelector('#empC_guardar').onclick = async ()=>{
    setMsg($msg,'');
    const payload = {
      nombre:   node.querySelector('#empC_nombre').value.trim(),
      username: node.querySelector('#empC_username').value.trim(),
      password: node.querySelector('#empC_password').value, // opcional
      cargoId:  Number(node.querySelector('#empC_cargo').value),
      estado:   Number(node.querySelector('#empC_estado').value)
    };
    try{
      await api('empleados_crear.php',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      setMsg($msg,'Empleado creado',true);
      setTimeout(()=> node.remove(), 600);
      const v=$('#view'); if(v){ const m=await import('./empleados.js'); await m.render(v); }
    }catch(e){ setMsg($msg,e.message); }
  };
}

/* EDITAR */
async function openEditar(id){
  if (!can('empleados.editar')) { alert('No autorizado'); return; }

  await ensureCss('../estilos/empleados-editar.css');
  const node = await loadPartialFromUrl('modal-emp-editar','../modulos/partials/empleados-editar.html');
  const $msg = node.querySelector('#empE_msg');

  try { await fillCargos(node.querySelector('#empE_cargo')); }
  catch(e){ setMsg($msg, e.message || 'Error cargando cargos'); }

  try{
    const { item } = await api(`empleados_detalle.php?id=${id}`);
    node.querySelector('#empE_id').value       = item.Id;
    node.querySelector('#empE_nombre').value   = item.Nombre || '';
    node.querySelector('#empE_username').value = item.Username || '';
    node.querySelector('#empE_cargo').value    = item.CargoId || '';
    node.querySelector('#empE_estado').value   = String(item.Estado?1:0);
  }catch(e){
    setMsg($msg, e.message || 'No se pudo cargar el empleado');
  }

  node.querySelector('#empE_cancel').onclick = ()=> node.remove();
  node.querySelector('#empE_guardar').onclick = async ()=>{
    setMsg($msg,'');
    const payload = {
      id:       Number(node.querySelector('#empE_id').value),
      nombre:   node.querySelector('#empE_nombre').value.trim(),
      username: node.querySelector('#empE_username').value.trim(),
      cargoId:  Number(node.querySelector('#empE_cargo').value),
      estado:   Number(node.querySelector('#empE_estado').value),
      password: node.querySelector('#empE_password').value // si vacío, no cambia
    };
    try{
      await api('empleados_actualizar.php',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      setMsg($msg,'Empleado actualizado',true);
      setTimeout(()=> node.remove(), 600);
      const v=$('#view'); if(v){ const m=await import('./empleados.js'); await m.render(v); }
    }catch(e){ setMsg($msg,e.message); }
  };
}

/* ELIMINAR (desactivar por defecto) */
async function openEliminar(id){
  if (!can('empleados.eliminar')) { alert('No autorizado'); return; }

  await ensureCss('../estilos/empleados-eliminar.css');
  const node = await loadPartialFromUrl('modal-emp-eliminar','../modulos/partials/empleados-eliminar.html');
  const $msg = node.querySelector('#empD_msg');

  node.querySelector('#empD_id').textContent = id;
  try{
    const { item } = await api(`empleados_detalle.php?id=${id}`);
    node.querySelector('#empD_nombre').textContent   = item.Nombre || '-';
    node.querySelector('#empD_username').textContent = item.Username || '-';
    node.querySelector('#empD_cargo').textContent    = item.CargoNombre || '-';
  }catch(e){
    setMsg($msg, e.message || 'No se pudo cargar el empleado');
  }

  node.querySelector('#empD_cancel').onclick = ()=> node.remove();
  node.querySelector('#empD_confirm').onclick = async ()=>{
    setMsg($msg,'');
    try{
      // borrado lógico por defecto
      await api('empleados_eliminar.php', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id })
      });
      setMsg($msg,'Empleado desactivado',true);
      setTimeout(()=> node.remove(), 600);
      const v=$('#view'); if(v){ const m=await import('./empleados.js'); await m.render(v); }
    }catch(e){ setMsg($msg, e.message); }
  };
}

/* LISTA + cleanup */
export async function render(container){
  // permisos de acciones
  const canCreate = can('empleados.crear');
  const canEdit   = can('empleados.editar');
  const canDel    = can('empleados.eliminar');

  const { items } = await api('empleados_listar.php');

  const headers = ['ID','Nombre','Usuario','Cargo','Estado','Acciones'];
  const rows = items.map(x=>{
    const acciones = `
      <div class="btn-row">
        ${canEdit ? `<button class="btn btn-editar" data-id="${x.Id}">Editar</button>` : ''}
        ${canDel  ? `<button class="btn btn-eliminar" data-id="${x.Id}" ${x.Estado?'':'disabled'}>Desactivar</button>` : ''}
      </div>`;
    return [
      x.Id, x.Nombre, x.Username ?? '-', x.Cargo ?? '-', x.Estado ? 'Activo':'Inactivo',
      acciones
    ];
  });

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h3 style="margin:0;">Empleados</h3>
      ${canCreate ? '<button id="btnNuevoEmp" class="btn primary">+ Nuevo empleado</button>' : ''}
    </div>
    ${table(headers, rows)}
  `;

  const ctrl = new AbortController();
  container.addEventListener('click', async (e)=>{
    if (e.target.closest('#btnNuevoEmp')) { await openCrear(); return; }
    const ed  = e.target.closest('.btn-editar');    if (ed)  { await openEditar(Number(ed.dataset.id)); return; }
    const del = e.target.closest('.btn-eliminar');  if (del) { await openEliminar(Number(del.dataset.id)); return; }
  }, { signal: ctrl.signal });

  return () => ctrl.abort();
}
