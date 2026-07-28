import React from 'react'
import { Code2, Play, MessageSquare, Loader2 } from 'lucide-react'
import { StatsGrid } from './StatsCards'

const DEFAULT_TOPICS_MAP = {
  'Data Structures & Algorithms': [
    'Arrays & Strings',
    'Linked Lists & Trees',
    'Sorting & Searching',
    'Dynamic Programming',
  ],
  'Machine Learning': [
    'Supervised Learning',
    'Neural Networks & Deep Learning',
    'Model Evaluation & Metrics',
  ],
  'Database Management Systems': [
    'SQL & Normalization',
    'Transactions & Indexing',
  ],
  'Operating Systems': [
    'Process Management & Threads',
    'Memory Management & Virtual Memory',
  ],
}

export default function TopicPicker({
  topics = [],
  groupedTopics,
  progress = [],
  selectedTopic,
  selectedSubtopic,
  setSelectedTopic,
  setSelectedSubtopic,

  startPractice,
  startChat,
  onStartPractice,
  onStartChat,
  getSubtopicProgress,
}) {
  const handleStartPractice = onStartPractice || startPractice || (() => { })
  const handleStartChat = onStartChat || startChat || (() => { })

  // Compute grouped topics if topics array is passed
  const effectiveGroupedTopics = (() => {
    if (groupedTopics && Object.keys(groupedTopics).length > 0) {
      return groupedTopics
    }
    if (topics && topics.length > 0) {
      const map = {}
      topics.forEach((t) => {
        if (!map[t.name]) map[t.name] = []
        if (t.subtopic && !map[t.name].includes(t.subtopic)) {
          map[t.name].push(t.subtopic)
        }
      })
      if (Object.keys(map).length > 0) return map
    }
    return DEFAULT_TOPICS_MAP
  })()

  const calculateProgress = (topicName, subtopicName) => {
    if (getSubtopicProgress) return getSubtopicProgress(topicName, subtopicName)
    const p = progress.find((item) => item.topic === topicName && item.subtopic === subtopicName)
    if (!p || !p.total_attempts) return { total: 0, accuracy: 0 }
    return {
      total: p.total_attempts,
      accuracy: Math.round((p.correct_attempts / p.total_attempts) * 100),
    }
  }

  return (
    <div className="space-y-6 flex-1 animate-fade-in">
      {/* Greeting */}
      <div className="animate-slide-up">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
          Personalized Study Planner
        </h2>
        <p className="text-sm text-slate-400">
          Select your coursework topic, difficulty level, and begin practicing or explaining concepts with Gemini AI.
        </p>
      </div>

      {/* Quick Stats */}
      <StatsGrid progress={progress} />


      {/* Topic List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(effectiveGroupedTopics).map(([topicName, subtopics], topicIdx) => (
          <div
            key={topicName}
            className="glass-panel rounded-2xl p-5 border border-slate-800 hover-lift animate-fade-in"
            style={{ animationDelay: `${topicIdx * 0.1}s` }}
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Code2 className="h-4 w-4 text-violet-400" />
              {topicName}
            </h3>
            <div className="space-y-3">
              {subtopics.map((sub) => {
                const prog = calculateProgress(topicName, sub)
                const isSelected = selectedTopic === topicName && selectedSubtopic === sub
                return (
                  <div
                    key={sub}
                    onClick={() => {
                      setSelectedTopic(topicName)
                      setSelectedSubtopic(sub)
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${isSelected
                        ? 'bg-violet-600/10 border-violet-500/40 shadow-sm shadow-violet-500/5'
                        : 'bg-slate-950/40 border-slate-900 hover:border-slate-800 hover:bg-slate-900/20'
                      }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold text-white text-sm">{sub}</p>
                      <p className="text-[11px] text-slate-500">
                        {prog.total > 0 ? (
                          <>
                            <span className="font-semibold text-violet-400">{prog.accuracy}%</span> accuracy • {prog.total} attempts
                          </>
                        ) : (
                          'Not attempted yet'
                        )}
                      </p>
                      {/* Mini progress bar */}
                      {prog.total > 0 && (
                        <div className="w-full max-w-[120px] bg-slate-900 rounded-full h-1 mt-1">
                          <div
                            className={`h-1 rounded-full animate-progress ${prog.accuracy < 50 ? 'bg-red-500' : prog.accuracy < 75 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            style={{ width: `${prog.accuracy}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartPractice(topicName, sub)
                        }}
                        className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all"
                      >
                        <Play className="h-3 w-3" />
                        Practice
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartChat(topicName, sub)
                        }}
                        className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Explain
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

