<p align="center"><img src=".github/cover.png" alt="USTABAŞI" width="100%"></p>

# USTABAŞI

Türkiye'nin yeni nesil usta platformu — **YÖRÜKHAN TECH** ürünü.
Müşteriler ücretsiz teklif ister, doğrulanmış ustalar profil açar; yorum, Ustagram akışı, galeri ve Usta TV içerir.

## Yapı

```
ustabasi/            Statik site (HTML + CSS + ES modules, build gerekmez)
  css/site.css       Tek tasarım sistemi
  js/config.js       Supabase URL / anon key (boşsa demo modu)
  js/api.js          Veri katmanı (Supabase veya localStorage demo)
  js/pages.js        Sayfa mantıkları
supabase/migrations  Veritabanı şeması + RLS politikaları
vercel.json          Yayın ayarı (kök) — ustabasi/vercel.json: başlıklar, cleanUrls
```

## Yerelde çalıştırma

```bash
npx serve ustabasi      # veya: python3 -m http.server -d ustabasi
```
Temiz URL'ler (`/ustalar`) için `npx serve` kullanın.

## Canlı veritabanı (Supabase)

1. Supabase'te proje oluşturun / geri yükleyin (ücretsiz planda en fazla 2 aktif proje).
2. `supabase/migrations/*.sql` dosyasını SQL Editor'da çalıştırın (veya `supabase db push`).
3. `ustabasi/js/config.js` içine **Project URL** ve **anon/publishable key** yazın (service_role anahtarı ASLA yazılmaz).
4. Authentication → URL Configuration: Site URL ve Redirect URL'lere alan adını ekleyin.
5. İlk yöneticiyi oluşturun: siteye kayıt olun, sonra SQL Editor'da
   `update public.profiles set role='admin' where id = (select id from auth.users where email='SIZIN_EPOSTA');`
6. `/admin` sayfasından usta başvurularını onaylayın.

Anahtarlar tarayıcıda görünür olacak şekilde tasarlanmıştır; güvenliği RLS sağlar.

## Yayın

Vercel, GitHub `main` dalından otomatik yayınlar. Alan adı: Vercel → Project → Settings → Domains → `ustabasii.com.tr`
ve `www`. DNS: kök için `A 76.76.21.21`, `www` için `CNAME cname.vercel-dns.com`.

## Lisans

© 2026 YÖRÜKHAN TECH — Tüm hakları saklıdır. Kod, tasarım ve görseller izinsiz kopyalanamaz, çoğaltılamaz veya ticari amaçla kullanılamaz.
