
const $ = (s) => document.querySelector(s);
const msg = (selector = "#msg", text = "", ok = false) => {
  const el = $(selector);
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? "#7CFC98" : "#ff6b6b";
};

async function apiRaw(url, opts = {}) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    const det = data?.extra?.detalle || data?.error || `HTTP ${res.status}`;
    throw new Error(det);
  }
  return data.data;
}

async function postJSON(path, body) {
  const res = await fetch(`../backend/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ ok: false, error: "JSON inválido" }));
  if (!res.ok || !data.ok) {
    const det = data?.extra?.detalle || data?.error || `HTTP ${res.status}`;
    throw new Error(det);
  }
  return data.data;
}

// Si ya está logueado, entra directo
(async () => {
  try {
    const res = await fetch("../backend/api/me.php", { credentials: "include" });
    if (res.ok) {
      const { data } = await res.json();
      if (data?.user) {
        const next = new URLSearchParams(location.search).get("next") || "./dashboard.html";
        location.replace(next);
        return;
      }
    }
  } catch {}
})();

// Primer uso: si no hay empleados, mostrar panel para crear admin
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const info = await apiRaw("../backend/api/primer_uso.php"); // { zero: bool, cargoAdminId?: number }
    if (info?.zero) {
      $("#frmLogin").style.display = "none";
      $("#firstRunPanel").style.display = "block";

      $("#fu_crear")?.addEventListener("click", async () => {
        msg("#fu_msg", "");
        const nombre   = $("#fu_nombre")?.value.trim();
        const username = $("#fu_usuario")?.value.trim();
        const password = $("#fu_password")?.value || "";

        if (!nombre || !username || !password) {
          msg("#fu_msg", "Completa nombre, usuario y contraseña");
          return;
        }

        try {
          await apiRaw("../backend/api/empleados_crear.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, username, password, cargoId: info.cargoAdminId, estado: 1 }),
          });

          await postJSON("login.php", { username, password });

          msg("#fu_msg", "Administrador creado. Redirigiendo…", true);
          setTimeout(() => (location.href = "./dashboard.html"), 500);
        } catch (e) {
          msg("#fu_msg", e.message || "No se pudo crear");
        }
      });

      ["#fu_nombre", "#fu_usuario", "#fu_password"].forEach((sel) => {
        $(sel)?.addEventListener("keyup", (e) => {
          if (e.key === "Enter") $("#fu_crear")?.click();
        });
      });

      return; // no seguimos con el login normal
    }
  } catch (e) {
    console.warn("primer_uso.php falló:", e.message);
  }
});

// Login normal
$("#frmLogin")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg("#msg", "");
  const btn = $("#btnLogin");
  if (btn) btn.disabled = true;

  const username = $("#username")?.value.trim();
  const password = $("#password")?.value ?? "";

  if (!username || !password) {
    msg("#msg", "Completa usuario y contraseña");
    if (btn) btn.disabled = false;
    return;
  }

  try {
    await postJSON("login.php", { username, password });
    msg("#msg", "Ingreso exitoso. Redirigiendo…", true);
    const next = new URLSearchParams(location.search).get("next") || "./dashboard.html";
    setTimeout(() => (location.href = next), 400);
  } catch (err) {
    msg("#msg", err.message || "Credenciales inválidas");
  } finally {
    if (btn) btn.disabled = false;
  }
});

// Enter envía el formulario
["#username", "#password"].forEach((sel) => {
  $(sel)?.addEventListener("keyup", (e) => {
    if (e.key === "Enter") $("#frmLogin")?.requestSubmit();
  });
});
