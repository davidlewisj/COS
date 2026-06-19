-- Extensions
create extension if not exists pgcrypto;

-- Tenant layer: every other table is scoped to an organization
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  invited_email text,
  status text not null default 'active' check (status in ('invited', 'active')),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index org_members_user_id_idx on org_members(user_id);
create index org_members_org_id_idx on org_members(org_id);

-- Helper functions used by RLS policies across every table
create or replace function public.user_org_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select org_id from public.org_members where user_id = auth.uid() and status = 'active';
$$;

create or replace function public.user_role_in_org(p_org_id uuid)
returns text
language sql
security definer
stable
as $$
  select role from public.org_members where org_id = p_org_id and user_id = auth.uid() and status = 'active';
$$;

-- Shared updated_at trigger function, reused by every table below that has updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
