import * as api from "./api.js";
import { icon, CITIES } from "./data.js";
import { esc, $, $$, initials, stars, fmtDate, money, qs, toast, alertBox } from "./layout.js";

const cfg = window.USTABASI_CONFIG || {};
const catName = (cats, id) => cats.find(c => c.id === id)?.name || id;
const phoneOk = (v) => /^(\+?90|0)?5\d{9}$/.test(String(v).replace(/[\s()-]/g, ""));
const citiesOpts = (sel = "", all = "") => (all ? `<option value="">${all}</option>` : '<option value="" disabled selected>Şehir seçin</option>') + CITIES.map(c => `<option${c === sel ? " selected" : ""}>${c}</option>`).join("");
const catOpts = (cats, sel = "", all = "") => (all ? `<option value="">${all}</option>` : '<option value="" disabled selected>Kategori seçin</option>') + cats.map(c => `<option value="${esc(c.id)}"${c.id === sel ? " selected" : ""}>${esc(c.name)}</option>`).join("");
const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s || "");

function ustaCard(u, cats) {
  return `<a class="card usta-card" href="/usta?id=${encodeURIComponent(u.id)}">
    <div class="usta-top"><div class="avatar">${esc(initials(u.full_name))}</div>
      <div><h3>${esc(u.full_name)}</h3><div class="muted" style="font-size:.88rem">${esc(u.title)}</div></div></div>
    <div class="usta-meta"><span class="pill">${esc(catName(cats, u.category_id))}</span><span class="pill">📍 ${esc(u.city)}${u.district ? ", " + esc(u.district) : ""}</span>${u.verified ? '<span class="pill ok">✓ Doğrulanmış</span>' : ""}</div>
    <p class="muted" style="font-size:.9rem">${esc((u.bio || "").slice(0, 110))}${(u.bio || "").length > 110 ? "…" : ""}</p>
    <div class="card-foot"><span><span class="stars">${stars(u.rating_avg)}</span> <b>${Number(u.rating_avg || 0).toFixed(1)}</b> <span class="muted">(${u.rating_count || 0})</span></span><span class="muted">${u.experience_years || 0} yıl</span></div></a>`;
}
const skeletons = (n = 3) => Array.from({ length: n }, () => '<div class="skeleton"></div>').join("");
const fail = (el, e) => { el.innerHTML = `<div class="empty">${esc(api.trError(e))}</div>`; };

/* ---------- ANA SAYFA ---------- */
async function index() {
  const catsEl = $("#categories"), featEl = $("#featured");
  const sel = $("#heroCat"), cityEl = $("#heroCity");
  try {
    const cats = await api.getCategories();
    catsEl.innerHTML = cats.map(c => `<a class="card" href="/ustalar?kategori=${encodeURIComponent(c.id)}"><div class="icon">${icon(c.icon)}</div><h3>${esc(c.name)}</h3><p>${esc(c.description)}</p></a>`).join("");
    sel.innerHTML = catOpts(cats, "", "Tüm kategoriler");
    cityEl.innerHTML = citiesOpts("", "Tüm şehirler");
    featEl.innerHTML = skeletons();
    const list = (await api.listUstalar({ limit: 6 }));
    featEl.innerHTML = list.length ? list.map(u => ustaCard(u, cats)).join("") : '<div class="empty" style="grid-column:1/-1">Ustalarımız çok yakında burada. <a class="grad-text" href="/usta-ol">Usta olarak başvurun →</a></div>';
  } catch (e) { fail(catsEl, e); }
  $("#heroSearch").addEventListener("submit", (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (sel.value) p.set("kategori", sel.value);
    if (cityEl.value) p.set("sehir", cityEl.value);
    location.href = "/ustalar" + (p.toString() ? "?" + p : "");
  });
}

/* ---------- USTALAR ---------- */
async function ustalar() {
  const grid = $("#ustaGrid"), chips = $("#chips"), cityEl = $("#fCity"), qEl = $("#fQ"), count = $("#count");
  const cats = await api.getCategories();
  let cat = qs("kategori") || "";
  cityEl.innerHTML = citiesOpts(qs("sehir") || "", "Tüm şehirler");
  qEl.value = qs("q") || "";
  const sortEl = $("#fSort"), verEl = $("#fVerified");
  if ([...sortEl.options].some(o => o.value === qs("sirala"))) sortEl.value = qs("sirala");
  verEl.checked = qs("dogrulanmis") === "1";
  // filtreler adres çubuğuna yazılır: sayfa yenilenince / paylaşılınca korunur
  const syncUrl = () => {
    const p = new URLSearchParams();
    if (cat) p.set("kategori", cat);
    if (cityEl.value) p.set("sehir", cityEl.value);
    if (qEl.value.trim()) p.set("q", qEl.value.trim());
    if (sortEl.value !== "rating") p.set("sirala", sortEl.value);
    if (verEl.checked) p.set("dogrulanmis", "1");
    history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
  };
  const drawChips = () => {
    chips.innerHTML = `<button class="chip${!cat ? " active" : ""}" data-c="">Tümü</button>` + cats.map(c => `<button class="chip${cat === c.id ? " active" : ""}" data-c="${esc(c.id)}">${esc(c.name)}</button>`).join("");
  };
  const load = async () => {
    grid.innerHTML = skeletons(6);
    try {
      syncUrl();
      const list = await api.listUstalar({ category: cat, city: cityEl.value, q: qEl.value.trim(), sort: sortEl.value, verified: verEl.checked });
      count.textContent = `${list.length} usta bulundu`;
      grid.innerHTML = list.length ? list.map(u => ustaCard(u, cats)).join("") : `<div class="empty" style="grid-column:1/-1">Bu kriterlere uygun usta bulunamadı.<br><a class="grad-text" href="/teklif-al${cat ? "?kategori=" + encodeURIComponent(cat) : ""}">Ücretsiz teklif talebi oluşturun →</a></div>`;
    } catch (e) { fail(grid, e); }
  };
  chips.addEventListener("click", (e) => { const b = e.target.closest("[data-c]"); if (!b) return; cat = b.dataset.c; drawChips(); load(); });
  cityEl.addEventListener("change", load);
  sortEl.addEventListener("change", load);
  verEl.addEventListener("change", load);
  let t; qEl.addEventListener("input", () => { clearTimeout(t); t = setTimeout(load, 300); });
  drawChips(); load();
}

/* ---------- USTA DETAY ---------- */
async function usta() {
  const root = $("#ustaRoot");
  const id = qs("id");
  if (!id) { root.innerHTML = '<div class="empty">Usta bulunamadı. <a class="grad-text" href="/ustalar">Tüm ustalar</a></div>'; return; }
  try {
    const [u, cats, reviews, user] = await Promise.all([api.getUsta(id), api.getCategories(), api.listReviews(id), api.getUser()]);
    if (!u) { root.innerHTML = '<div class="empty">Usta bulunamadı. <a class="grad-text" href="/ustalar">Tüm ustalar</a></div>'; return; }
    document.title = `${u.full_name} – ${u.title} | USTABAŞI`;
    document.getElementById("ldUsta")?.remove();
    const ld = document.createElement("script");
    ld.id = "ldUsta";
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "Person", name: u.full_name, jobTitle: u.title, address: { "@type": "PostalAddress", addressLocality: u.city, addressCountry: "TR" }, ...(u.rating_count ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(u.rating_avg).toFixed(1), reviewCount: u.rating_count } } : {}) }).replace(/</g, "\\u003c");
    document.head.appendChild(ld);
    const dist = [5, 4, 3, 2, 1].map(n => [n, reviews.filter(r => r.rating === n).length]);
    const bars = reviews.length ? `<div class="rating-bars" aria-label="Puan dağılımı">${dist.map(([n, c]) => `<div><span>${n} ★</span><i><b style="width:${Math.round(c / reviews.length * 100)}%"></b></i><span>${c}</span></div>`).join("")}</div>` : "";
    root.innerHTML = `
    <div class="two-col">
      <div>
        <div class="card"><div class="profile-head"><div class="avatar">${esc(initials(u.full_name))}</div>
          <div><h1 style="font-size:2rem">${esc(u.full_name)}</h1><div class="muted">${esc(u.title)}</div>
          <div class="usta-meta" style="margin-top:.6rem"><span class="pill">${esc(catName(cats, u.category_id))}</span><span class="pill">📍 ${esc(u.city)}${u.district ? ", " + esc(u.district) : ""}</span>${u.verified ? '<span class="pill ok">✓ Doğrulanmış usta</span>' : ""}${u.demo ? '<span class="pill warn">Örnek profil</span>' : ""}</div></div></div>
          <div class="stats"><div class="stat"><b>${Number(u.rating_avg || 0).toFixed(1)}</b><span>Puan</span></div><div class="stat"><b>${u.rating_count || 0}</b><span>Yorum</span></div><div class="stat"><b>${u.experience_years || 0}</b><span>Yıl tecrübe</span></div><div class="stat"><b>${money(u.hourly_rate)}</b><span>Saatlik başlangıç</span></div></div>
          <h2 style="font-size:1.2rem;margin-bottom:.5rem">Hakkında</h2><p class="muted">${esc(u.bio || "Henüz bilgi eklenmemiş.")}</p></div>
        <h2 style="font-size:1.4rem;margin:2rem 0 1rem">Yorumlar</h2>
        ${bars}<div id="reviews">${reviews.length ? reviews.map(r => `<div class="card" style="margin-bottom:1rem"><div class="stars">${stars(r.rating)}</div><p style="margin:.4rem 0;color:#dbe3f5">${esc(r.comment)}</p><small class="muted">${esc(r.author_name || "Müşteri")} · ${fmtDate(r.created_at)}</small></div>`).join("") : '<div class="empty">Henüz yorum yok.</div>'}</div>
        <form id="reviewForm" class="card" style="margin-top:1rem" novalidate><h3 style="margin-top:0">Yorum yaz</h3><div id="rvMsg"></div>
          <div class="field"><label for="rvRating">Puan</label><select id="rvRating"><option value="5">★★★★★ Mükemmel</option><option value="4">★★★★ İyi</option><option value="3">★★★ Orta</option><option value="2">★★ Zayıf</option><option value="1">★ Kötü</option></select></div>
          <div class="field"><label for="rvText">Yorumunuz</label><textarea id="rvText" maxlength="1000" placeholder="Deneyiminizi paylaşın…"></textarea></div>
          <button class="btn btn-primary" type="submit">${user ? "Yorumu gönder" : "Giriş yapıp yorum yaz"}</button></form>
      </div>
      <aside class="card" style="position:sticky;top:92px"><h3 style="margin-top:0">${esc(u.full_name.split(" ")[0])} ile çalış</h3><p>Ücretsiz teklif talebi oluştur, usta sana dönüş yapsın.</p>
        <a class="btn btn-primary btn-block" style="margin-top:1rem" href="/teklif-al?kategori=${encodeURIComponent(u.category_id)}${isUuid(u.id) ? "&usta=" + encodeURIComponent(u.id) : ""}">Teklif İste</a>
        <ul style="list-style:none;margin-top:1.2rem;color:var(--muted);font-size:.9rem;display:grid;gap:.5rem"><li>✓ Ücretsiz keşif/teklif</li><li>✓ Usta doğrulama süreci</li><li>✓ Şeffaf puan ve yorumlar</li></ul>
        <div class="share-row"><button class="btn btn-ghost btn-sm" id="shareBtn" type="button">Profili paylaş</button></div></aside>
    </div>`;
    $("#shareBtn").addEventListener("click", async () => {
      const data = { title: document.title, url: location.href };
      try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(data.url); toast("Bağlantı kopyalandı", "ok"); } }
      catch (err) { if (err?.name !== "AbortError") toast("Bağlantı kopyalanamadı", "err"); }
    });
    $("#reviewForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = $("#rvMsg");
      if (!user) { location.href = "/giris?next=" + encodeURIComponent(location.pathname + location.search); return; }
      const comment = $("#rvText").value.trim();
      if (comment.length < 5) return alertBox(msg, "Lütfen en az 5 karakterlik bir yorum yazın.");
      try { await api.addReview({ usta_id: u.id, rating: Number($("#rvRating").value), comment }); toast("Yorumunuz kaydedildi, teşekkürler!", "ok"); usta(); }
      catch (err) { alertBox(msg, api.trError(err)); }
    });
  } catch (e) { fail(root, e); }
}

/* ---------- TEKLİF AL ---------- */
async function teklif() {
  const form = $("#quoteForm"), msg = $("#msg");
  const [cats, user] = await Promise.all([api.getCategories(), api.getUser()]);
  $("#qCat").innerHTML = catOpts(cats, qs("kategori") || "");
  $("#qCity").innerHTML = citiesOpts();
  if (user) { $("#qName").value = user.full_name || ""; $("#qEmail").value = user.email || ""; }
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if ($("#website").value) return; // honeypot
    const v = (id) => $(id).value.trim();
    const data = { category_id: $("#qCat").value, city: $("#qCity").value, district: v("#qDistrict") || null, description: v("#qDesc"), budget: $("#qBudget").value || null, urgency: $("#qUrgency").value, full_name: v("#qName"), phone: v("#qPhone"), email: v("#qEmail") || null };
    if (isUuid(qs("usta"))) data.usta_id = qs("usta");
    if (!data.category_id || !data.city) return alertBox(msg, "Kategori ve şehir seçmelisiniz.");
    if (data.full_name.length < 2) return alertBox(msg, "Lütfen adınızı girin.");
    if (!phoneOk(data.phone)) return alertBox(msg, "Geçerli bir cep telefonu girin (örn. 05XX XXX XX XX).");
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) return alertBox(msg, "E-posta adresi geçersiz.");
    if (data.description.length < 15) return alertBox(msg, "İşi en az 15 karakterle anlatın; ustalar daha doğru teklif versin.");
    if (!$("#qKvkk").checked) return alertBox(msg, "Devam etmek için KVKK aydınlatma metnini onaylamalısınız.");
    const btn = form.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Gönderiliyor…";
    try {
      await api.createQuote(data);
      form.hidden = true;
      $("#success").hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { alertBox(msg, api.trError(err)); btn.disabled = false; btn.textContent = "Teklif Talebini Gönder"; }
  });
}

/* ---------- GALERİ ---------- */
async function galeri() {
  const grid = $("#masonry"), lb = $("#lightbox");
  try {
    const [items, cats] = await Promise.all([api.listGallery(), api.getCategories()]);
    const art = (g, h) => g.image_url ? `<img src="${esc(g.image_url)}" alt="${esc(g.title)}" loading="lazy" style="width:100%;height:${h}px;object-fit:cover">` : `<div class="art" style="height:${h}px;background:linear-gradient(135deg,${esc(g.c1 || "#19d3ff")},${esc(g.c2 || "#8b5cf6")})">${icon(g.icon || "image")}</div>`;
    grid.innerHTML = items.length ? items.map((g, i) => `<div class="tile" tabindex="0" role="button" data-i="${i}" aria-label="${esc(g.title)} detayını aç">${art(g, g.h || 240)}<div class="cap"><b>${esc(g.title)}</b><span>${esc(catName(cats, g.category_id))}</span></div></div>`).join("") : '<div class="empty">Galeri yakında.</div>';
    const open = (i) => { const g = items[i]; lb.querySelector(".inner").innerHTML = art(g, 360).replace('class="art"', 'class="art" style="height:360px"') + `<div class="body"><h3>${esc(g.title)}</h3><p class="muted">${esc(g.description || "")}</p><button class="btn btn-ghost btn-sm" id="lbClose" style="margin-top:1rem">Kapat</button></div>`; lb.classList.add("open"); $("#lbClose").focus(); };
    grid.addEventListener("click", (e) => { const t = e.target.closest(".tile"); if (t) open(+t.dataset.i); });
    grid.addEventListener("keydown", (e) => { if (e.key === "Enter") { const t = e.target.closest(".tile"); if (t) open(+t.dataset.i); } });
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.id === "lbClose") lb.classList.remove("open"); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") lb.classList.remove("open"); });
  } catch (e) { fail(grid, e); }
}

/* ---------- USTA TV ---------- */
async function ustaTv() {
  const grid = $("#tvGrid");
  try {
    const vids = await api.listVideos();
    grid.innerHTML = vids.length ? vids.map(v => `<div class="video">${v.youtube_id && /^[\w-]{6,20}$/.test(v.youtube_id) ? `<iframe src="https://www.youtube-nocookie.com/embed/${esc(v.youtube_id)}" title="${esc(v.title)}" loading="lazy" allowfullscreen></iframe>` : `<div class="thumb" style="background:linear-gradient(135deg,${esc(v.c1 || "#19d3ff")},${esc(v.c2 || "#8b5cf6")})">${icon("play")}</div>`}<div class="info"><h3>${esc(v.title)}</h3><p class="muted" style="font-size:.9rem">${esc(v.description || "")}</p>${v.youtube_id ? "" : '<span class="pill warn" style="margin-top:.6rem">Yakında</span>'}</div></div>`).join("") : '<div class="empty" style="grid-column:1/-1">Videolar yakında.</div>';
  } catch (e) { fail(grid, e); }
}

/* ---------- GİRİŞ ---------- */
async function giris() {
  const next = qs("next"); const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/profil";
  if (await api.getUser()) { location.replace(safeNext); return; }
  let mode = qs("mod") === "kayit" ? "signup" : "login";
  const msg = $("#msg"), tabs = $$("[data-tab]");
  const apply = () => {
    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === mode));
    $$(".signup-only").forEach(e => e.hidden = mode !== "signup");
    $("#submitBtn").textContent = mode === "signup" ? "Hesap Oluştur" : "Giriş Yap";
    $("#password").autocomplete = mode === "signup" ? "new-password" : "current-password";
    $("#forgot").hidden = mode === "signup"; alertBox(msg, "");
  };
  tabs.forEach(t => t.addEventListener("click", () => { mode = t.dataset.tab; apply(); }));
  $("#forgot").addEventListener("click", async (e) => {
    e.preventDefault(); const email = $("#email").value.trim();
    if (!email) return alertBox(msg, "Önce e-posta adresinizi yazın.");
    try { await api.resetPassword(email); alertBox(msg, "Şifre sıfırlama bağlantısı e-postanıza gönderildi.", "ok"); } catch (err) { alertBox(msg, api.trError(err)); }
  });
  $("#authForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#email").value.trim(), password = $("#password").value, full_name = $("#fullName").value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return alertBox(msg, "Geçerli bir e-posta girin.");
    if (password.length < 8) return alertBox(msg, "Şifre en az 8 karakter olmalıdır.");
    if (mode === "signup") {
      if (full_name.length < 2) return alertBox(msg, "Adınızı girin.");
      if (!$("#kvkk").checked) return alertBox(msg, "KVKK ve kullanım koşullarını onaylamalısınız.");
    }
    const btn = $("#submitBtn"); btn.disabled = true;
    try {
      if (mode === "signup") {
        const r = await api.signUp({ email, password, full_name });
        if (r.needsConfirm) { alertBox(msg, "Kaydınız alındı! E-postanıza gelen doğrulama bağlantısına tıklayarak hesabınızı etkinleştirin.", "ok"); btn.disabled = false; return; }
      } else await api.signIn({ email, password });
      location.href = safeNext;
    } catch (err) { alertBox(msg, api.trError(err)); btn.disabled = false; }
  });
  apply();
}

/* ---------- USTA OL ---------- */
async function ustaOl() {
  const wrap = $("#applyWrap"), msg = $("#msg");
  const [cats, user] = await Promise.all([api.getCategories(), api.getUser()]);
  if (!user) { wrap.innerHTML = `<div class="alert info">Usta başvurusu için önce hesap oluşturmalı veya giriş yapmalısınız.</div><div style="display:flex;gap:.6rem;flex-wrap:wrap"><a class="btn btn-primary" href="/giris?mod=kayit&next=/usta-ol">Hesap Oluştur</a><a class="btn btn-ghost" href="/giris?next=/usta-ol">Giriş Yap</a></div>`; return; }
  const existing = await api.myUstaApplication().catch(() => null);
  if (existing) { const st = { pending: ["warn", "İnceleniyor"], approved: ["ok", "Onaylandı"], rejected: ["bad", "Reddedildi"] }[existing.status] || ["warn", existing.status]; wrap.innerHTML = `<div class="alert info">Başvurunuz alındı. Durum: <span class="pill ${st[0]}">${st[1]}</span><br>Ekibimiz bilgilerinizi inceleyip sizinle iletişime geçecek.</div><a class="btn btn-ghost" href="/profil">Profilime git</a>`; return; }
  $("#aCat").innerHTML = catOpts(cats); $("#aCity").innerHTML = citiesOpts();
  $("#applyForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = (id) => $(id).value.trim();
    const d = { full_name: v("#aName"), title: v("#aTitle"), category_id: $("#aCat").value, city: $("#aCity").value, district: v("#aDistrict") || null, bio: v("#aBio"), experience_years: Number($("#aExp").value || 0), hourly_rate: Number($("#aRate").value || 0) || null, phone: v("#aPhone") };
    if (d.full_name.length < 2 || d.title.length < 3) return alertBox(msg, "Ad soyad ve unvan alanlarını doldurun.");
    if (!d.category_id || !d.city) return alertBox(msg, "Kategori ve şehir seçin.");
    if (!phoneOk(d.phone)) return alertBox(msg, "Geçerli bir cep telefonu girin.");
    if (d.bio.length < 30) return alertBox(msg, "Kendinizi en az 30 karakterle tanıtın.");
    if (d.experience_years < 0 || d.experience_years > 60) return alertBox(msg, "Tecrübe yılı geçersiz.");
    if (!$("#aKvkk").checked) return alertBox(msg, "KVKK metnini onaylamalısınız.");
    const btn = e.target.querySelector("button[type=submit]"); btn.disabled = true;
    try { await api.applyUsta(d); toast("Başvurunuz alındı!", "ok"); ustaOl(); } catch (err) { alertBox(msg, api.trError(err)); btn.disabled = false; }
  });
}

/* ---------- PROFİL ---------- */
async function profil() {
  const root = $("#profileRoot");
  const p = await api.getProfile();
  if (!p) { location.replace("/giris?next=/profil"); return; }
  const [quotes, app, cats] = await Promise.all([api.myQuotes().catch(() => []), api.myUstaApplication().catch(() => null), api.getCategories()]);
  const ST = { new: ["warn", "Beklemede"], assigned: ["ok", "Ustaya iletildi"], closed: ["bad", "Kapandı"] };
  root.innerHTML = `
  <div class="two-col">
    <div>
      <div class="card"><div class="profile-head"><div class="avatar">${esc(initials(p.full_name))}</div><div><h1 style="font-size:1.8rem">${esc(p.full_name)}</h1><div class="muted">${esc(p.email || "")}</div><div class="usta-meta" style="margin-top:.5rem"><span class="pill">${p.role === "admin" ? "Yönetici" : p.role === "usta" ? "Usta" : "Müşteri"}</span>${app ? `<span class="pill ${app.status === "approved" ? "ok" : "warn"}">Usta başvurusu: ${esc(app.status === "approved" ? "onaylı" : app.status === "rejected" ? "reddedildi" : "inceleniyor")}</span>` : ""}</div></div></div></div>
      <h2 style="font-size:1.3rem;margin:2rem 0 1rem">Teklif Taleplerim</h2>
      ${quotes.length ? `<div class="table-wrap"><table><thead><tr><th>Tarih</th><th>Kategori</th><th>Şehir</th><th>Durum</th></tr></thead><tbody>${quotes.map(q => `<tr><td>${fmtDate(q.created_at)}</td><td>${esc(catName(cats, q.category_id))}</td><td>${esc(q.city)}</td><td><span class="pill ${(ST[q.status] || ST.new)[0]}">${(ST[q.status] || ST.new)[1]}</span></td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">Henüz teklif talebiniz yok. <a class="grad-text" href="/teklif-al">Hemen oluşturun →</a></div>'}
    </div>
    <form class="card" id="profForm" novalidate><h3 style="margin-top:0">Profil Bilgileri</h3><div id="msg"></div>
      <div class="field"><label for="pName">Ad Soyad</label><input id="pName" maxlength="80" value="${esc(p.full_name)}"></div>
      <div class="field"><label for="pCity">Şehir</label><select id="pCity">${citiesOpts(p.city || "", "Seçilmedi")}</select></div>
      <div class="field"><label for="pBio">Hakkımda</label><textarea id="pBio" maxlength="500">${esc(p.bio || "")}</textarea></div>
      <button class="btn btn-primary btn-block" type="submit">Kaydet</button>
      ${app ? "" : '<a class="btn btn-ghost btn-block" style="margin-top:.7rem" href="/usta-ol">Usta olarak başvur</a>'}</form>
  </div>`;
  $("#profForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#pName").value.trim();
    if (name.length < 2) return alertBox($("#msg"), "Ad soyad boş olamaz.");
    try { await api.updateProfile({ full_name: name, bio: $("#pBio").value.trim(), city: $("#pCity").value || null }); toast("Profil güncellendi", "ok"); } catch (err) { alertBox($("#msg"), api.trError(err)); }
  });
}

/* ---------- İLETİŞİM ---------- */
async function iletisim() {
  const form = $("#contactForm"), msg = $("#msg");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if ($("#website").value) return;
    const d = { name: $("#cName").value.trim(), email: $("#cEmail").value.trim(), subject: $("#cSubject").value.trim(), message: $("#cMsg").value.trim() };
    if (d.name.length < 2) return alertBox(msg, "Adınızı girin.");
    if (!/^\S+@\S+\.\S+$/.test(d.email)) return alertBox(msg, "Geçerli bir e-posta girin.");
    if (d.message.length < 10) return alertBox(msg, "Mesajınız çok kısa.");
    const btn = form.querySelector("button[type=submit]"); btn.disabled = true;
    try { await api.createContact(d); form.reset(); alertBox(msg, "Mesajınız bize ulaştı. En kısa sürede dönüş yapacağız.", "ok"); } catch (err) { alertBox(msg, api.trError(err)); }
    btn.disabled = false;
  });
}

/* ---------- YÖNETİM ---------- */
async function admin() {
  const root = $("#adminRoot");
  const p = await api.getProfile();
  if (!p) { location.replace("/giris?next=/admin"); return; }
  if (p.role !== "admin") { root.innerHTML = '<div class="empty">Bu sayfaya erişim yetkiniz yok.</div>'; return; }
  const cats = await api.getCategories();
  const draw = async () => {
    const { ustalar, quotes, messages } = await api.adminOverview();
    const UST = { pending: ["warn", "Beklemede"], approved: ["ok", "Onaylı"], rejected: ["bad", "Reddedildi"] };
    root.innerHTML = `
    <div class="stats"><div class="stat"><b>${ustalar.length}</b><span>Usta başvurusu</span></div><div class="stat"><b>${ustalar.filter(u => u.status === "pending").length}</b><span>Onay bekleyen</span></div><div class="stat"><b>${quotes.length}</b><span>Teklif talebi</span></div><div class="stat"><b>${messages.length}</b><span>İletişim mesajı</span></div></div>
    <h2 style="font-size:1.3rem;margin:1.5rem 0 .8rem">Usta Başvuruları</h2>
    <div class="table-wrap"><table><thead><tr><th>Usta</th><th>Kategori / Şehir</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>${ustalar.map(u => `<tr><td><b>${esc(u.full_name)}</b><br><small class="muted">${esc(u.title)}</small></td><td>${esc(catName(cats, u.category_id))}<br><small class="muted">${esc(u.city)}</small></td><td><span class="pill ${(UST[u.status] || UST.pending)[0]}">${(UST[u.status] || UST.pending)[1]}</span>${u.verified ? ' <span class="pill ok">✓</span>' : ""}</td><td style="white-space:nowrap"><button class="btn btn-ghost btn-sm" data-a="approve" data-id="${esc(u.id)}">Onayla</button> <button class="btn btn-ghost btn-sm" data-a="verify" data-id="${esc(u.id)}">${u.verified ? "Doğrulamayı kaldır" : "Doğrula"}</button> <button class="btn btn-danger btn-sm" data-a="reject" data-id="${esc(u.id)}">Reddet</button></td></tr>`).join("") || '<tr><td colspan="4" class="muted">Kayıt yok.</td></tr>'}</tbody></table></div>
    <h2 style="font-size:1.3rem;margin:2rem 0 .8rem">Teklif Talepleri</h2>
    <div class="table-wrap"><table><thead><tr><th>Tarih</th><th>Müşteri</th><th>İş</th><th>Durum</th></tr></thead><tbody>${quotes.map(q => `<tr><td>${fmtDate(q.created_at)}</td><td><b>${esc(q.full_name)}</b><br><small class="muted">${esc(q.phone)}${q.email ? "<br>" + esc(q.email) : ""}</small></td><td>${esc(catName(cats, q.category_id))} · ${esc(q.city)}<br><small class="muted">${esc(q.description)}</small></td><td><select data-q="${esc(q.id)}" style="width:auto;padding:.4rem .6rem">${["new", "assigned", "closed"].map(s => `<option value="${s}"${q.status === s ? " selected" : ""}>${{ new: "Yeni", assigned: "İletildi", closed: "Kapandı" }[s]}</option>`).join("")}</select></td></tr>`).join("") || '<tr><td colspan="4" class="muted">Kayıt yok.</td></tr>'}</tbody></table></div>
    <h2 style="font-size:1.3rem;margin:2rem 0 .8rem">İletişim Mesajları</h2>
    <div class="table-wrap"><table><thead><tr><th>Tarih</th><th>Gönderen</th><th>Mesaj</th></tr></thead><tbody>${messages.map(m => `<tr><td>${fmtDate(m.created_at)}</td><td><b>${esc(m.name)}</b><br><small class="muted">${esc(m.email)}</small></td><td><b>${esc(m.subject || "")}</b><br>${esc(m.message)}</td></tr>`).join("") || '<tr><td colspan="3" class="muted">Kayıt yok.</td></tr>'}</tbody></table></div>`;
  };
  root.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const { ustalar } = await api.adminOverview(); const u = ustalar.find(x => x.id === b.dataset.id);
    const patch = { approve: { status: "approved" }, reject: { status: "rejected", verified: false }, verify: { verified: !u?.verified } }[b.dataset.a];
    try { await api.adminSetUsta(b.dataset.id, patch); draw(); } catch (err) { toast(api.trError(err), "err"); }
  });
  root.addEventListener("change", async (e) => {
    const s = e.target.closest("[data-q]"); if (!s) return;
    try { await api.adminSetQuote(s.dataset.q, s.value); toast("Güncellendi", "ok"); } catch (err) { toast(api.trError(err), "err"); }
  });
  draw().catch((e) => fail(root, e));
}

export const PAGES = { index, ustalar, usta, "teklif-al": teklif, galeri, "usta-tv": ustaTv, giris, "usta-ol": ustaOl, profil, iletisim, admin };
