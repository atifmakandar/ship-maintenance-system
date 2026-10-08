-- DeckLog PMS production starter schema
-- Run this migration in Supabase SQL Editor after creating a project.

create extension if not exists pgcrypto;

create type public.vessel_status as enum ('on_passage', 'in_port', 'maintenance', 'laid_up');
create type public.member_role as enum ('master', 'chief_officer', 'chief_engineer', 'officer', 'engineer', 'superintendent', 'admin');
create type public.department_name as enum ('Deck', 'Engine', 'Safety', 'Electrical', 'Management');
create type public.equipment_status as enum ('Operational', 'Watch', 'Maintenance');
create type public.work_order_status as enum ('Scheduled', 'In progress', 'Overdue', 'Completed');
create type public.work_order_priority as enum ('Critical', 'High', 'Routine');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vessels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  imo_number text not null unique,
  status public.vessel_status not null default 'on_passage',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vessel_members (
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'officer',
  department public.department_name not null default 'Management',
  active boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (vessel_id, user_id)
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  name text not null,
  tag text not null,
  manufacturer text,
  model text,
  department public.department_name not null default 'Engine',
  health_score integer not null default 100 check (health_score between 0 and 100),
  runtime_hours numeric(12, 1),
  next_service_date date,
  status public.equipment_status not null default 'Operational',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vessel_id, tag)
);

create table public.maintenance_plans (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  title text not null,
  interval_label text not null,
  priority public.work_order_priority not null default 'Routine',
  default_assignee uuid references public.profiles(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  work_order_number bigint generated always as identity unique,
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  plan_id uuid references public.maintenance_plans(id) on delete set null,
  equipment_id uuid not null references public.equipment(id) on delete restrict,
  title text not null,
  department public.department_name not null default 'Engine',
  due_date date not null,
  interval_label text not null default 'As required',
  status public.work_order_status not null default 'Scheduled',
  priority public.work_order_priority not null default 'Routine',
  assigned_to uuid references public.profiles(id) on delete set null,
  completion integer not null default 0 check (completion between 0 and 100),
  last_serviced date,
  notes text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_order_events (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  from_status public.work_order_status,
  to_status public.work_order_status,
  note text,
  created_at timestamptz not null default now()
);

create index work_orders_vessel_due_idx on public.work_orders (vessel_id, due_date);
create index work_orders_vessel_status_idx on public.work_orders (vessel_id, status);
create index equipment_vessel_idx on public.equipment (vessel_id);
create index events_work_order_idx on public.work_order_events (work_order_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger vessels_set_updated_at before update on public.vessels
for each row execute function public.set_updated_at();
create trigger equipment_set_updated_at before update on public.equipment
for each row execute function public.set_updated_at();
create trigger maintenance_plans_set_updated_at before update on public.maintenance_plans
for each row execute function public.set_updated_at();
create trigger work_orders_set_updated_at before update on public.work_orders
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_vessel_member(target_vessel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.vessel_members
    where vessel_id = target_vessel_id
      and user_id = auth.uid()
      and active = true
  );
$$;

create or replace function public.is_vessel_admin(target_vessel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.vessel_members
    where vessel_id = target_vessel_id
      and user_id = auth.uid()
      and active = true
      and role in ('master', 'chief_officer', 'chief_engineer', 'superintendent', 'admin')
  );
$$;

alter table public.profiles enable row level security;
alter table public.vessels enable row level security;
alter table public.vessel_members enable row level security;
alter table public.equipment enable row level security;
alter table public.maintenance_plans enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_order_events enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Members can read their vessels"
  on public.vessels for select to authenticated
  using (public.is_vessel_member(id));

create policy "Admins can manage vessels"
  on public.vessels for all to authenticated
  using (public.is_vessel_admin(id))
  with check (public.is_vessel_admin(id));

create policy "Members can read vessel membership"
  on public.vessel_members for select to authenticated
  using (user_id = auth.uid() or public.is_vessel_member(vessel_id));

create policy "Admins can manage vessel membership"
  on public.vessel_members for all to authenticated
  using (public.is_vessel_admin(vessel_id))
  with check (public.is_vessel_admin(vessel_id));

create policy "Members can read equipment"
  on public.equipment for select to authenticated
  using (public.is_vessel_member(vessel_id));

create policy "Admins can manage equipment"
  on public.equipment for all to authenticated
  using (public.is_vessel_admin(vessel_id))
  with check (public.is_vessel_admin(vessel_id));

create policy "Members can read maintenance plans"
  on public.maintenance_plans for select to authenticated
  using (public.is_vessel_member(vessel_id));

create policy "Admins can manage maintenance plans"
  on public.maintenance_plans for all to authenticated
  using (public.is_vessel_admin(vessel_id))
  with check (public.is_vessel_admin(vessel_id));

create policy "Members can read work orders"
  on public.work_orders for select to authenticated
  using (public.is_vessel_member(vessel_id));

create policy "Members can create work orders"
  on public.work_orders for insert to authenticated
  with check (public.is_vessel_member(vessel_id) and created_by = auth.uid());

create policy "Members can update work orders"
  on public.work_orders for update to authenticated
  using (public.is_vessel_member(vessel_id))
  with check (public.is_vessel_member(vessel_id));

create policy "Admins can delete work orders"
  on public.work_orders for delete to authenticated
  using (public.is_vessel_admin(vessel_id));

create policy "Members can read work order events"
  on public.work_order_events for select to authenticated
  using (exists (
    select 1 from public.work_orders
    where work_orders.id = work_order_events.work_order_id
      and public.is_vessel_member(work_orders.vessel_id)
  ));

create policy "Members can create work order events"
  on public.work_order_events for insert to authenticated
  with check (actor_id = auth.uid() and exists (
    select 1 from public.work_orders
    where work_orders.id = work_order_events.work_order_id
      and public.is_vessel_member(work_orders.vessel_id)
  ));

-- Optional starter records. Run after creating your first user and replace the
-- email with the account that should own the demo vessel.
--
-- do $$
-- declare
--   demo_vessel_id uuid;
--   owner_id uuid;
--   engine_id uuid;
-- begin
--   select id into owner_id from auth.users where email = 'you@example.com';
--   insert into public.vessels (name, imo_number, status, timezone)
--   values ('MV Ardent Horizon', '9824512', 'on_passage', 'UTC')
--   returning id into demo_vessel_id;
--   insert into public.vessel_members (vessel_id, user_id, role, department)
--   values (demo_vessel_id, owner_id, 'chief_officer', 'Deck');
--   insert into public.equipment (vessel_id, name, tag, manufacturer, model, department, health_score, runtime_hours, next_service_date)
--   values (demo_vessel_id, 'Main engine', 'ME-001', 'Wärtsilä', '6L46F', 'Engine', 92, 18420, current_date + 3)
--   returning id into engine_id;
--   insert into public.work_orders (vessel_id, equipment_id, title, department, due_date, interval_label, status, priority, assigned_to, completion, notes, created_by)
--   values (demo_vessel_id, engine_id, 'Main engine lube oil analysis', 'Engine', current_date - 2, '500 running hours', 'Overdue', 'Critical', owner_id, 0, 'Send sample to the approved laboratory.', owner_id);
-- end $$;
