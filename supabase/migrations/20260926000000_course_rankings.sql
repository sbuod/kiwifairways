-- Course rankings from third-party publishers, entered by hand or imported
-- from CSV (do not scrape the source sites). The client shows only the latest
-- edition_year for each source.

create table if not exists public.course_rankings (
  id           bigint generated always as identity primary key,
  course_id    text not null references public.course_info (id) on delete cascade,
  source       text not null check (source in ('top100', 'nzgolfrankings', 'agd')),
  rank         integer not null check (rank > 0),
  edition_year integer not null,
  source_url   text,
  updated_at   timestamptz not null default now(),
  unique (course_id, source, edition_year)
);

create index if not exists course_rankings_course_id_idx
  on public.course_rankings (course_id);

-- Keep updated_at current on edits
create or replace function public.course_rankings_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists course_rankings_set_updated_at on public.course_rankings;
create trigger course_rankings_set_updated_at
  before update on public.course_rankings
  for each row execute function public.course_rankings_set_updated_at();

-- Public read-only access; writes go through the dashboard / service role
alter table public.course_rankings enable row level security;

drop policy if exists "Rankings are publicly readable" on public.course_rankings;
create policy "Rankings are publicly readable"
  on public.course_rankings
  for select
  to anon, authenticated
  using (true);
