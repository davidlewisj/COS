-- The current in-progress meeting and past meeting history are both rows
-- here, distinguished by status/ended_at, instead of a current/history split.
create table meetings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null default 'Weekly Level 10',
  status text not null default 'draft' check (status in ('draft', 'live', 'ended')),
  date date not null default current_date,
  sections jsonb not null default '{}'::jsonb,
  tangents jsonb not null default '[]'::jsonb,
  timer_seconds integer not null default 0,
  rating integer check (rating between 1 and 10),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meetings_org_id_idx on meetings(org_id);
create index meetings_status_idx on meetings(org_id, status);

create trigger meetings_set_updated_at
  before update on meetings
  for each row execute function public.set_updated_at();

-- Presence: who is currently in a live meeting
create table meeting_attendees (
  meeting_id uuid not null references meetings(id) on delete cascade,
  team_member_id uuid not null references team_members(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (meeting_id, team_member_id)
);
