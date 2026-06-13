-- =============================================================================
-- Âm Lịch — Chia sẻ gia phả (shared family trees)
-- Chạy migration này trên Supabase SQL Editor của bạn.
-- An toàn dựa hoàn toàn vào RLS + RPC security-definer (anon key là công khai).
-- =============================================================================

create extension if not exists pgcrypto;

-- --- PR-A: bảng snapshot gia phả được đăng tải để chia sẻ -------------------
create table if not exists public.lich_shared_families (
  family_id     uuid primary key,
  owner_id      uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  payload       jsonb not null,
  share_token   text not null unique,
  password_hash text,
  updated_at    timestamptz not null default now()
);

alter table public.lich_shared_families enable row level security;

-- Chủ sở hữu toàn quyền với gia phả của mình.
drop policy if exists owner_all on public.lich_shared_families;
create policy owner_all on public.lich_shared_families
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- --- PR-B: xem qua LINK bí mật (anon) qua RPC security-definer ---------------
-- Trả payload nếu token khớp; nếu có mật khẩu thì phải khớp. Anon gọi được.
create or replace function public.get_shared_family(p_token text, p_pass text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.lich_shared_families;
begin
  select * into rec from public.lich_shared_families where share_token = p_token;
  if not found then
    return null;
  end if;
  if rec.password_hash is not null then
    if p_pass is null or rec.password_hash <> crypt(p_pass, rec.password_hash) then
      return jsonb_build_object('error', 'password_required');
    end if;
  end if;
  return rec.payload;
end;
$$;

grant execute on function public.get_shared_family(text, text) to anon, authenticated;

-- Đặt/đổi mật khẩu cho link (chỉ chủ sở hữu gọi được; bcrypt qua pgcrypto).
create or replace function public.set_shared_family_password(p_family_id uuid, p_pass text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.lich_shared_families
     set password_hash = case when p_pass is null or p_pass = '' then null
                              else crypt(p_pass, gen_salt('bf')) end,
         updated_at = now()
   where family_id = p_family_id and owner_id = auth.uid();
end;
$$;

grant execute on function public.set_shared_family_password(uuid, text) to authenticated;

-- --- PR-C: mời theo email + người được mời đọc được snapshot ----------------
create table if not exists public.lich_family_shares (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references public.lich_shared_families(family_id) on delete cascade,
  owner_id      uuid not null references auth.users(id) on delete cascade,
  family_name   text not null default '',
  invitee_email text not null,
  status        text not null default 'pending',
  created_at    timestamptz not null default now(),
  unique (family_id, invitee_email)
);

alter table public.lich_family_shares enable row level security;

drop policy if exists shares_owner on public.lich_family_shares;
create policy shares_owner on public.lich_family_shares
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists shares_invitee_read on public.lich_family_shares;
create policy shares_invitee_read on public.lich_family_shares
  for select using (lower(invitee_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists shares_invitee_accept on public.lich_family_shares;
create policy shares_invitee_accept on public.lich_family_shares
  for update using (lower(invitee_email) = lower(auth.jwt() ->> 'email'))
  with check (lower(invitee_email) = lower(auth.jwt() ->> 'email'));

-- Người được mời (đăng nhập đúng email, status accepted) đọc được snapshot.
drop policy if exists invited_read on public.lich_shared_families;
create policy invited_read on public.lich_shared_families
  for select using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.lich_family_shares s
      where s.family_id = lich_shared_families.family_id
        and lower(s.invitee_email) = lower(auth.jwt() ->> 'email')
        and s.status = 'accepted'
    )
  );

-- --- PR-D: đề xuất chỉnh sửa + duyệt ----------------------------------------
create table if not exists public.lich_family_suggestions (
  id             uuid primary key default gen_random_uuid(),
  family_id      uuid not null references public.lich_shared_families(family_id) on delete cascade,
  owner_id       uuid not null references auth.users(id) on delete cascade,
  suggester_name text not null default '',
  kind           text not null,
  payload        jsonb not null,
  status         text not null default 'pending',
  created_at     timestamptz not null default now()
);

alter table public.lich_family_suggestions enable row level security;

-- Chủ quản lý (xem/duyệt/xoá) đề xuất gửi tới gia phả của mình.
drop policy if exists suggestions_owner on public.lich_family_suggestions;
create policy suggestions_owner on public.lich_family_suggestions
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Gửi đề xuất: qua RPC security-definer. Cho phép nếu biết token, là chủ, hoặc
-- là người được mời đã accepted.
create or replace function public.submit_family_suggestion(
  p_family_id uuid, p_name text, p_kind text, p_payload jsonb, p_token text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  fam public.lich_shared_families;
  allowed boolean := false;
begin
  select * into fam from public.lich_shared_families where family_id = p_family_id;
  if not found then
    raise exception 'family_not_found';
  end if;
  if p_token is not null and p_token = fam.share_token then
    allowed := true;
  elsif fam.owner_id = auth.uid() then
    allowed := true;
  elsif exists (
    select 1 from public.lich_family_shares s
    where s.family_id = p_family_id
      and lower(s.invitee_email) = lower(auth.jwt() ->> 'email')
      and s.status = 'accepted'
  ) then
    allowed := true;
  end if;
  if not allowed then
    raise exception 'not_allowed';
  end if;
  insert into public.lich_family_suggestions(family_id, owner_id, suggester_name, kind, payload)
  values (p_family_id, fam.owner_id, coalesce(p_name, ''), p_kind, p_payload);
end;
$$;

grant execute on function public.submit_family_suggestion(uuid, text, text, jsonb, text)
  to anon, authenticated;
