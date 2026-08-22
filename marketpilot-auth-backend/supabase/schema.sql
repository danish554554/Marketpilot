-- MarketPilot AI / Module 1: run this in Supabase Dashboard > SQL Editor.
create type public.app_role as enum ('business_owner', 'team_member', 'administrator');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role public.app_role not null default 'business_owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Direct browser access is intentionally read-only. The API uses the service-role key
-- server-side after validating the bearer token, so users cannot promote themselves.
create policy "Users can read their own profile"
  on public.profiles for select to authenticated using (auth.uid() = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- After registering your first account, promote it deliberately (replace the email):
-- update public.profiles set role = 'administrator' where email = 'you@example.com';
