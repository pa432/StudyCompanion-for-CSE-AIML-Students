-- Fix: current_streak / next_review_at were referenced by the
-- spaced-repetition trigger but never added to an existing
-- topic_progress table (CREATE TABLE IF NOT EXISTS is a no-op
-- on tables that already exist).
ALTER TABLE public.topic_progress
ADD COLUMN IF NOT EXISTS current_streak INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Also ensure grants exist for tables that had RLS policies
-- but no table-level GRANT (caused 42501 permission denied).
GRANT SELECT ON public.topics TO authenticated;
GRANT SELECT, INSERT ON public.attempts TO authenticated;
GRANT SELECT ON public.topic_progress TO authenticated;
GRANT SELECT ON public.user_rate_limits TO authenticated;
GRANT SELECT ON public.question_bank TO authenticated;