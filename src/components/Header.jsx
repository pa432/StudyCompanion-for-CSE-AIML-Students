import React from 'react'
import {
  Brain, Compass, Sparkles, MessageSquare, Award, BookOpen, Layers, LogOut, Flame, Zap
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'picker', label: 'Topics', icon: Compass },
  { id: 'quiz', label: 'Practice', icon: Sparkles },
  { id: 'chat', label: 'Tutor', icon: MessageSquare },
  { id: 'notes', label: 'Notes', icon: BookOpen },
  { id: 'flashcards', label: 'Cards', icon: Layers },
  { id: 'dashboard', label: 'Dashboard', icon: Award },
]

export default function Header({ activeTab, setActiveTab, session, onSignOut, userStats }) {
  const streak = userStats?.streak || 0
  const xp = userStats?.totalXp || 0
  const level = userStats?.level || Math.floor(xp / 100) + 1
  const xpInLevel = Math.min(100, Math.round(((xp % 500) / 500) * 100))

  return (
    <header className="sticky top-0 z-30 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-4 md:px-6 py-3 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer" onClick={() => setActiveTab('picker')}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 border border-violet-500/20 text-violet-400 animate-pulse-glow">
          <Brain className="h-5 w-5" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-lg font-bold tracking-tight gradient-text">
            Study Companion
          </h1>
          <p className="text-[10px] text-slate-500 font-medium">AI-Powered • B.Tech Coursework</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-0.5 md:gap-1 overflow-x-auto no-scrollbar">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
              activeTab === id
                ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20 shadow-sm shadow-violet-500/5'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{label}</span>
          </button>
        ))}
      </nav>

      {/* User Info + Gamification */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Streak */}
        {streak > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-1.5">
            <span className="animate-fire text-base">🔥</span>
            <span className="text-xs font-bold text-orange-400">{streak}</span>
          </div>
        )}

        {/* XP Badge */}
        <div className="hidden md:flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-1.5">
          <Zap className="h-3 w-3 text-yellow-400" />
          <span className="text-xs font-bold text-violet-400">Lv.{level}</span>
          <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${xpInLevel}%` }}
            />
          </div>
        </div>

        {/* Email */}
        <span className="hidden xl:inline text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
          {session?.user?.email}
        </span>

        {/* Sign Out */}
        <button
          onClick={onSignOut}
          className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-800 hover:border-red-500/30 hover:bg-red-500/5 text-slate-400 hover:text-red-400 transition-all"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}

