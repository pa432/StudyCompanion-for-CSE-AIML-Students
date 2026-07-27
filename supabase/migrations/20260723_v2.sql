-- Study Companion v2.0 Schema Extensions

-- 1. Table for storing generated study notes
CREATE TABLE IF NOT EXISTS study_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  subtopic TEXT NOT NULL,
  format TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for study_notes
ALTER TABLE study_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own study notes"
  ON study_notes
  FOR ALL
  USING (auth.uid() = user_id);

-- 2. Table for flashcard mastery progress
CREATE TABLE IF NOT EXISTS flashcard_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  subtopic TEXT NOT NULL,
  mastered_count INT DEFAULT 0,
  total_cards INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for flashcard_progress
ALTER TABLE flashcard_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their flashcard progress"
  ON flashcard_progress
  FOR ALL
  USING (auth.uid() = user_id);

-- 3. Add XP and streak fields to user profiles if profiles table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_xp INT DEFAULT 0;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_days INT DEFAULT 0;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_date DATE DEFAULT CURRENT_DATE;
  END IF;
END $$;
