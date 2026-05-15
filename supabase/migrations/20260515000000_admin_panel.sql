-- ─────────────────────────────────────────────────────────────────────────────
-- Admin Panel migration
--
-- Adds:
--   • admin_emails table (email + bcrypt password hash)
--   • verify_admin_password() RPC  → returns boolean, used by admin-verify
--   • documents.description / storage_path / thumbnail_storage_path columns
--   • "documents" Storage bucket (public read, service_role write)
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

-- ── admin_emails ────────────────────────────────────────────────────────────
create table if not exists public.admin_emails (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  password_hash text not null,                 -- bcrypt hash (crypt(pw, gen_salt('bf')))
  created_at  timestamptz not null default now()
);

alter table public.admin_emails enable row level security;

-- No public policies — only service_role (which bypasses RLS) may touch this.

-- ── verify_admin_password RPC ────────────────────────────────────────────────
-- Returns true when (email, password) matches a row in admin_emails.
-- Marked SECURITY DEFINER so anon can call it without seeing the hash column.
create or replace function public.verify_admin_password(p_email text, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_hash text;
begin
  select password_hash into v_hash
    from public.admin_emails
    where lower(email) = lower(p_email)
    limit 1;

  if v_hash is null then
    return false;
  end if;

  return v_hash = crypt(p_password, v_hash);
end;
$$;

revoke all on function public.verify_admin_password(text, text) from public;
grant execute on function public.verify_admin_password(text, text) to anon, authenticated;

-- ── documents columns ───────────────────────────────────────────────────────
alter table public.documents
  add column if not exists description text,
  add column if not exists storage_path text,           -- raw object path of the file inside the documents bucket
  add column if not exists thumbnail_storage_path text; -- raw object path of the thumbnail inside the documents bucket

-- ── Storage bucket ──────────────────────────────────────────────────────────
-- Public read, service_role write. Anon cannot upload/update/delete.
insert into storage.buckets (id, name, public)
  values ('documents', 'documents', true)
  on conflict (id) do update set public = true;

-- Allow anyone to SELECT (read) objects from the documents bucket.
-- (Public bucket already allows public URLs; this policy makes API GETs work too.)
drop policy if exists "documents_public_read" on storage.objects;
create policy "documents_public_read"
  on storage.objects for select
  using (bucket_id = 'documents');

-- Block all write/update/delete for anon + authenticated.
-- service_role bypasses RLS, so Edge Functions (using SUPABASE_SERVICE_ROLE_KEY)
-- can still write — but the public anon key cannot.
drop policy if exists "documents_block_writes_anon" on storage.objects;
create policy "documents_block_writes_anon"
  on storage.objects for insert
  with check (false);

drop policy if exists "documents_block_updates_anon" on storage.objects;
create policy "documents_block_updates_anon"
  on storage.objects for update
  using (false);

drop policy if exists "documents_block_deletes_anon" on storage.objects;
create policy "documents_block_deletes_anon"
  on storage.objects for delete
  using (false);

-- ── How to add the first admin ──────────────────────────────────────────────
-- Run this once in the SQL Editor with your real password:
--
--   insert into public.admin_emails (email, password_hash)
--   values ('sunmin.jeong@playtag.ai', crypt('YOUR_STRONG_PASSWORD', gen_salt('bf', 12)));
--
-- To rotate a password:
--
--   update public.admin_emails
--   set password_hash = crypt('NEW_PASSWORD', gen_salt('bf', 12))
--   where email = 'sunmin.jeong@playtag.ai';
