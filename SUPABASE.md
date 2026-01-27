# Supabase Setup Guide

This guide contains everything you need to set up Ziggy with a new Supabase project.

## Prerequisites

- A Supabase project (create one at [supabase.com](https://supabase.com))

## Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
MAX_FILE_SIZE=52428800
```

### Where to find these values:

1. **NEXT_PUBLIC_SUPABASE_URL**: Your Supabase project URL
   - Go to Project Settings > API > Project URL
   - Example: `https://xxxxx.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY**: Your anon/public key
   - Go to Project Settings > API > anon/public key
   - Starts with `eyJhbGc...`

3. **SUPABASE_SERVICE_ROLE_KEY**: Your service role key (keep secret!)
   - Go to Project Settings > API > service_role (secret) key
   - Required for admin operations that bypass RLS
   - **Never share this key or commit it to git**

4. **NEXT_PUBLIC_APP_URL**: Your app's URL
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

5. **MAX_FILE_SIZE**: Maximum upload size in bytes
   - `52428800` = 50MB
   - Must match `bodySizeLimit` in `next.config.ts`

---

## Database Setup

Run the following SQL queries in your Supabase SQL Editor (Project > SQL Editor > New Query).

### Migration 1: Profiles Table and First-User-Admin Trigger

```sql
-- Profiles table extending auth.users
create table public.profiles (
  id uuid references auth.users not null primary key,
  is_admin boolean default false not null,
  api_key text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles for select
  to authenticated using ((select auth.uid()) = id);

create policy "Users can update own profile" on public.profiles for update
  to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Users can insert own profile" on public.profiles for insert
  to authenticated with check ((select auth.uid()) = id);

-- Trigger: First user becomes admin
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, is_admin)
  values (new.id, (select count(*) = 0 from public.profiles));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute procedure public.handle_new_user();

create index profiles_api_key_idx on public.profiles(api_key);
```

### Migration 2: Images Table

```sql
create table public.images (
  id uuid default gen_random_uuid() not null primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  file_name text not null,
  file_type text not null,
  file_size bigint not null,
  storage_path text not null,
  user_id uuid references auth.users not null
);

alter table public.images enable row level security;

create policy "Users can view own images" on public.images for select
  to authenticated using ((select auth.uid()) = user_id);

create policy "Users can insert own images" on public.images for insert
  to authenticated with check ((select auth.uid()) = user_id);

create policy "Users can delete own images" on public.images for delete
  to authenticated using ((select auth.uid()) = user_id);

create index images_user_id_idx on public.images(user_id);
create index images_created_at_idx on public.images(created_at desc);
```

### Migration 3: Invites Table

```sql
create table public.invites (
  id uuid default gen_random_uuid() not null primary key,
  code text unique not null,
  is_used boolean default false not null,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  used_by uuid references auth.users,
  used_at timestamp with time zone,
  max_uses integer default 1 not null,
  uses_count integer default 0 not null
);

alter table public.invites enable row level security;

create policy "Anyone can view invites" on public.invites for select
  to authenticated, anon using (true);

create policy "Admins can create invites" on public.invites for insert
  to authenticated with check (
    exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.is_admin = true)
  );

create policy "Admins can update invites" on public.invites for update
  to authenticated using (
    exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.is_admin = true)
  );

create policy "Admins can delete invites" on public.invites for delete
  to authenticated using (
    exists (select 1 from public.profiles where profiles.id = (select auth.uid()) and profiles.is_admin = true)
  );

create index invites_code_idx on public.invites(code);
```

### Migration 4: Storage Bucket

```sql
-- Create uploads bucket
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Public can view uploaded images" on storage.objects for select
  to anon, authenticated using (bucket_id = 'uploads');

create policy "Authenticated users can upload" on storage.objects for insert
  to authenticated with check (bucket_id = 'uploads');

create policy "Users can delete own uploads" on storage.objects for delete
  to authenticated using (
    bucket_id = 'uploads' and
    (select auth.uid())::text = (storage.foldername(name))[1]
  );
```

---

## Storage Setup

After running Migration 4, verify your storage bucket:

1. Go to **Storage** in your Supabase dashboard
2. You should see an `uploads` bucket
3. Make sure it's marked as **Public** (bucket icon should be blue/globe icon)

---

## Authentication Settings

### Email Confirmation (Optional)

By default, Supabase may require email confirmation. You can:

**Option 1: Disable email confirmation** (for development/testing)
1. Go to **Authentication > Settings**
2. Find "Enable email confirmations"
3. Toggle it OFF

**Option 2: Keep email confirmation enabled**
- The app already handles this - users will see "Check your email!" message
- No changes needed

---

## Verify Setup

After running all migrations, verify everything is working:

### 1. Check Tables
```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

Expected results: `images`, `invites`, `profiles`

### 2. Check Storage Bucket
```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'uploads';
```

### 3. Check RLS Policies
```sql
-- Check profiles policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check images policies
SELECT * FROM pg_policies WHERE tablename = 'images';

-- Check invites policies
SELECT * FROM pg_policies WHERE tablename = 'invites';
```

---

## Running the App

1. Install dependencies:
```bash
npm install
```

Note: `@hackclub/icons` may require `--legacy-peer-deps` due to React 19:
```bash
npm install --legacy-peer-deps
```

2. Start development server:
```bash
npm run dev
```

3. Visit `http://localhost:3000`

---

## Initial Setup Steps

1. **First user signs up → becomes admin automatically**
   - Go to `/signup`
   - Create account (no invite code needed for first user)
   - You'll be redirected to dashboard

2. **Create invite codes**
   - Go to `/admin`
   - Generate invite codes (one-time or multi-use)

3. **Invite other users**
   - Share invite codes with people who need accounts
   - They'll enter the code during signup

---

## Troubleshooting

### "Body exceeded 1 MB limit"
- Ensure `MAX_FILE_SIZE=52428800` in `.env.local`
- Ensure `bodySizeLimit: '50mb'` in `next.config.ts`

### Images not uploading
- Check storage bucket exists and is public
- Verify RLS policies on storage.objects table
- Check SUPABASE_SERVICE_ROLE_KEY is correct

### Can't see other users in admin panel
- Verify SUPABASE_SERVICE_ROLE_KEY is set correctly
- The admin operations use service role to bypass RLS

### Invite codes not working
- Check RLS policies on invites table
- Verify you're logged in as admin
- Check max_uses and uses_count columns exist

### "Row Level Security" errors
- Run all 4 migrations above
- Verify RLS is enabled: `ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY`

### Storage policy errors
- Run Migration 4 again
- Check bucket is marked as public
- Verify user ID matches storage folder name

---

## Security Checklist

- [ ] Service role key is only in `.env.local` (never committed)
- [ ] `.env.local` is in `.gitignore`
- [ ] All tables have RLS enabled
- [ ] Storage bucket has proper policies
- [ ] API keys are hashed with bcrypt
- [ ] Admin checks performed on sensitive operations
- [ ] Invite codes validated on signup

---

## Migration to New Supabase Project

If you need to move to a new Supabase project:

1. **Create new Supabase project**
2. **Update environment variables** in `.env.local`
3. **Run all 4 migrations** in SQL Editor
4. **Verify storage bucket** is created and public
5. **Restart development server**: `npm run dev`

That's it! The app will work with the new project immediately.

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
