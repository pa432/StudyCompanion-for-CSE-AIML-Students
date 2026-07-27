import React from 'react'
import {
  Trophy,
  Flame,
  Zap,
  Target,
  BookOpen,
  Brain,
  Layers,
  Clock,
  Sparkles,
  Award,
  TrendingUp,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'

export default function Dashboard({
  userStats = { streak: 0, totalXp: 0, level: 1, quizzesCompleted: 0, notesCreated: 0 },
  activeTab,
  setActiveTab,
  selectedTopic,
  selectedSubtopic,
}) {
  const nextLevelXp = userStats.level * 500
  const currentLevelProgress = Math.min(100, Math.round(((userStats.totalXp % 500) / 500) * 100))

  const BADGES = [
    { id: 1, title: 'First Steps', desc: 'Complete 1 Quiz', icon: '🎯', unlocked: userStats.quizzesCompleted >= 1 },
    { id: 2, title: 'Streak Master', desc: 'Maintain 3-day streak', icon: '🔥', unlocked: userStats.streak >= 3 },
    { id: 3, title: 'Note Taker', desc: 'Generate 5 Study Notes', icon: '📝', unlocked: userStats.notesCreated >= 5 },
    { id: 4, title: 'Scholar', desc: 'Reach 1,000 XP', icon: '🎓', unlocked: userStats.totalXp >= 1000 },
  ]

  return (
    <div className="max-w-6xl w-full mx-auto space-y-6 animate-fade-in pb-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-900/60 via-indigo-900/40 to-slate-900 border border-violet-500/20 p-6 md:p-8">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Welcome back, Scholar!
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Ready to boost your knowledge today?
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              {selectedTopic && selectedSubtopic
                ? `Currently studying: ${selectedTopic} → ${selectedSubtopic}`
                : 'Select a subject or jump straight into an AI-powered practice session.'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('quiz')}
              className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Zap className="h-4 w-4" /> Start Practice Quiz
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className="px-5 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center gap-2 transition-all hover:scale-105"
            >
              <Brain className="h-4 w-4 text-violet-400" /> Ask AI Tutor
            </button>
          </div>
        </div>
      </div>

      {/* Grid Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{userStats.streak} Days</div>
            <div className="text-xs text-slate-400">Study Streak</div>
          </div>
        </div>

        {/* Total XP */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{userStats.totalXp}</div>
            <div className="text-xs text-slate-400">Total XP Earned</div>
          </div>
        </div>

        {/* Level */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">Lvl {userStats.level}</div>
            <div className="text-xs text-slate-400">{currentLevelProgress}% to Level {userStats.level + 1}</div>
          </div>
        </div>

        {/* Completed Quizzes */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{userStats.quizzesCompleted}</div>
            <div className="text-xs text-slate-400">Quizzes Finished</div>
          </div>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => setActiveTab('notes')}
          className="group cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-violet-500/40 rounded-2xl p-5 transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
              Smart Study Notes
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Generate AI summary sheets, cheat sheets, and structured topic breakdowns instantly.
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('flashcards')}
          className="group cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-violet-500/40 rounded-2xl p-5 transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white group-hover:text-pink-300 transition-colors">
              Interactive Flashcards
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Master key terms & definitions with 3D flipping flashcard decks created by AI.
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('pomodoro')}
          className="group cursor-pointer bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-violet-500/40 rounded-2xl p-5 transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white group-hover:text-amber-300 transition-colors">
              Focus Pomodoro Timer
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Stay in deep focus with timed study intervals and automated break reminders.
            </p>
          </div>
        </div>
      </div>

      {/* Badges & Achievements Section */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-violet-400" /> Achievements & Badges
          </h2>
          <span className="text-xs text-slate-500">
            {BADGES.filter((b) => b.unlocked).length} / {BADGES.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {BADGES.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-xl border flex flex-col items-center text-center space-y-2 transition-all ${
                badge.unlocked
                  ? 'bg-violet-950/20 border-violet-500/30 text-white'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-50 grayscale'
              }`}
            >
              <div className="text-3xl mb-1">{badge.icon}</div>
              <div className="text-xs font-bold">{badge.title}</div>
              <div className="text-[10px] text-slate-400">{badge.desc}</div>
              {badge.unlocked && (
                <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-1">
                  <CheckCircle2 className="h-3 w-3" /> Unlocked
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
