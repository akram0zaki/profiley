-- 0021_storage.sql
-- Storage buckets and RLS policies. Run via supabase db push so the
-- statements are applied to the storage schema.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('user_uploads', 'user_uploads', false, 26214400, null),
  ('avatars',      'avatars',      true,   5242880, array['image/png','image/jpeg','image/webp','image/gif']),
  ('documents',    'documents',    false, 26214400, null)
on conflict (id) do nothing;

-- Owner-only policies on storage.objects for our buckets.
-- Object path convention: <user_id>/<filename>
do $$
declare
  b text;
  buckets text[] := array['user_uploads','avatars','documents'];
begin
  foreach b in array buckets loop
    execute format($f$drop policy if exists "owner_read_%1$s" on storage.objects$f$, b);
    execute format(
      $f$create policy "owner_read_%1$s" on storage.objects
         for select using (
           bucket_id = '%1$s'
           and auth.uid()::text = (storage.foldername(name))[1]
         )$f$, b);

    execute format($f$drop policy if exists "owner_write_%1$s" on storage.objects$f$, b);
    execute format(
      $f$create policy "owner_write_%1$s" on storage.objects
         for insert with check (
           bucket_id = '%1$s'
           and auth.uid()::text = (storage.foldername(name))[1]
         )$f$, b);

    execute format($f$drop policy if exists "owner_update_%1$s" on storage.objects$f$, b);
    execute format(
      $f$create policy "owner_update_%1$s" on storage.objects
         for update using (
           bucket_id = '%1$s'
           and auth.uid()::text = (storage.foldername(name))[1]
         ) with check (
           bucket_id = '%1$s'
           and auth.uid()::text = (storage.foldername(name))[1]
         )$f$, b);

    execute format($f$drop policy if exists "owner_delete_%1$s" on storage.objects$f$, b);
    execute format(
      $f$create policy "owner_delete_%1$s" on storage.objects
         for delete using (
           bucket_id = '%1$s'
           and auth.uid()::text = (storage.foldername(name))[1]
         )$f$, b);
  end loop;
end$$;
