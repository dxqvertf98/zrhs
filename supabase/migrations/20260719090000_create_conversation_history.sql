create table public.conversation_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null check (char_length(title) between 1 and 120),
    question text not null check (char_length(question) > 0),
    answer_html text not null check (char_length(answer_html) > 0),
    target_language text not null,
    created_at timestamptz not null default now()
);

create index conversation_history_user_created_at_idx
    on public.conversation_history (user_id, created_at desc);

alter table public.conversation_history enable row level security;

create policy "Users can view their own conversation history"
    on public.conversation_history for select
    to authenticated
    using ((select auth.uid()) = user_id);

create policy "Users can add their own conversation history"
    on public.conversation_history for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

create policy "Users can edit their own conversation history titles"
    on public.conversation_history for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

grant select, insert, update on public.conversation_history to authenticated;
