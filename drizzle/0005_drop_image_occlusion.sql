-- Revert image occlusion support (columns never used in production)
ALTER TABLE public.cards DROP COLUMN IF EXISTS occlusion;
ALTER TABLE public.sets DROP COLUMN IF EXISTS image;
ALTER TABLE public.sets DROP COLUMN IF EXISTS type;
