-- Player profiles (email auth)
create table profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text,
  created_at timestamptz default now()
);

-- Daily scores
create table scores (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  puzzle_id text not null,
  score integer not null,
  results jsonb not null,
  submitted_at timestamptz default now(),
  unique(profile_id, puzzle_id)
);

create index idx_scores_puzzle_id on scores(puzzle_id, score desc, submitted_at asc);

alter table profiles enable row level security;
alter table scores enable row level security;

create policy "Anyone can read scores" on scores for select using (true);
create policy "Users insert own scores" on scores for insert with check (auth.uid()::uuid = profile_id);
create policy "Users read own profile" on profiles for select using (auth.uid()::uuid = id);
create policy "Users update own profile" on profiles for update using (auth.uid()::uuid = id);
