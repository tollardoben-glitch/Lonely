-- Zusammen – Datenbankschema für Supabase
-- Im Supabase-Dashboard unter "SQL Editor" komplett ausführen.

create extension if not exists pgcrypto;

-- ───────────── Tabellen ─────────────

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  city text not null,
  bio text not null default '' check (char_length(bio) <= 300),
  interests text[] not null default '{}',
  avatar_emoji text not null default '🙂',
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 60),
  description text not null default '',
  city text not null,
  interest_id text not null,
  emoji text not null default '✨',
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 80),
  description text not null default '',
  city text not null,
  location text not null,
  starts_at timestamptz not null,
  capacity int not null check (capacity between 2 and 200),
  interest_id text not null,
  host_id uuid references public.profiles on delete set null,
  group_id uuid references public.groups on delete set null,
  created_at timestamptz not null default now()
);

create table public.event_attendees (
  event_id uuid not null references public.events on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  author_id uuid not null references public.profiles on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table public.dinner_tables (
  id uuid primary key default gen_random_uuid(),
  dinner_date date not null,
  city text not null,
  restaurant text not null default 'Wird noch bekannt gegeben',
  address text not null default '',
  time text not null default '19:30'
);

create table public.dinner_signups (
  user_id uuid not null references public.profiles on delete cascade,
  dinner_date date not null,
  city text not null,
  budget int not null check (budget between 1 and 3),
  diet text not null default '',
  table_id uuid references public.dinner_tables on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, dinner_date)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles on delete cascade,
  target_type text not null check (target_type in ('user', 'event', 'group', 'message')),
  target_id text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index on public.events (city, starts_at);
create index on public.groups (city);
create index on public.group_messages (group_id, created_at);
create index on public.dinner_signups (dinner_date, city) where table_id is null;

-- ───────────── Hilfsfunktionen & Trigger ─────────────

create function public.is_group_member(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = gid and user_id = auth.uid());
$$;

create function public.my_dinner_table_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select table_id from dinner_signups where user_id = auth.uid() and table_id is not null;
$$;

-- Wer eine Gruppe gründet, ist automatisch Mitglied.
create function public.add_group_creator() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    insert into group_members (group_id, user_id) values (new.id, new.created_by);
  end if;
  return new;
end $$;

create trigger groups_add_creator after insert on public.groups
for each row execute function public.add_group_creator();

-- Wer ein Treffen erstellt, nimmt automatisch teil.
create function public.add_event_host() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.host_id is not null then
    insert into event_attendees (event_id, user_id) values (new.id, new.host_id);
  end if;
  return new;
end $$;

create trigger events_add_host after insert on public.events
for each row execute function public.add_event_host();

-- Teilnehmerlimit durchsetzen.
create function public.check_event_capacity() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  cap int;
  taken int;
begin
  select capacity into cap from events where id = new.event_id for update;
  select count(*) into taken from event_attendees where event_id = new.event_id;
  if taken >= cap then
    raise exception 'Dieses Treffen ist leider schon voll.';
  end if;
  return new;
end $$;

create trigger event_attendees_capacity before insert on public.event_attendees
for each row execute function public.check_event_capacity();

-- ───────────── Row Level Security ─────────────

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.group_messages enable row level security;
alter table public.dinner_tables enable row level security;
alter table public.dinner_signups enable row level security;
alter table public.reports enable row level security;

create policy "Profile sind für angemeldete Nutzer sichtbar" on public.profiles
  for select to authenticated using (true);
create policy "Eigenes Profil anlegen" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "Eigenes Profil ändern" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "Gruppen sichtbar" on public.groups
  for select to authenticated using (true);
create policy "Gruppen gründen" on public.groups
  for insert to authenticated with check (created_by = auth.uid());
create policy "Eigene Gruppe ändern" on public.groups
  for update to authenticated using (created_by = auth.uid());

create policy "Mitglieder sichtbar" on public.group_members
  for select to authenticated using (true);
create policy "Gruppe beitreten" on public.group_members
  for insert to authenticated with check (user_id = auth.uid());
create policy "Gruppe verlassen" on public.group_members
  for delete to authenticated using (user_id = auth.uid());

create policy "Treffen sichtbar" on public.events
  for select to authenticated using (true);
create policy "Treffen erstellen" on public.events
  for insert to authenticated with check (
    host_id = auth.uid() and (group_id is null or public.is_group_member(group_id))
  );
create policy "Eigenes Treffen ändern" on public.events
  for update to authenticated using (host_id = auth.uid());
create policy "Eigenes Treffen löschen" on public.events
  for delete to authenticated using (host_id = auth.uid());

create policy "Teilnehmende sichtbar" on public.event_attendees
  for select to authenticated using (true);
create policy "Teilnehmen" on public.event_attendees
  for insert to authenticated with check (user_id = auth.uid());
create policy "Absagen" on public.event_attendees
  for delete to authenticated using (user_id = auth.uid());

create policy "Nachrichten nur für Mitglieder" on public.group_messages
  for select to authenticated using (public.is_group_member(group_id));
create policy "Nachrichten schreiben als Mitglied" on public.group_messages
  for insert to authenticated with check (author_id = auth.uid() and public.is_group_member(group_id));
create policy "Eigene Nachricht löschen" on public.group_messages
  for delete to authenticated using (author_id = auth.uid());

create policy "Eigener Dinner-Tisch sichtbar" on public.dinner_tables
  for select to authenticated using (id in (select public.my_dinner_table_ids()));

create policy "Eigene Anmeldung und Tischgäste sichtbar" on public.dinner_signups
  for select to authenticated using (
    user_id = auth.uid() or table_id in (select public.my_dinner_table_ids())
  );
create policy "Zum Dinner anmelden" on public.dinner_signups
  for insert to authenticated with check (user_id = auth.uid() and table_id is null);
create policy "Dinner-Anmeldung ändern" on public.dinner_signups
  for update to authenticated using (user_id = auth.uid() and table_id is null)
  with check (user_id = auth.uid() and table_id is null);
create policy "Dinner absagen" on public.dinner_signups
  for delete to authenticated using (user_id = auth.uid());

create policy "Melden" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());

-- ───────────── Dinner-Matching ─────────────
-- Verteilt alle offenen Anmeldungen eines Datums pro Stadt auf Tische mit bis zu 6 Personen
-- (bevorzugt ähnliches Budget). Mittwochs ausführen, z. B. per pg_cron:
--   select cron.schedule('dinner-matching', '0 8 * * 3',
--     $$ select public.match_dinners((current_date + 1)::date) $$);

create function public.match_dinners(p_date date) returns int
language plpgsql security definer set search_path = public as $$
declare
  c record;
  ids uuid[];
  n int;
  table_count int;
  i int;
  new_table uuid;
  created int := 0;
begin
  for c in
    select city from dinner_signups
    where dinner_date = p_date and table_id is null
    group by city
  loop
    select array_agg(user_id order by budget, random()) into ids
    from dinner_signups
    where dinner_date = p_date and city = c.city and table_id is null;

    n := coalesce(array_length(ids, 1), 0);
    if n < 4 then
      continue; -- zu wenige Anmeldungen, bleiben für eine spätere Runde offen
    end if;

    -- höchstens 6 pro Tisch; zusammenhängende Blöcke halten ähnliche Budgets zusammen
    table_count := greatest(1, ceil(n / 6.0)::int);
    for i in 0 .. table_count - 1 loop
      insert into dinner_tables (dinner_date, city) values (p_date, c.city) returning id into new_table;
      created := created + 1;
      update dinner_signups set table_id = new_table
      where dinner_date = p_date and city = c.city
        and user_id in (
          select ids[j] from generate_series(1, n) as j where (j - 1) * table_count / n = i
        );
    end loop;
  end loop;
  return created;
end $$;

revoke execute on function public.match_dinners(date) from public, anon, authenticated;
