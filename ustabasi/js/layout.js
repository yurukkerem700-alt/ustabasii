import { getUser, getProfile, signOut, isLive } from "./api.js";

const cfg = window.USTABASI_CONFIG || {};

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const initials = (n) => (String(n || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("") || "?").toLocaleUpperCase("tr");
export const stars = (r) => { const n = Math.round(Number(r) || 0); return "★".repeat(n) + "☆".repeat(5 - n); };
export const fmtDate = (d) => { try { return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }); } catch { return ""; } };
export const money = (n) => n ? `${Number(n).toLocaleString("tr-TR")} ₺` : "—";
export const qs = (k) => new URLSearchParams(location.search).get(k);

export function toast(msg, type = "info") {
  let w = $(".toast-wrap");
  if (!w) { w = document.createElement("div"); w.className = "toast-wrap"; w.setAttribute("role", "status"); w.setAttribute("aria-live", "polite"); document.body.appendChild(w); }
  const t = document.createElement("div");
  t.className = "toast " + type; t.textContent = msg; w.appendChild(t);
  setTimeout(() => t.remove(), 4500);
}

export function alertBox(el, msg, type = "err") {
  el.innerHTML = msg ? `<div class="alert ${type}" role="alert">${esc(msg)}</div>` : "";
}

const NAV = [
  ["/", "Ana Sayfa", "index"],
  ["/ustalar", "Ustalar", "ustalar"],
  ["/nasil-calisir", "Nasıl Çalışır?", "nasil-calisir"],
  ["/galeri", "Galeri", "galeri"],
  ["/ustagram", "Ustagram", "ustagram"],
  ["/usta-tv", "Usta TV", "usta-tv"]
];

export async function renderLayout() {
  const page = document.body.dataset.page || "";
  const user = await getUser().catch(() => null);
  let isAdmin = false;
  if (user) { const p = await getProfile().catch(() => null); isAdmin = p?.role === "admin"; }

  const links = NAV.map(([h, t, k]) => `<a href="${h}"${k === page ? ' aria-current="page"' : ""}>${t}</a>`).join("");
  const cta = user
    ? `${isAdmin ? '<a class="btn btn-ghost btn-sm" href="/admin">Yönetim</a>' : ""}<a class="btn btn-ghost btn-sm" href="/profil">${esc(user.full_name.split(" ")[0])}</a><button class="btn btn-ghost btn-sm" id="logoutBtn" type="button">Çıkış</button><a class="btn btn-primary btn-sm" href="/teklif-al">Teklif Al</a>`
    : `<a class="btn btn-ghost btn-sm" href="/giris">Giriş Yap</a><a class="btn btn-primary btn-sm" href="/teklif-al">Teklif Al</a>`;

  const header = `
  ${isLive ? "" : '<div class="demo-bar">Demo modu: veriler yalnızca bu tarayıcıda saklanır. Canlı yayın için Supabase bağlantısı yapılandırılmalıdır.</div>'}
  <a class="skip" href="#main">İçeriğe geç</a>
  <header class="nav" id="nav"><div class="container nav-inner">
    <a class="brand" href="/" aria-label="USTABAŞI ana sayfa"><img src="/images/logo-mark.webp" alt="" width="44" height="28"><span>USTABAŞI<small>YÖRÜKHAN TECH</small></span></a>
    <button class="nav-toggle" id="navToggle" aria-label="Menüyü aç/kapat" aria-expanded="false" aria-controls="navPanel"><span></span></button>
    <div class="nav-panel" id="navPanel"><nav class="nav-links" aria-label="Ana menü">${links}</nav><div class="nav-cta">${cta}</div></div>
  </div></header>`;

  const footer = `
  <footer class="footer"><div class="container">
    <div class="footer-grid">
      <div><a class="brand" href="/"><img src="/images/logo-mark.webp" alt="" width="44" height="28"><span>USTABAŞI</span></a>
        <p class="about">Türkiye'nin yeni nesil usta platformu. Doğrulanmış ustalara dakikalar içinde ulaş, teklif al, güvenle çalış.</p></div>
      <div><h4>Platform</h4><ul><li><a href="/ustalar">Ustalar</a></li><li><a href="/nasil-calisir">Nasıl Çalışır?</a></li><li><a href="/teklif-al">Teklif Al</a></li><li><a href="/usta-ol">Usta Ol</a></li></ul></div>
      <div><h4>Topluluk</h4><ul><li><a href="/galeri">Galeri</a></li><li><a href="/ustagram">Ustagram</a></li><li><a href="/usta-tv">Usta TV</a></li></ul></div>
      <div><h4>Kurumsal</h4><ul><li><a href="/iletisim">İletişim</a></li><li><a href="/kvkk">KVKK & Gizlilik</a></li><li><a href="/kullanim-kosullari">Kullanım Koşulları</a></li>${cfg.contactEmail ? `<li><a href="mailto:${esc(cfg.contactEmail)}">${esc(cfg.contactEmail)}</a></li>` : ""}</ul></div>
    </div>
    <div class="copyright"><span>© ${new Date().getFullYear()} USTABAŞI · Tüm hakları saklıdır.</span><span>Bir <b>YÖRÜKHAN TECH</b> ürünüdür.</span></div>
  </div></footer>`;

  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", footer);
  const main = $("main"); if (main) main.id = "main";

  const nav = $("#nav"), tg = $("#navToggle");
  tg.addEventListener("click", () => { const o = nav.classList.toggle("open"); tg.setAttribute("aria-expanded", o); });
  $$("#navPanel a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));
  $("#logoutBtn")?.addEventListener("click", async () => { await signOut(); location.href = "/"; });
}
