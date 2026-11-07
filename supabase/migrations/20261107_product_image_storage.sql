insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
on storage.objects for select to public using (bucket_id = 'product-images');

drop policy if exists "Store owner can upload product images" on storage.objects;
create policy "Store owner can upload product images"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and lower((select auth.jwt() ->> 'email')) = 'quy.bt2006@gmail.com');

drop policy if exists "Store owner can update product images" on storage.objects;
create policy "Store owner can update product images"
on storage.objects for update to authenticated
using (bucket_id = 'product-images' and lower((select auth.jwt() ->> 'email')) = 'quy.bt2006@gmail.com')
with check (bucket_id = 'product-images' and lower((select auth.jwt() ->> 'email')) = 'quy.bt2006@gmail.com');

drop policy if exists "Store owner can delete product images" on storage.objects;
create policy "Store owner can delete product images"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and lower((select auth.jwt() ->> 'email')) = 'quy.bt2006@gmail.com');
