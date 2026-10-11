-- Ustagram (topluluk akışı) kaldırıldı: ilgili tablo, görünüm ve fonksiyonlar silinir.
drop view if exists public.posts_public;
drop table if exists public.post_likes;
drop table if exists public.posts;
drop function if exists public.refresh_like_count();
