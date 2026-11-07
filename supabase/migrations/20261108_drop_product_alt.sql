alter table public.products
  drop column if exists category_label,
  drop column if exists alt;
