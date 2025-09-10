// scripts/views/comprobantes.js  (o el nombre que usabas para esta vista)
import { api } from '../core/api.js';
import { table } from '../core/ui.js';

const money = (n) => Number(n || 0).toFixed(2);

/** Construye el HTML completo de la página a imprimir */
function buildSalidaHTML({ empresa, header, items }) {
  let total = 0;
  const rows = items.map((it, i) => {
    const pu  = Number(it.PrecioUnitario ?? 0);
    const sub = pu * Number(it.Cantidad);
    total += sub;
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${it.SKU || ''}</td>
        <td>${it.Producto || ''}</td>
        <td class="num">${it.Cantidad}</td>
        <td class="num">${money(pu)}</td>
        <td class="num">${money(sub)}</td>
      </tr>`;
  }).join('');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Comprobante ${header.Numero}</title>
  <link rel="stylesheet" href="../estilos/print.css">
</head>
<body>
  <header class="print-header">
    <div class="brand">
      <h2>${empresa?.nombre || ''}</h2>
      <div>RUC: ${empresa?.ruc || ''}</div>
      <div>${empresa?.direccion || ''}</div>
      <div>Tel: ${empresa?.telefono || ''} · ${empresa?.email || ''}</div>
    </div>
    <div class="docbox">
      <div class="doctype">COMPROBANTE DE SALIDA</div>
      <div>N° ${header.Numero}</div>
      <div>Fecha (UTC): ${header.FechaUtc}</div>
    </div>
  </header>

  <section class="print-two">
    <div>
      <strong>Cliente</strong><br/>
      <div>${header.ClienteNombre || '-'}</div>
      <div>Doc: ${header.ClienteDocumento || '-'}</div>
      <div>Dir: ${header.ClienteDireccion || '-'}</div>
    </div>
    <div>
      <strong>Observaciones</strong><br/>
      <div>${header.Observaciones || '-'}</div>
    </div>
  </section>

  <table class="print-table">
    <thead>
      <tr>
        <th>#</th>
        <th>SKU</th>
        <th>Producto</th>
        <th>Cant.</th>
        <th>P.U.</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="5" class="right"><strong>Total</strong></td>
        <td class="num"><strong>${money(total)}</strong></td>
      </tr>
    </tfoot>
  </table>

  <div class="print-footer">Gracias por su compra.</div>

  <script>
    window.onload = function(){ window.print(); };
  </script>
</body>
</html>`;
}

/** Abre la ventana de impresión con datos frescos */
async function imprimirSalida(id) {
  // Trae datos
  const [{ empresa }, { header, items }] = await Promise.all([
    api('empresa_get.php'),
    api(`salidas_detalle.php?id=${id}`)
  ]);

  // Construye HTML
  const html = buildSalidaHTML({ empresa, header, items });

  // Abre ventana “limpia”, inyecta y dispara print()
  const w = window.open('', 'PRINT', 'width=900,height=1100');
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  // el print se ejecuta en onload dentro del HTML
}

/** Vista principal: lista de salidas con botón Imprimir */
export async function render(container) {
  container.innerHTML = 'Cargando…';
  const { items } = await api('salidas_listar.php');

  const headers = ['ID', 'Número', 'Fecha (UTC)', 'Cliente', 'Ítems', 'Acciones'];
  const rows = items.map(x => [
    x.Id,
    x.Numero,
    x.FechaUtc,
    x.Cliente || '-',
    x.Items,
    `<button class="btn" data-print="${x.Id}">Imprimir</button>`
  ]);

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h3 style="margin:0;">Comprobantes de salida</h3>
    </div>
    ${table(headers, rows)}
  `;

  const ctrl = new AbortController();
  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-print]');
    if (!btn) return;
    try {
      await imprimirSalida(Number(btn.dataset.print));
    } catch (err) {
      alert(err.message || 'No se pudo imprimir');
    }
  }, { signal: ctrl.signal });

  return () => ctrl.abort();
}
