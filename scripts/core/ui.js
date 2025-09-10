export const $  = s => document.querySelector(s);
export const $$ = s => [...document.querySelectorAll(s)];

export function table(headers, rows) {
  const thead = `<thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>`;
  return `<table class="table">${thead}${tbody}</table>`;
}

export function setMsg(el, text, ok = false) {
  el.textContent = text || '';
  el.style.color = ok ? '#7CFC98' : '#ff6b6b';
}

export async function loadPartial(id, html) {
  // Inserta (o reemplaza) un overlay/modal por id con el HTML que le pases
  const host = $('#overlays');
  let node = document.getElementById(id);
  if (!node) { node = document.createElement('div'); node.id = id; host.appendChild(node); }
  node.innerHTML = html;
  return node;
}

/* cargar parcial HTML desde archivo */
export async function loadPartialFromUrl(id, url) {
  const res = await fetch(url, { credentials: 'include' });
  const html = await res.text();
  return loadPartial(id, html);
}

/* cargar CSS bajo demanda (evita duplicados) */
export async function ensureCss(href) {
  const already = [...document.styleSheets].some(s => s.href && s.href.includes(href));
  if (already) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}