-- Supabase Schema Migration (From Firebase)
-- Copy and paste this into the Supabase SQL Editor

-- 1. users table (Supabase handles auth in auth.users, but we need a public profile table)
create table public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  "displayName" text,
  "realName" text,
  nickname text,
  phone text,
  gender text,
  "photoURL" text,
  "isAdmin" boolean default false,
  "isBanned" boolean default false,
  "enrolledClasses" jsonb default '[]'::jsonb,
  "createdAt" timestamp with time zone default now()
);

-- Note: In Supabase, you usually want to create a trigger to automatically insert a user profile 
-- when someone signs up.

-- 2. categories table
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  "nameEn" text,
  "order" integer default 0,
  "createdAt" timestamp with time zone default now()
);

-- 3. posts (classes) table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  "titleEn" text,
  category text, 
  price text,
  "originalPrice" text,
  "imageUrl" text,
  image text,
  "naverUrl" text,
  "naver_product_id" text,
  visuals text,
  status text default 'public',
  "isSoldOut" boolean default false,
  "order" integer default 0,
  "createdAt" timestamp with time zone default now()
);

-- 4. chapters (video lectures representing posts' subcollections)
create table public.chapters (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  title text not null,
  "videoUrl" text not null,
  type text default 'video',
  "vimeoId" text,
  "bunnyGuid" text,
  duration text,
  "orderIndex" integer default 0,
  "createdAt" timestamp with time zone default now()
);

-- 5. notices table
create table public.notices (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  "titleEn" text,
  content text,
  "contentEn" text,
  url text,
  "imageUrl" text,
  "isBanner" boolean default false,
  "isActive" boolean default true,
  "order" integer default 0,
  "createdAt" timestamp with time zone default now()
);

-- 6. reviews table
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  phrase text,
  "phraseEn" text,
  "imageUrl" text not null,
  "order" integer default 0,
  "createdAt" timestamp with time zone default now()
);

-- 7. questions table
create table public.questions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  title text not null,
  content text not null,
  status text default 'pending',
  "createdAt" timestamp with time zone default now()
);

-- Optional: Enable Row Level Security (RLS) on the tables.
-- For a quick migration, you can initially allow public read access:
-- alter table public.posts enable row level security;
-- create policy "Allow public read access" on public.posts for select using ( true );

-- 8. magic_links table (For Naver Smart Store Automated Course Delivery)
create table public.magic_links (
  id uuid default gen_random_uuid() primary key,
  order_id text not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  expires_at timestamp with time zone not null,
  is_claimed boolean default false,
  claimed_by uuid references auth.users(id),
  buyer_contact text,
  "createdAt" timestamp with time zone default now(),
  unique(order_id, post_id)
);

