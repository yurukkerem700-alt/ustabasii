-- USTABAŞI – başlangıç şeması (YÖRÜKHAN TECH)
-- Tüm tablolarda RLS açıktır. Kişisel veri (telefon) herkese açık tablolarda tutulmaz.

create extension if not exists pgcrypto;

-- ============ PROFİLLER ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 80),
  role text not null default 'customer' check (role in ('customer','usta','admin')),
  city text check (char_length(city) <= 60),
  bio text check (char_length(bio) <= 500),
  avatar_url text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), 80))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Kullanıcı kendi rolünü yükseltemez
create or replace function public.protect_profile_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end $$;
create trigger protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();

alter table public.profiles enable row level security;
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_admin_all" on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Telefon gibi özel iletişim verisi: yalnızca sahibi ve yönetici görür
create table public.private_contacts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone text check (phone ~ '^\+?[0-9 ()-]{10,18}$')
);
alter table public.private_contacts enable row level security;
create policy "contacts_own" on public.private_contacts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "contacts_admin" on public.private_contacts for select to authenticated
  using (public.is_admin());

-- ============ KATEGORİLER ============
create table public.categories (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null,
  icon text not null default 'wrench',
  description text not null default '',
  sort int not null default 100
);
alter table public.categories enable row level security;
create policy "categories_read" on public.categories for select using (true);
create policy "categories_admin" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============ USTALAR ============
create table public.ustalar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  title text not null check (char_length(title) between 3 and 80),
  category_id text not null references public.categories(id),
  city text not null check (char_length(city) between 2 and 60),
  district text check (char_length(district) <= 60),
  bio text check (char_length(bio) between 30 and 1000),
  experience_years int not null default 0 check (experience_years between 0 and 60),
  hourly_rate int check (hourly_rate between 0 and 100000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  verified boolean not null default false,
  rating_avg numeric(2,1) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now()
);
create index ustalar_cat_city_idx on public.ustalar (category_id, city) where status = 'approved';

-- Başvuran kullanıcı durum/doğrulama/puan alanlarını belirleyemez
create or replace function public.protect_usta_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    if tg_op = 'INSERT' then
      new.status := 'pending'; new.verified := false; new.rating_avg := 0; new.rating_count := 0;
    else
      new.status := old.status; new.verified := old.verified;
      new.rating_avg := old.rating_avg; new.rating_count := old.rating_count; new.user_id := old.user_id;
    end if;
  end if;
  return new;
end $$;
create trigger protect_usta before insert or update on public.ustalar
  for each row execute function public.protect_usta_fields();

alter table public.ustalar enable row level security;
create policy "ustalar_own_select" on public.ustalar for select to authenticated using ((select auth.uid()) = user_id);
create policy "ustalar_own_insert" on public.ustalar for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ustalar_own_update" on public.ustalar for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "ustalar_admin_all" on public.ustalar for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Herkese açık görünüm: yalnızca onaylı ustalar, kişisel alan yok
create view public.ustalar_public with (security_invoker = false) as
  select id, full_name, title, category_id, city, district, bio, experience_years, hourly_rate,
         verified, rating_avg, rating_count, created_at
  from public.ustalar where status = 'approved';
grant select on public.ustalar_public to anon, authenticated;

-- ============ YORUMLAR ============
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  usta_id uuid not null references public.ustalar(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 5 and 1000),
  created_at timestamptz not null default now(),
  unique (usta_id, user_id)
);
alter table public.reviews enable row level security;
create policy "reviews_insert_own" on public.reviews for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and not exists (select 1 from public.ustalar u where u.id = usta_id and u.user_id = (select auth.uid()))
    and exists (select 1 from public.ustalar u where u.id = usta_id and u.status = 'approved')
  );
create policy "reviews_delete_own" on public.reviews for delete to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());

create view public.reviews_public with (security_invoker = false) as
  select r.id, r.usta_id, r.rating, r.comment, r.created_at,
         coalesce(nullif(split_part(p.full_name,' ',1) || ' ' || left(split_part(p.full_name,' ',2),1) || '.', ' .'), 'Müşteri') as author_name
  from public.reviews r left join public.profiles p on p.id = r.user_id;
grant select on public.reviews_public to anon, authenticated;

create or replace function public.refresh_usta_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare uid uuid := coalesce(new.usta_id, old.usta_id);
begin
  update public.ustalar set
    rating_avg = coalesce((select round(avg(rating)::numeric,1) from public.reviews where usta_id = uid),0),
    rating_count = (select count(*) from public.reviews where usta_id = uid)
  where id = uid;
  return null;
end $$;
create trigger reviews_rating after insert or update or delete on public.reviews
  for each row execute function public.refresh_usta_rating();

-- ============ TEKLİF TALEPLERİ ============
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  usta_id uuid references public.ustalar(id) on delete set null,
  category_id text not null references public.categories(id),
  city text not null check (char_length(city) between 2 and 60),
  district text check (char_length(district) <= 60),
  description text not null check (char_length(description) between 15 and 2000),
  budget text check (char_length(budget) <= 40),
  urgency text not null default 'normal' check (urgency in ('urgent','normal','flexible')),
  full_name text not null check (char_length(full_name) between 2 and 80),
  phone text not null check (phone ~ '^\+?[0-9 ()-]{10,18}$'),
  email text check (email ~ '^\S+@\S+\.\S+$' and char_length(email) <= 120),
  status text not null default 'new' check (status in ('new','assigned','closed')),
  created_at timestamptz not null default now()
);
create index quotes_user_idx on public.quotes (user_id);
create index quotes_status_idx on public.quotes (status, created_at desc);
alter table public.quotes enable row level security;
-- Herkes (anonim dahil) talep oluşturabilir; kimlik alanı sahte olamaz, durum her zaman 'new'
create policy "quotes_insert" on public.quotes for insert to anon, authenticated
  with check (status = 'new' and (user_id is null or user_id = (select auth.uid())));
create policy "quotes_select_own" on public.quotes for select to authenticated using ((select auth.uid()) = user_id);
-- Onaylı usta, kendi kategorisindeki ve şehrindeki yeni talepleri görür
create policy "quotes_select_usta" on public.quotes for select to authenticated using (
  exists (select 1 from public.ustalar u where u.user_id = (select auth.uid()) and u.status = 'approved'
          and (u.id = quotes.usta_id or (u.category_id = quotes.category_id and u.city = quotes.city and quotes.status = 'new')))
);
create policy "quotes_admin_all" on public.quotes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============ İLETİŞİM ============
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (email ~ '^\S+@\S+\.\S+$' and char_length(email) <= 120),
  subject text check (char_length(subject) <= 120),
  message text not null check (char_length(message) between 10 and 3000),
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
create policy "contact_insert" on public.contact_messages for insert to anon, authenticated with check (true);
create policy "contact_admin_read" on public.contact_messages for select to authenticated using (public.is_admin());
create policy "contact_admin_delete" on public.contact_messages for delete to authenticated using (public.is_admin());

-- ============ USTAGRAM ============
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 3 and 1000),
  like_count int not null default 0,
  created_at timestamptz not null default now()
);
create index posts_created_idx on public.posts (created_at desc);
alter table public.posts enable row level security;
create policy "posts_insert_own" on public.posts for insert to authenticated
  with check ((select auth.uid()) = user_id and like_count = 0);
create policy "posts_delete_own" on public.posts for delete to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());

create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (post_id, user_id)
);
alter table public.post_likes enable row level security;
create policy "likes_select_own" on public.post_likes for select to authenticated using ((select auth.uid()) = user_id);
create policy "likes_insert_own" on public.post_likes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "likes_delete_own" on public.post_likes for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.refresh_like_count() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.post_id, old.post_id);
begin
  update public.posts set like_count = (select count(*) from public.post_likes where post_id = pid) where id = pid;
  return null;
end $$;
create trigger likes_count after insert or delete on public.post_likes
  for each row execute function public.refresh_like_count();

create view public.posts_public with (security_invoker = false) as
  select po.id, po.user_id, po.body, po.like_count, po.created_at,
         coalesce(nullif(p.full_name,''), 'Üye') as author_name, p.role as author_role
  from public.posts po left join public.profiles p on p.id = po.user_id;
grant select on public.posts_public to anon, authenticated;

-- ============ GALERİ & TV (yalnızca yönetici yazar) ============
create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  description text check (char_length(description) <= 500),
  category_id text references public.categories(id),
  image_url text,
  icon text default 'image', c1 text default '#19d3ff', c2 text default '#8b5cf6',
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.gallery_items enable row level security;
create policy "gallery_read" on public.gallery_items for select using (published or public.is_admin());
create policy "gallery_admin" on public.gallery_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create table public.tv_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 140),
  description text check (char_length(description) <= 500),
  youtube_id text check (youtube_id ~ '^[A-Za-z0-9_-]{6,20}$'),
  c1 text default '#19d3ff', c2 text default '#2f6bff',
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.tv_videos enable row level security;
create policy "tv_read" on public.tv_videos for select using (published or public.is_admin());
create policy "tv_admin" on public.tv_videos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============ TEMEL VERİ ============
insert into public.categories (id, name, icon, description, sort) values
 ('elektrik','Elektrik','bolt','Arıza, tesisat yenileme, aydınlatma ve pano montajı.',1),
 ('tesisat','Su Tesisatı','drop','Kaçak tespiti, tıkanıklık açma, batarya ve boru işleri.',2),
 ('klima-kombi','Klima & Kombi','snow','Periyodik bakım, montaj ve arıza giderme.',3),
 ('boya-badana','Boya & Badana','brush','İç/dış cephe boya, alçı ve dekoratif uygulamalar.',4),
 ('marangoz','Marangoz','hammer','Dolap, kapı, mutfak ve özel ahşap işleri.',5),
 ('cilingir','Çilingir','key','Kapı açma, kilit değişimi ve çelik kapı servisi.',6),
 ('temizlik','Temizlik','spark','Ev, ofis ve inşaat sonrası detaylı temizlik.',7),
 ('nakliyat','Nakliyat','truck','Evden eve ve ofis taşıma, asansörlü nakliyat.',8),
 ('cam-dograma','Cam & Doğrama','window','PVC, alüminyum doğrama ve cam balkon işleri.',9),
 ('tadilat','Tadilat & Montaj','wrench','Anahtar teslim tadilat, mobilya ve beyaz eşya montajı.',10)
on conflict (id) do nothing;
