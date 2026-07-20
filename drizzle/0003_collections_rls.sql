-- Secure collaboration tables exposed through Supabase Data API.
-- Application server queries use the database connection and retain their existing authorization checks.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folder_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sets ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.folder_sets ADD CONSTRAINT folder_sets_pkey PRIMARY KEY (folder_id, set_id);
ALTER TABLE public.class_users ADD CONSTRAINT class_users_pkey PRIMARY KEY (class_id, user_id);
ALTER TABLE public.class_sets ADD CONSTRAINT class_sets_pkey PRIMARY KEY (class_id, set_id);

CREATE INDEX IF NOT EXISTS folder_sets_set_id_idx ON public.folder_sets (set_id);
CREATE INDEX IF NOT EXISTS class_sets_set_id_idx ON public.class_sets (set_id);

CREATE POLICY "Owners manage folders" ON public.folders FOR ALL TO authenticated
  USING (user_id = (select auth.uid())::text)
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Owners manage folder sets" ON public.folder_sets FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.folders f WHERE f.id = folder_id AND f.user_id = (select auth.uid())::text))
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.folders f WHERE f.id = folder_id AND f.user_id = (select auth.uid())::text)
    AND EXISTS (SELECT 1 FROM public.sets s WHERE s.id = set_id AND s.user_id = (select auth.uid())::text)
  );

CREATE POLICY "View public or joined classes" ON public.classes FOR SELECT TO authenticated
  USING (
    visibility = 'public'
    OR user_id = (select auth.uid())::text
    OR EXISTS (SELECT 1 FROM public.class_users cu WHERE cu.class_id = id AND cu.user_id = (select auth.uid())::text)
  );
CREATE POLICY "Owners manage classes" ON public.classes FOR ALL TO authenticated
  USING (user_id = (select auth.uid())::text)
  WITH CHECK (user_id = (select auth.uid())::text);

CREATE POLICY "Members view class members" ON public.class_users FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.class_users mine WHERE mine.class_id = class_id AND mine.user_id = (select auth.uid())::text));
CREATE POLICY "Users join public classes" ON public.class_users FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())::text
    AND role = 'member'
    AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.visibility = 'public')
  );
CREATE POLICY "Members leave classes" ON public.class_users FOR DELETE TO authenticated
  USING (user_id = (select auth.uid())::text AND role = 'member');

CREATE POLICY "Members view class sets" ON public.class_sets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.class_users cu WHERE cu.class_id = class_id AND cu.user_id = (select auth.uid())::text));
CREATE POLICY "Admins manage class sets" ON public.class_sets FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.class_users cu WHERE cu.class_id = class_id AND cu.user_id = (select auth.uid())::text AND cu.role = 'admin'))
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.class_users cu WHERE cu.class_id = class_id AND cu.user_id = (select auth.uid())::text AND cu.role = 'admin')
    AND EXISTS (SELECT 1 FROM public.sets s WHERE s.id = set_id AND s.user_id = (select auth.uid())::text)
  );

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
