# Study Companion 🎓 (IgniteX HackFest 2026)

An AI-powered practice and progress-tracking web application designed for B.Tech AI/ML coursework (Python OOP, Dynamic Programming, Graph Algorithms).

## Project "Why"
As a B.Tech AI/ML student, preparing for technical exams requires continuous practice, tracking weak areas, and immediate conceptual explanations when stuck. Standard platforms like LeetCode focus mostly on coding, while classroom assessments include MCQs, short answers, and code traces. 

**Study Companion** bridges this gap:
1. **Targeted Weak-Area Tracking**: Tracks quiz accuracy at the subtopic level and highlights weakest areas first on the dashboard.
2. **Context-Aware Tutor**: A built-in AI tutor that can explain concepts with small concrete examples (under 200 words).
3. **Syllabus-Oriented Generator**: Employs Gemini to generate three styles of practice questions: MCQ, Short Answer, and Code Tracing.

---

## Tech Stack
- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons
- **Backend/Database**: Supabase (Postgres + Auth + Row Level Security)
- **AI**: Gemini 2.5 Flash Lite (via Supabase Edge Function)

---

## Database Schema (PostgreSQL)

### 1. `topics`
Stores the data-driven coursework syllabus.
- `id` (UUID, Primary Key)
- `name` (Text, e.g., "Dynamic Programming")
- `subtopic` (Text, e.g., "Knapsack Problem")
- `created_at` (Timestamp)

### 2. `attempts`
Stores individual question attempts. Protected by RLS (`auth.uid() = user_id`).
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to `auth.users`)
- `topic` (Text)
- `subtopic` (Text)
- `difficulty` (Text)
- `question_type` (Text)
- `question` (JSONB)
- `user_answer` (Text)
- `is_correct` (Boolean)
- `created_at` (Timestamp)

### 3. `topic_progress`
Real-time rollup showing aggregate statistics per subtopic. Protected by RLS (`auth.uid() = user_id`).
- `user_id` (UUID, Foreign Key to `auth.users`)
- `topic` (Text)
- `subtopic` (Text)
- `total_attempts` (Int)
- `correct_attempts` (Int)
- `last_attempted_at` (Timestamp)

*A PostgreSQL trigger on `attempts` inserts runs an upsert into `topic_progress` to automatically increment total attempts and correct attempts in real-time.*

---

## Setup Instructions

### 1. Database Setup
Execute the migration script in `supabase/migrations/20260723_init.sql` using your Supabase SQL Editor.

### 2. Edge Function Configuration
Deploy the edge function located in `supabase/functions/gemini-chat`:
```bash
supabase functions deploy gemini-chat
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Frontend Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Running Locally
Install dependencies and run the development server:
```bash
npm install
npm run dev
```
The site will run at `http://localhost:5173`.
