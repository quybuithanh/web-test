-- Run this in the Supabase SQL Editor for the web-test project.
-- Replace the email below with the email used for the store owner's Supabase Auth account.

create table if not exists public.products (
  id text primary key,
  name text not null,
  price integer not null default 0,
  category text not null,
  audience text not null default 'NAM' check (audience in ('NỮ', 'NAM')),
  sold boolean not null default false,
  image text not null,
  color text not null default '',
  size text not null default '',
  condition text not null default '',
  badge text,
  description text not null default '',
  material text not null default '',
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists sold boolean not null default false;
alter table public.products drop column if exists category_label;
alter table public.products drop column if exists alt;

alter table public.products enable row level security;
grant select, insert, update, delete on public.products to anon, authenticated;

drop policy if exists "Anyone can read products" on public.products;
create policy "Anyone can read products"
on public.products for select to anon, authenticated using (true);

drop policy if exists "Store owner can manage products" on public.products;
create policy "Store owner can manage products"
on public.products for all to authenticated
using (lower((select auth.jwt() ->> 'email')) = 'quy.bt2006@gmail.com')
with check (lower((select auth.jwt() ->> 'email')) = 'quy.bt2006@gmail.com');

insert into public.products
  (id, name, price, category, audience, image, color, size, condition, badge, description, material, images)
values
  ('jacket-01', 'Utility Canvas Jacket', 890000, 'Áo khoác', 'NAM', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85', 'Olive', 'M / L', 'Like new · 9/10', 'Món mới', 'Áo khoác canvas dáng boxy với chi tiết túi hộp cổ điển. Một lớp layer linh hoạt cho mọi ngày.', 'Canvas cotton', '["https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85", "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85"]'::jsonb),
  ('tee-02', 'Vintage Graphic Tee', 420000, 'Áo thun', 'NAM', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85', 'Black', 'L', 'Excellent · 8.5/10', 'Vintage find', 'Áo graphic tee vintage cotton mềm, phom rộng tự nhiên và hình in mang dấu ấn thời gian.', 'Cotton 100%', '["https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85"]'::jsonb),
  ('denim-03', 'Relaxed Straight Denim', 760000, 'Quần', 'NAM', 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=85', 'Washed blue', '29 / 30 / 32', 'Like new · 9/10', null, 'Denim wash xanh cổ điển, ống straight thoải mái. Đẹp lên theo từng lần mặc.', 'Denim cotton', '["https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=85"]'::jsonb),
  ('shirt-04', 'Oxford Oversized Shirt', 590000, 'Áo sơ mi', 'NAM', 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=85', 'Blue stripe', 'M / L', 'Excellent · 8/10', null, 'Oxford shirt sọc nhỏ, mặc layer hay riêng đều hợp. Độ mềm vừa vặn sau nhiều lần giặt.', 'Oxford cotton', '["https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=85"]'::jsonb),
  ('sweat-05', 'Heavyweight Crewneck', 680000, 'Áo nỉ', 'NAM', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85', 'Heather grey', 'L / XL', 'Like new · 9/10', '1 of 1', 'Crewneck nỉ dày, phom relaxed dễ mặc. Món essential cho những ngày trời se lạnh.', 'Cotton fleece', '["https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85"]'::jsonb),
  ('bag-06', 'Everyday Crossbody', 520000, 'Phụ kiện', 'NAM', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', 'Black', 'One size', 'Excellent · 8.5/10', null, 'Túi nhỏ gọn, nhiều ngăn và đủ chỗ cho những món đồ cần mang theo mỗi ngày.', 'Nylon', '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85"]'::jsonb)
on conflict (id) do nothing;

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
