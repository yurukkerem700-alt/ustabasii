# USTABAŞI — Durum Tespiti ve Yol Haritası

> Not: Canlı site (ustabasii.com.tr) analiz ortamından erişilemedi (403). Bulgular repo kodundan çıkarıldı; canlı sitedeki Vercel/domain ayarları ayrıca doğrulanmalı.

## 1. Mevcut durum

Statik HTML/CSS/JS sitesi (`ustabasi/` klasörü). Backend, veritabanı, build sistemi yok. Yalnızca `index.html` gerçek bir tasarıma sahip; diğer sayfalar iskelet.

## 2. Tespit edilen sorunlar

### Kritik (site bozuk / çalışmıyor)
1. **`app.js` eksik fonksiyonlar:** `saveProfile()` ve `addPost()` HTML'de çağrılıyor ama tanımlı değil → Profil "Kaydet" ve Ustagram "Paylaş" butonları hiçbir şey yapmıyor. `#feed`, `#showName`, `#showBio` doldurulmuyor.
2. **README yanlış:** `npm install && npm run dev` yazıyor ama `package.json` yok. Vercel'in kök dizini (`ustabasi/`) ayarı repoda tanımlı değil (`vercel.json` yok) → kök dizin yanlışsa site 404 verir.
3. **Boş dosyalar:** `pages/galeri.html, profil.html, usta-tv.html, ustalar.html` (0 bayt) ve `images/ustalar` (dosya, klasör olması gerekirken 0 baytlık dosya). "Usta TV" ve "Ustalar" sayfaları hiç yok, menüde de yok.
4. **Ölü butonlar/linkler:** `index.html`'de "Usta Ol", "Giriş Yap", "Teklif Al", "Nasıl Çalışır?" `<a>` etiketlerinde `href` yok → tıklanmıyor.
5. **Tutarsız tasarım:** `index.html` `style.css` (açık tema, Poppins) kullanıyor; `galeri/profil/ustagram` `main.css+navbar.css+cards.css` (koyu tema, system-ui, farklı navbar) kullanıyor. Kullanıcı sayfalar arası geçişte farklı bir site görüyor. Alt sayfalarda footer yok; galeri sadece "Proje 1/2/3" metni.
6. **Mobil menü alt sayfalarda yok:** Alt sayfaların navbar'ı mobilde taşar; `toggleMenu` yalnızca index'te anlamlı. `responsive.css`, `hero.css`, `footer.css` hiçbir sayfada bağlı değil (ölü CSS); `style.css` zaten hepsini içeriyor → yinelenen/ölü kod.

### Yüksek
7. **Harici bağımlılıklar kırılgan:** Hero görseli imgur (`i.imgur.com/F8lKQ0F.png`) ve Unsplash'ten; yerel `images/hero-bg.jpg` ve `logo.png` (toplam ~2.3 MB, ikisi de PNG içeriği ama biri `.jpg` uzantılı) kullanılmıyor. İmgur kalkarsa hero boş kalır.
8. **Performans:** 2048x2048 / 1.6 MB logo ve 700 KB hero dosyaları sıkıştırılmamış; `<img>`'lerde `alt`, `width/height`, `loading="lazy"` yok; Google Fonts CSS `@import` ile render'ı bloklar.
9. **SEO / paylaşım:** `<title>` sadece "USTABAŞI"; `meta description`, Open Graph, favicon, `canonical`, `robots.txt`, `sitemap.xml` yok. Alt sayfalarda `lang`, `viewport` meta etiketi bile yok (mobilde bozuk görünür).
10. **Erişilebilirlik:** Hamburger `div` (klavye/ekran okuyucu erişilemez), görsellerde alt yok, buton yerine `a`, odak stilleri yok, renk kontrastı kontrol edilmemiş (gri #98a2b3 beyaz üstünde düşük).
11. **Sahte iletişim bilgisi:** `info@ustabasi.com`, `0850 000 00 00` — gerçek alan adı `ustabasii.com.tr` ile uyuşmuyor.
12. **Güvenlik:** Henüz kullanıcı girdisi sunucuya gitmiyor, ancak `addPost` yazılırken `innerHTML` kullanılırsa XSS riski doğar → `textContent` kullanılmalı. Vercel için güvenlik başlıkları (CSP, X-Content-Type-Options, Referrer-Policy) yok.

### Orta
13. README'de "arşiv sürümü" yazıyor; ürün durumu (aktif mi arşiv mi) belirsiz. Lisans notunda "oyun fikri" ifadesi projeyle ilgisiz görünüyor.
14. `.gitignore`, lisans dosyası, CI (lint/link kontrolü) yok.
15. İçerik tamamen yer tutucu: sadece 4 hizmet kategorisi, usta listesi/profili/yorum/puan yok.

## 3. Hedef mimari

- **Faz 0-2:** Statik site (HTML/CSS/vanilla JS), tek tasarım sistemi, Vercel'de.
- **Faz 3+:** Gerçek veri ve giriş için Supabase (Auth + Postgres + Storage) — statik site üzerinden istemci tarafı, RLS zorunlu. Alternatif: Next.js'e geçiş (SEO + dinamik usta sayfaları için daha uygun).

## 4. Yol haritası

### Faz 0 — Acil onarım (1 gün)
- [ ] `vercel.json` / Vercel Root Directory'yi `ustabasi` yap, canlı siteyi doğrula
- [ ] `app.js`: `saveProfile` (localStorage), `addPost`/feed render (textContent ile), hamburger toggle'ı tüm sayfalarda çalıştır
- [ ] Ölü butonlara `href` ver (`#teklif`, `giris.html`, `usta-ol.html`)
- [ ] Boş `pages/*` ve `images/ustalar` dosyasını temizle ya da doldur
- [ ] README'yi gerçek çalıştırma yoluna göre düzelt (statik: `npx serve ustabasi`)

### Faz 1 — Tutarlılık ve altyapı (2-3 gün)
- [ ] Tek CSS (design tokens + bileşenler), ölü CSS'leri sil; tek navbar+footer, tüm sayfalarda aynı
- [ ] Tüm sayfalara `lang`, `viewport`, `title`, `description`, favicon, OG etiketleri
- [ ] Görselleri WebP'ye çevir/boyutlandır (logo <50 KB, hero <200 KB), harici imgur/unsplash bağımlılığını kaldır, `alt` + `lazy`
- [ ] Fontu `<link rel=preconnect>` ile yükle (`@import` kaldır)
- [ ] `robots.txt`, `sitemap.xml`, 404 sayfası, güvenlik başlıkları (`vercel.json`)

### Faz 2 — İçerik ve sayfalar (1 hafta)
- [ ] Ana sayfa: "Nasıl çalışır" (3 adım), hizmet kategorileri genişlet (10+), güven unsurları, SSS, teklif formu
- [ ] `ustalar.html` (liste + filtre: kategori/şehir), `usta.html?id=` detay, `usta-tv.html`
- [ ] Galeri: gerçek proje görselleri, lightbox
- [ ] Gerçek iletişim bilgileri, KVKK/gizlilik, kullanım şartları sayfaları

### Faz 3 — Dinamik ürün (2-4 hafta)
- [ ] Supabase: `profiles`, `ustalar`, `hizmetler`, `teklifler`, `yorumlar`, `posts` tabloları + RLS
- [ ] Kayıt/giriş (e-posta + telefon OTP), "Usta Ol" başvuru akışı
- [ ] Teklif talebi → usta bildirimi (e-posta/WhatsApp), puan-yorum sistemi
- [ ] Ustagram: gerçek paylaşım, görsel yükleme (Storage), beğeni/yorum, moderasyon

### Faz 4 — Büyüme ve kalite (sürekli)
- [ ] Lighthouse hedefi: Perf/A11y/SEO/Best Practices ≥ 90
- [ ] Analytics (Vercel Analytics/Plausible), Search Console, Google Business
- [ ] Şehir+hizmet SEO sayfaları ("İstanbul elektrikçi" vb.)
- [ ] CI: HTML/link doğrulama, Lighthouse CI, Playwright duman testleri
- [ ] Ödeme/komisyon modeli ve usta doğrulama (kimlik/belge) süreci

## 5. Başarı ölçütleri
- Tüm sayfalarda tek tasarım, mobil ve masaüstünde hatasız
- Sıfır ölü link/buton; Lighthouse ≥ 90
- Teklif talebi uçtan uca çalışıyor
- İlk 50 doğrulanmış usta, ilk 100 teklif talebi

## 6. Önerilen sıra
Faz 0 → Faz 1 hemen yapılabilir (kod değişikliği, risksiz). Faz 3 için Supabase projesi ve alan adı/Vercel erişimi gerekir.
