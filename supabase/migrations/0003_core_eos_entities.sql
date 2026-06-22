create table rocks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  owner_id uuid references team_members(id) on delete set null,
  quarter_key text,
  status text not null default 'on-track',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rocks_org_id_idx on rocks(org_id);

create trigger rocks_set_updated_at
  before update on rocks
  for each row execute function public.set_updated_at();

create table rock_milestones (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  rock_id uuid not null references rocks(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rock_milestones_rock_id_idx on rock_milestones(rock_id);

create trigger rock_milestones_set_updated_at
  before update on rock_milestones
  for each row execute function public.set_updated_at();

create table issues (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  text text not null,
  owner_id uuid references team_members(id) on delete set null,
  status text not null default 'open',
  priority integer,
  rock_id uuid references rocks(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index issues_org_id_idx on issues(org_id);
create index issues_rock_id_idx on issues(rock_id);

create trigger issues_set_updated_at
  before update on issues
  for each row execute function public.set_updated_at();

create table todos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  text text not null,
  owner_id uuid references team_members(id) on delete set null,
  due_date date,
  done boolean not null default false,
  source_issue_id uuid references issues(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index todos_org_id_idx on todos(org_id);
create index todos_source_issue_id_idx on todos(source_issue_id);

create trigger todos_set_updated_at
  before update on todos
  for each row execute function public.set_updated_at();

create table scorecard_metrics (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  owner_id uuid references team_members(id) on delete set null,
  goal numeric,
  unit text,
  op text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scorecard_metrics_org_id_idx on scorecard_metrics(org_id);

create trigger scorecard_metrics_set_updated_at
  before update on scorecard_metrics
  for each row execute function public.set_updated_at();

-- One row per metric per week, replacing the nested scData[weekKey][metricId]
-- localStorage shape so Realtime can diff individual data points.
create table scorecard_values (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  metric_id uuid not null references scorecard_metrics(id) on delete cascade,
  week_key date not null,
  value numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (metric_id, week_key)
);

create index scorecard_values_org_id_idx on scorecard_values(org_id);
create index scorecard_values_metric_week_idx on scorecard_values(metric_id, week_key);

create trigger scorecard_values_set_updated_at
  before update on scorecard_values
  for each row execute function public.set_updated_at();

create table headlines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  text text not null,
  type text not null check (type in ('customer', 'employee')),
  created_at timestamptz not null default now()
);

create index headlines_org_id_idx on headlines(org_id);

-- One row per org. V/TO content is naturally semi-structured free text
-- sections, mirrored here as jsonb rather than guessing at fixed columns.
create table vision (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references organizations(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger vision_set_updated_at
  before update on vision
  for each row execute function public.set_updated_at();

create table processes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  status text not null default 'draft',
  owner_id uuid references team_members(id) on delete set null,
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index processes_org_id_idx on processes(org_id);

create trigger processes_set_updated_at
  before update on processes
  for each row execute function public.set_updated_at();
