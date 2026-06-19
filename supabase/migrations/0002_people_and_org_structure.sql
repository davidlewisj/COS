-- People tracked in the EOS org chart. Not every team member is an app
-- user: linked_user_id is only set once an invited person accepts and signs in.
create table team_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  role text,
  color text,
  linked_user_id uuid references auth.users(id) on delete set null,
  invited_email text,
  -- profile fields, only populated for the team_member row that represents "yourself"
  bio text,
  avatar_url text,
  street text,
  city text,
  state text,
  zip text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index team_members_org_id_idx on team_members(org_id);
create index team_members_linked_user_id_idx on team_members(linked_user_id);

create trigger team_members_set_updated_at
  before update on team_members
  for each row execute function public.set_updated_at();

create table teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index teams_org_id_idx on teams(org_id);

create table team_memberships (
  team_id uuid not null references teams(id) on delete cascade,
  team_member_id uuid not null references team_members(id) on delete cascade,
  primary key (team_id, team_member_id)
);

-- Org chart seats
create table seats (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  responsibilities text,
  team_member_id uuid references team_members(id) on delete set null,
  parent_id uuid references seats(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index seats_org_id_idx on seats(org_id);
create index seats_parent_id_idx on seats(parent_id);

create trigger seats_set_updated_at
  before update on seats
  for each row execute function public.set_updated_at();

-- GWC / core-value scores from the People Analyzer, one row per team member
create table people_analyzer_scores (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  team_member_id uuid not null references team_members(id) on delete cascade,
  scores jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_member_id)
);

create index people_analyzer_scores_org_id_idx on people_analyzer_scores(org_id);

create trigger people_analyzer_scores_set_updated_at
  before update on people_analyzer_scores
  for each row execute function public.set_updated_at();
