import React from 'react'
import { Play, Award, Brain, TrendingUp, Target, BookOpen } from 'lucide-react'

export function StatsGrid({ progress }) {
  const totalAttempts = progress.reduce((acc, curr) => acc + curr.total_attempts, 0)
  const totalCorrect = progress.reduce((acc, curr) => acc + curr.correct_attempts, 0)
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0

  const weakestTopic = (() => {
    if (progress.length === 0) return 'Start a practice quiz'
    const sorted = [...progress].sort((a, b) => {
      const accA = a.total_attempts > 0 ? a.correct_attempts / a.total_attempts : 1
      const accB = b.total_attempts > 0 ? b.correct_attempts / b.total_attempts : 1
      return accA - accB
    })
    return sorted[0].subtopic
  })()

  const stats = [
    {
      label: 'Total Attempts',
      value: totalAttempts,
      icon: Play,
      iconBg: 'bg-violet-600/10',
      iconColor: 'text-violet-400',
      iconBorder: 'border-violet-500/10'
    },
    {
      label: 'Overall Accuracy',
      value: `${overallAccuracy}%`,
      icon: Award,
      iconBg: 'bg-emerald-600/10',
      iconColor: 'text-emerald-400',
      iconBorder: 'border-emerald-500/10'
    },
    {
      label: 'Focus Area',
      value: weakestTopic,
      isText: true,
      icon: Brain,
      iconBg: 'bg-indigo-600/10',
      iconColor: 'text-indigo-400',
      iconBorder: 'border-indigo-500/10'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {stats.map((stat, idx) => (
        <div
          key={stat.label}
          className="glass-panel rounded-2xl p-5 flex items-center justify-between hover-lift animate-fade-in"
          style={{ animationDelay: `${idx * 0.1}s` }}
        >
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            {stat.isText ? (
              <h3 className="text-sm font-bold text-violet-400 mt-1.5 truncate max-w-[180px]">
                {stat.value}
              </h3>
            ) : (
              <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-1">{stat.value}</h3>
            )}
          </div>
          <div className={`h-11 w-11 rounded-xl ${stat.iconBg} ${stat.iconColor} border ${stat.iconBorder} flex items-center justify-center flex-shrink-0`}>
            <stat.icon className="h-5 w-5" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DifficultySelector({ difficulty, setDifficulty }) {
  const levels = [
    { key: 'easy', activeBg: 'bg-emerald-500/10', activeBorder: 'border-emerald-500/50', activeText: 'text-emerald-400' },
    { key: 'medium', activeBg: 'bg-amber-500/10', activeBorder: 'border-amber-500/50', activeText: 'text-amber-400' },
    { key: 'hard', activeBg: 'bg-red-500/10', activeBorder: 'border-red-500/50', activeText: 'text-red-400' },
  ]

  return (
    <div className="glass-panel rounded-2xl p-5 animate-fade-in">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quiz Difficulty</h4>
      <div className="flex gap-3">
        {levels.map(({ key, activeBg, activeBorder, activeText }) => (
          <button
            key={key}
            onClick={() => setDifficulty(key)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
              difficulty === key
                ? `${activeBg} ${activeBorder} ${activeText}`
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  )
}
