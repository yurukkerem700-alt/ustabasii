// Veri katmanı: Supabase yapılandırılmışsa gerçek veritabanı, değilse localStorage demo modu.
import { CATEGORIES, DEMO_USTALAR, DEMO_REVIEWS, DEMO_GALLERY, DEMO_VIDEOS, DEMO_POSTS } from "./data.js";

const cfg = window.USTABASI_CONFIG || {};
export const isLive = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);

let _sb = null;
async function sb() {
  if (_sb) return _sb;
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm");
  _sb = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  return _sb;
}

// ---------- demo yardımcıları ----------
const ls = {
  get(k, d) { try { const v = localStorage.getItem("ub_" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("ub_" + k, JSON.stringify(v)); } catch { /* özel mod */ } }
};
const rid = () => "d" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const unwrap = ({ data, error }) => { if (error) throw new Error(trError(error)); return data; };

export function trError(e) {
  const m = (e && (e.message || e.error_description)) || String(e);
  if (/Invalid login credentials/i.test(m)) return "E-posta veya şifre hatalı.";
  if (/already registered|already been registered/i.test(m)) return "Bu e-posta ile zaten bir hesap var.";
  if (/Email not confirmed/i.test(m)) return "E-posta adresinizi doğrulamanız gerekiyor. Gelen kutunuzu kontrol edin.";
  if (/Password should be at least/i.test(m)) return "Şifre en az 8 karakter olmalıdır.";
  if (/rate limit|too many/i.test(m)) return "Çok fazla deneme yapıldı. Lütfen biraz bekleyin.";
  if (/row-level security|violates/i.test(m)) return "Bu işlem için yetkiniz yok veya bilgiler geçersiz.";
  if (/duplicate key/i.test(m)) return "Bu kayıt zaten mevcut.";
  if (/Failed to fetch|NetworkError/i.test(m)) return "Bağlantı hatası. İnternetinizi kontrol edip tekrar deneyin.";
  return m;
}

// ---------- AUTH ----------
export async function getUser() {
  if (!isLive) return ls.get("user", null);
  const c = await sb();
  const { data } = await c.auth.getSession();
  const u = data.session?.user;
  if (!u) return null;
  return { id: u.id, email: u.email, full_name: u.user_metadata?.full_name || u.email.split("@")[0] };
}
export async function signUp({ email, password, full_name }) {
  if (!isLive) {
    const users = ls.get("users", []);
    if (users.some(u => u.email === email)) throw new Error("Bu e-posta ile zaten bir hesap var.");
    const u = { id: rid(), email, full_name, role: "customer" };
    users.push(u); ls.set("users", users); ls.set("user", u);
    return { user: u, needsConfirm: false };
  }
  const c = await sb();
  const { data, error } = await c.auth.signUp({
    email, password,
    options: { data: { full_name }, emailRedirectTo: location.origin + "/profil" }
  });
  if (error) throw new Error(trError(error));
  return { user: data.user, needsConfirm: !data.session };
}
export async function signIn({ email, password }) {
  if (!isLive) {
    const u = ls.get("users", []).find(x => x.email === email);
    if (!u) throw new Error("E-posta veya şifre hatalı.");
    ls.set("user", u); return u;
  }
  const c = await sb();
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(trError(error));
  return data.user;
}
export async function signOut() {
  if (!isLive) { ls.set("user", null); return; }
  const c = await sb(); await c.auth.signOut();
}
export async function resetPassword(email) {
  if (!isLive) return;
  const c = await sb();
  const { error } = await c.auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/giris" });
  if (error) throw new Error(trError(error));
}
export async function getProfile() {
  const user = await getUser();
  if (!user) return null;
  if (!isLive) return { ...user, bio: ls.get("profile_" + user.id, {}).bio || "", city: ls.get("profile_" + user.id, {}).city || "", role: user.role || "customer" };
  const c = await sb();
  const p = unwrap(await c.from("profiles").select("*").eq("id", user.id).maybeSingle());
  return { email: user.email, ...(p || { id: user.id, full_name: user.full_name, role: "customer" }) };
}
export async function updateProfile({ full_name, bio, city }) {
  const user = await getUser();
  if (!user) throw new Error("Giriş yapmanız gerekiyor.");
  if (!isLive) { ls.set("profile_" + user.id, { bio, city }); const u = { ...user, full_name }; ls.set("user", u); return; }
  const c = await sb();
  unwrap(await c.from("profiles").update({ full_name, bio, city }).eq("id", user.id));
}

// ---------- KATEGORİ & USTA ----------
export async function getCategories() {
  if (!isLive) return CATEGORIES;
  const c = await sb();
  const d = unwrap(await c.from("categories").select("*").order("sort"));
  return d.length ? d : CATEGORIES;
}
export async function listUstalar({ category, city, q, limit = 60 } = {}) {
  if (!isLive) {
    const mine = ls.get("ustalar", []).filter(u => u.status === "approved");
    return [...DEMO_USTALAR, ...mine].filter(u =>
      (!category || u.category_id === category) &&
      (!city || u.city === city) &&
      (!q || (u.full_name + " " + u.title + " " + u.bio).toLocaleLowerCase("tr").includes(q.toLocaleLowerCase("tr")))
    ).slice(0, limit);
  }
  const c = await sb();
  let query = c.from("ustalar_public").select("*").order("rating_avg", { ascending: false }).limit(limit);
  if (category) query = query.eq("category_id", category);
  if (city) query = query.eq("city", city);
  if (q) query = query.or(`full_name.ilike.%${q.replace(/[%,()]/g, " ")}%,title.ilike.%${q.replace(/[%,()]/g, " ")}%`);
  return unwrap(await query);
}
export async function getUsta(id) {
  if (!isLive) return [...DEMO_USTALAR, ...ls.get("ustalar", [])].find(u => u.id === id) || null;
  const c = await sb();
  return unwrap(await c.from("ustalar_public").select("*").eq("id", id).maybeSingle());
}
export async function applyUsta(form) {
  const user = await getUser();
  if (!user) throw new Error("Usta başvurusu için önce giriş yapmalısınız.");
  if (!isLive) {
    const list = ls.get("ustalar", []);
    if (list.some(u => u.user_id === user.id)) throw new Error("Zaten bir usta başvurunuz var.");
    list.push({ id: rid(), user_id: user.id, status: "pending", verified: false, rating_avg: 0, rating_count: 0, created_at: new Date().toISOString(), ...form });
    ls.set("ustalar", list); return;
  }
  const c = await sb();
  const { phone, ...rest } = form;
  unwrap(await c.from("ustalar").insert({ user_id: user.id, ...rest }));
  if (phone) unwrap(await c.from("private_contacts").upsert({ user_id: user.id, phone }));
}
export async function myUstaApplication() {
  const user = await getUser();
  if (!user) return null;
  if (!isLive) return ls.get("ustalar", []).find(u => u.user_id === user.id) || null;
  const c = await sb();
  return unwrap(await c.from("ustalar").select("*").eq("user_id", user.id).maybeSingle());
}

// ---------- YORUM ----------
export async function listReviews(ustaId) {
  if (!isLive) return [...DEMO_REVIEWS, ...ls.get("reviews", [])].filter(r => r.usta_id === ustaId);
  const c = await sb();
  return unwrap(await c.from("reviews_public").select("*").eq("usta_id", ustaId).order("created_at", { ascending: false }).limit(50));
}
export async function addReview({ usta_id, rating, comment }) {
  const user = await getUser();
  if (!user) throw new Error("Yorum yapmak için giriş yapmalısınız.");
  if (!isLive) {
    const list = ls.get("reviews", []);
    list.push({ id: rid(), usta_id, rating, comment, author_name: user.full_name, created_at: new Date().toISOString() });
    ls.set("reviews", list); return;
  }
  const c = await sb();
  unwrap(await c.from("reviews").insert({ usta_id, user_id: user.id, rating, comment }));
}

// ---------- TEKLİF ----------
export async function createQuote(q) {
  const user = await getUser();
  if (!isLive) {
    const list = ls.get("quotes", []);
    list.unshift({ id: rid(), user_id: user?.id || null, status: "new", created_at: new Date().toISOString(), ...q });
    ls.set("quotes", list); return;
  }
  const c = await sb();
  unwrap(await c.from("quotes").insert({ ...q, user_id: user?.id || null }));
}
export async function myQuotes() {
  const user = await getUser();
  if (!user) return [];
  if (!isLive) return ls.get("quotes", []).filter(q => q.user_id === user.id);
  const c = await sb();
  return unwrap(await c.from("quotes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }));
}
export async function createContact(m) {
  if (!isLive) { const l = ls.get("messages", []); l.unshift({ id: rid(), created_at: new Date().toISOString(), ...m }); ls.set("messages", l); return; }
  const c = await sb();
  unwrap(await c.from("contact_messages").insert(m));
}

// ---------- GALERİ & TV ----------
export async function listGallery() {
  if (!isLive) return DEMO_GALLERY;
  const c = await sb();
  const d = unwrap(await c.from("gallery_items").select("*").eq("published", true).order("created_at", { ascending: false }));
  return d.map((g, i) => ({ ...g, h: 200 + ((i * 47) % 110) }));
}
export async function listVideos() {
  if (!isLive) return DEMO_VIDEOS;
  const c = await sb();
  return unwrap(await c.from("tv_videos").select("*").eq("published", true).order("created_at", { ascending: false }));
}

// ---------- USTAGRAM ----------
export async function listPosts() {
  if (!isLive) return [...ls.get("posts", []), ...DEMO_POSTS].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const c = await sb();
  const user = await getUser();
  const posts = unwrap(await c.from("posts_public").select("*").order("created_at", { ascending: false }).limit(50));
  if (user && posts.length) {
    const likes = unwrap(await c.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", posts.map(p => p.id)));
    const set = new Set(likes.map(l => l.post_id));
    posts.forEach(p => { p.liked = set.has(p.id); });
  }
  return posts;
}
export async function createPost(body) {
  const user = await getUser();
  if (!user) throw new Error("Paylaşım yapmak için giriş yapmalısınız.");
  if (!isLive) {
    const l = ls.get("posts", []);
    l.push({ id: rid(), user_id: user.id, author_name: user.full_name, author_role: "customer", body, like_count: 0, created_at: new Date().toISOString() });
    ls.set("posts", l); return;
  }
  const c = await sb();
  unwrap(await c.from("posts").insert({ user_id: user.id, body }));
}
export async function toggleLike(post) {
  const user = await getUser();
  if (!user) throw new Error("Beğenmek için giriş yapmalısınız.");
  if (!isLive) {
    const liked = ls.get("likes", []);
    const i = liked.indexOf(post.id);
    if (i >= 0) liked.splice(i, 1); else liked.push(post.id);
    ls.set("likes", liked); return;
  }
  const c = await sb();
  if (post.liked) unwrap(await c.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id));
  else unwrap(await c.from("post_likes").insert({ post_id: post.id, user_id: user.id }));
}
export const demoLiked = () => new Set(ls.get("likes", []));
export async function deletePost(id) {
  if (!isLive) { ls.set("posts", ls.get("posts", []).filter(p => p.id !== id)); return; }
  const c = await sb(); unwrap(await c.from("posts").delete().eq("id", id));
}

// ---------- ADMİN ----------
export async function adminOverview() {
  if (!isLive) return { ustalar: ls.get("ustalar", []), quotes: ls.get("quotes", []), messages: ls.get("messages", []) };
  const c = await sb();
  const [ustalar, quotes, messages] = await Promise.all([
    c.from("ustalar").select("*").order("created_at", { ascending: false }),
    c.from("quotes").select("*").order("created_at", { ascending: false }).limit(200),
    c.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200)
  ]);
  return { ustalar: unwrap(ustalar), quotes: unwrap(quotes), messages: unwrap(messages) };
}
export async function adminSetUsta(id, patch) {
  if (!isLive) { ls.set("ustalar", ls.get("ustalar", []).map(u => u.id === id ? { ...u, ...patch } : u)); return; }
  const c = await sb(); unwrap(await c.from("ustalar").update(patch).eq("id", id));
}
export async function adminSetQuote(id, status) {
  if (!isLive) { ls.set("quotes", ls.get("quotes", []).map(q => q.id === id ? { ...q, status } : q)); return; }
  const c = await sb(); unwrap(await c.from("quotes").update({ status }).eq("id", id));
}
