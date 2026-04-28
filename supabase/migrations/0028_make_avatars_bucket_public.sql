-- 0028_make_avatars_bucket_public.sql
-- Ensure the avatars bucket is public so image URLs are accessible

update storage.buckets
set public = true
where id = 'avatars';
