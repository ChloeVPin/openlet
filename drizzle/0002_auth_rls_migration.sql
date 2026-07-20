-- Migration: Supabase Auth + RLS
-- Self-contained: creates profiles table if needed, migrates users,
-- drops old FKs, adds new FKs to profiles, enables RLS, creates trigger.

-- ════════════════════════════════════════════════════════════════
-- Step 1: Create profiles table if it doesn't exist yet
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  preferences jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_id_idx ON public.profiles (id);

-- ════════════════════════════════════════════════════════════════
-- Step 2: Migrate existing users from public.users to public.profiles
-- ════════════════════════════════════════════════════════════════
INSERT INTO public.profiles (id, name, preferences, created_at)
SELECT id, name, preferences, created_at
FROM public.users
ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- Step 3: Drop old FK constraints referencing public.users
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.sets DROP CONSTRAINT IF EXISTS sets_user_id_users_id_fk;
ALTER TABLE public.sets DROP CONSTRAINT IF EXISTS sets_user_id_users_fk;

ALTER TABLE public.study_sessions DROP CONSTRAINT IF EXISTS study_sessions_user_id_users_id_fk;
ALTER TABLE public.study_sessions DROP CONSTRAINT IF EXISTS study_sessions_user_id_users_fk;

ALTER TABLE public.card_metadata DROP CONSTRAINT IF EXISTS card_metadata_user_id_users_id_fk;
ALTER TABLE public.card_metadata DROP CONSTRAINT IF EXISTS card_metadata_user_id_users_fk;

-- ════════════════════════════════════════════════════════════════
-- Step 4: Re-add FK constraints referencing public.profiles
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.sets DROP CONSTRAINT IF EXISTS sets_user_id_profiles_id_fk;
ALTER TABLE public.sets
  ADD CONSTRAINT sets_user_id_profiles_id_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.study_sessions DROP CONSTRAINT IF EXISTS study_sessions_user_id_profiles_id_fk;
ALTER TABLE public.study_sessions
  ADD CONSTRAINT study_sessions_user_id_profiles_id_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.card_metadata DROP CONSTRAINT IF EXISTS card_metadata_user_id_profiles_id_fk;
ALTER TABLE public.card_metadata
  ADD CONSTRAINT card_metadata_user_id_profiles_id_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ════════════════════════════════════════════════════════════════
-- Step 5: Enable RLS and create policies
-- NOTE: auth.uid() returns uuid, so we cast ::text for text columns
-- ════════════════════════════════════════════════════════════════

-- 5a. Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid()::text);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid()::text);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid()::text);

-- 5b. Sets
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own or public sets"
  ON public.sets FOR SELECT
  USING (
    user_id = auth.uid()::text
    OR visibility = 'public'
  );

CREATE POLICY "Users can insert own sets"
  ON public.sets FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own sets"
  ON public.sets FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own sets"
  ON public.sets FOR DELETE
  USING (user_id = auth.uid()::text);

-- 5c. Cards
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own or public cards"
  ON public.cards FOR SELECT
  USING (
    set_id IN (
      SELECT id FROM public.sets
      WHERE user_id = auth.uid()::text OR visibility = 'public'
    )
  );

CREATE POLICY "Users can modify cards in own sets"
  ON public.cards FOR INSERT
  WITH CHECK (
    set_id IN (SELECT id FROM public.sets WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Users can update cards in own sets"
  ON public.cards FOR UPDATE
  USING (
    set_id IN (SELECT id FROM public.sets WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Users can delete cards in own sets"
  ON public.cards FOR DELETE
  USING (
    set_id IN (SELECT id FROM public.sets WHERE user_id = auth.uid()::text)
  );

-- 5d. Study Sessions
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study sessions"
  ON public.study_sessions FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own study sessions"
  ON public.study_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own study sessions"
  ON public.study_sessions FOR DELETE
  USING (user_id = auth.uid()::text);

-- 5e. Card Metadata
ALTER TABLE public.card_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own card metadata"
  ON public.card_metadata FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own card metadata"
  ON public.card_metadata FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own card metadata"
  ON public.card_metadata FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own card metadata"
  ON public.card_metadata FOR DELETE
  USING (user_id = auth.uid()::text);

-- ════════════════════════════════════════════════════════════════
-- Step 6: Trigger for auto-creating profiles on signup
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
