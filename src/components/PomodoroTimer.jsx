import React, { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Clock, Coffee, Sparkles, CheckCircle2 } from 'lucide-react'

const MODES = {
  work: { label: 'Focus Session', time: 25 * 60, color: 'text-violet-400', bg: 'bg-violet-600' },
  shortBreak: { label: 'Short Break', time: 5 * 60, color: 'text-emerald-400', bg: 'bg-emerald-600' },
  longBreak: { label: 'Long Break', time: 15 * 60, color: 'text-cyan-400', bg: 'bg-cyan-600' },
}

export default function PomodoroTimer() {
  const [activeMode, setActiveMode] = useState('work')
  const [timeLeft, setTimeLeft] = useState(MODES.work.time)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)

  useEffect(() => {
    let timer = null
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      if (activeMode === 'work') {
        setSessionsCompleted((prev) => prev + 1)
      }
    }
    return () => clearInterval(timer)
  }, [isRunning, timeLeft, activeMode])

  const handleModeChange = (modeKey) => {
    setActiveMode(modeKey)
    setTimeLeft(MODES[modeKey].time)
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(MODES[activeMode].time)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const totalModeTime = MODES[activeMode].time
  const progressPercent = ((totalModeTime - timeLeft) / totalModeTime) * 100
  const dashoffset = 502 - (502 * progressPercent) / 100

  return (
    <div className="max-w-md w-full mx-auto space-y-6 animate-fade-in pb-12">
      {/* Mode Selector */}
      <div className="bg-slate-900/60 border border-slate-800 p-1.5 rounded-2xl flex gap-1">
        {Object.keys(MODES).map((key) => (
          <button
            key={key}
            onClick={() => handleModeChange(key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeMode === key
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {MODES[key].label}
          </button>
        ))}
      </div>

      {/* Main Timer Display */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center space-y-6 shadow-2xl relative">
        <div className="relative h-64 w-64 flex items-center justify-center">
          {/* SVG Ring */}
          <svg className="h-full w-full transform -rotate-90" viewBox="0 0 180 180">
            <circle
              cx="90"
              cy="90"
              r="80"
              className="stroke-slate-800"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="90"
              cy="90"
              r="80"
              className={`transition-all duration-1000 ${MODES[activeMode].color}`}
              strokeWidth="8"
              strokeDasharray="502"
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
              fill="transparent"
              stroke="currentColor"
            />
          </svg>

          {/* Center Timer Text */}
          <div className="absolute flex flex-col items-center justify-center space-y-1">
            <span className="text-4xl font-extrabold text-white font-mono tracking-wider">
              {formatTime(timeLeft)}
            </span>
            <span className={`text-xs font-semibold uppercase tracking-wider ${MODES[activeMode].color}`}>
              {MODES[activeMode].label}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            className="h-12 w-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all hover:scale-105"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`h-14 px-8 rounded-2xl font-bold text-white shadow-lg flex items-center gap-2 transition-all hover:scale-105 ${MODES[activeMode].bg}`}
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5" /> Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5" /> Start Focus
              </>
            )}
          </button>
        </div>
      </div>

      {/* Session Progress Stats */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Sessions Completed Today</span>
        </div>
        <span className="font-bold text-white text-sm bg-slate-800 px-3 py-1 rounded-lg">
          {sessionsCompleted} 🎯
        </span>
      </div>
    </div>
  )
}
