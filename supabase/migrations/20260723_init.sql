-- Create topics table
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subtopic TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_topic_subtopic UNIQUE (name, subtopic)
);

-- Create attempts table
CREATE TABLE IF NOT EXISTS public.attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    topic TEXT NOT NULL,
    subtopic TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'short_answer', 'code_trace')),
    question JSONB NOT NULL,
    user_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create topic_progress table
CREATE TABLE IF NOT EXISTS public.topic_progress (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    topic TEXT NOT NULL,
    subtopic TEXT NOT NULL,
    total_attempts INT NOT NULL DEFAULT 0,
    correct_attempts INT NOT NULL DEFAULT 0,
    last_attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, topic, subtopic)
);

-- Create trigger function for attempts rollup
CREATE OR REPLACE FUNCTION public.handle_attempt_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.topic_progress (user_id, topic, subtopic, total_attempts, correct_attempts, last_attempted_at)
    VALUES (
        NEW.user_id,
        NEW.topic,
        NEW.subtopic,
        1,
        CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        NEW.created_at
    )
    ON CONFLICT (user_id, topic, subtopic) DO UPDATE
    SET 
        total_attempts = public.topic_progress.total_attempts + 1,
        correct_attempts = public.topic_progress.correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        last_attempted_at = NEW.created_at;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE OR REPLACE TRIGGER on_attempt_inserted
AFTER INSERT ON public.attempts
FOR EACH ROW
EXECUTE FUNCTION public.handle_attempt_insert();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;

-- Enable SELECT for topics for authenticated users
CREATE POLICY select_topics_policy ON public.topics
    FOR SELECT TO authenticated USING (true);

-- Enable SELECT/INSERT/UPDATE/DELETE for attempts based on user_id
CREATE POLICY attempts_all_policy ON public.attempts
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Enable SELECT/INSERT/UPDATE/DELETE for topic_progress based on user_id
CREATE POLICY topic_progress_all_policy ON public.topic_progress
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Seed topics and subtopics
INSERT INTO public.topics (name, subtopic) VALUES
    ('Python OOP', 'Classes and Objects'),
    ('Python OOP', 'Inheritance and Polymorphism'),
    ('Python OOP', 'Encapsulation and Abstraction'),
    ('Dynamic Programming', 'Fibonacci & Memoization'),
    ('Dynamic Programming', 'Knapsack Problem'),
    ('Dynamic Programming', 'Longest Common Subsequence'),
    ('Graph Algorithms', 'BFS'),
    ('Graph Algorithms', 'Prim''s'),
    ('Graph Algorithms', 'Kruskal''s'),
    ('Graph Algorithms', 'Floyd-Warshall'),
    ('C++/Java', 'Pointers and Memory (C++)'),
    ('C++/Java', 'Interfaces and Abstract Classes (Java)'),
    ('C++/Java', 'Garbage Collection (Java)')
ON CONFLICT (name, subtopic) DO NOTHING;
