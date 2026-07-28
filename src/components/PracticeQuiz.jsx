import React from 'react'
import {
  Loader2, ChevronRight, CheckCircle2, XCircle, RefreshCw,
  MessageSquare, AlertCircle, Play, Sparkles
} from 'lucide-react'

export default function PracticeQuiz({
  generatingQuestion,
  quizQuestion,
  selectedTopic,
  selectedSubtopic,
  userAnswer,
  setUserAnswer,
  submittedAnswer,
  quizFeedback,
  onSubmitAnswer,
  submitAnswer,
  onNextQuestion,
  startPractice,
  onAskTutor,
  startChat,
  setActiveTab,
  aiExplanation,
  loadingAiExplanation,
}) {
  const handleSubmit = onSubmitAnswer || submitAnswer || (() => { })
  const handleNext = () => {
    if (onNextQuestion) {
      onNextQuestion()
    } else if (startPractice) {
      startPractice(quizQuestion?.topic || selectedTopic, quizQuestion?.subtopic || selectedSubtopic)
    }
  }
  const handleTutor = () => {
    if (onAskTutor) {
      onAskTutor(quizQuestion?.topic || selectedTopic, quizQuestion?.subtopic || selectedSubtopic)
    } else if (startChat) {
      startChat(quizQuestion?.topic || selectedTopic, quizQuestion?.subtopic || selectedSubtopic)
    }
  }

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6 flex-1 flex flex-col justify-center animate-fade-in">
      {/* Loading State */}
      {generatingQuestion && (
        <div className="glass-panel rounded-2xl p-10 text-center flex flex-col items-center justify-center border border-slate-900 animate-slide-up">
          <div className="relative mb-5">
            <div className="h-14 w-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-violet-400 animate-pulse" />
            </div>
            <div className="absolute -inset-2 rounded-2xl bg-violet-500/5 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Generating personalized quiz...</h3>
          Gemini is analyzing your syllabus for <span className="text-violet-400 font-semibold">{selectedSubtopic || 'selected topic'}</span> to curate a personalized challenge.

        </div>
      )
      }

      {/* No Question State */}
      {
        !generatingQuestion && !quizQuestion && (
          <div className="glass-panel rounded-2xl p-8 text-center border border-slate-900 animate-slide-up">
            <AlertCircle className="h-10 w-10 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No active quiz question</h3>
            <p className="text-sm text-slate-400 mb-6">Select a subtopic on the topic page to load a practice question.</p>
            <button
              onClick={() => setActiveTab && setActiveTab('picker')}
              className="bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 px-6 rounded-xl transition-all"
            >
              Browse Topics
            </button>
          </div>
        )
      }

      {/* Active Question */}
      {
        !generatingQuestion && quizQuestion && (
          <div className="glass-panel rounded-2xl p-5 md:p-7 border border-slate-800 shadow-xl space-y-5 animate-slide-up">
            {/* Quiz Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <span>{quizQuestion.topic || selectedTopic}</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-violet-400">{quizQuestion.subtopic || selectedSubtopic}</span>
                </div>
                <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${quizQuestion.difficulty === 'easy'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : quizQuestion.difficulty === 'medium'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                  {quizQuestion.difficulty}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500 border border-slate-800/80 rounded-lg px-2.5 py-1 bg-slate-900/30">
                {(quizQuestion.question_type || 'mcq').toUpperCase()}
              </span>
            </div>

            {/* Question Body */}
            <div className="space-y-3">
              <h3 className="text-base md:text-lg font-bold text-white leading-relaxed">
                {quizQuestion.question_type === 'code_trace' ? (
                  (() => {
                    const parts = (quizQuestion.question || '').split('\n')
                    const codeIndex = parts.findIndex(p =>
                      p.startsWith('```') || p.includes('class') || p.includes('def ') ||
                      p.includes('import ') || p.includes('public static') ||
                      p.includes('int main') || p.includes('#include')
                    )
                    if (codeIndex !== -1) {
                      const questionText = parts.slice(0, codeIndex).join('\n')
                      const codeText = parts.slice(codeIndex).join('\n').replace(/```[a-z]*/g, '')
                      return (
                        <div className="space-y-3">
                          <p className="font-bold text-white">{questionText}</p>
                          <pre className="bg-slate-950/80 font-mono text-violet-300 p-4 rounded-xl border border-slate-900 border-l-4 border-l-violet-500 overflow-x-auto whitespace-pre text-xs">
                            <code>{codeText}</code>
                          </pre>
                        </div>
                      )
                    }
                    return quizQuestion.question
                  })()
                ) : (
                  quizQuestion.question
                )}
              </h3>
            </div>

            {/* Answer Area */}
            <div className="space-y-3 pt-2">
              {quizQuestion.question_type === 'mcq' && Array.isArray(quizQuestion.options) && quizQuestion.options.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {quizQuestion.options.map((option) => {
                    const isSelected = userAnswer === option
                    return (
                      <button
                        key={option}
                        disabled={submittedAnswer}
                        onClick={() => setUserAnswer(option)}
                        className={`w-full text-left p-3.5 rounded-xl border text-sm font-semibold transition-all ${submittedAnswer
                          ? option === quizQuestion.correct_answer
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                            : isSelected
                              ? 'bg-red-500/10 border-red-500/50 text-red-400'
                              : 'bg-slate-900/20 border-slate-900/50 text-slate-500'
                          : isSelected
                            ? 'bg-violet-600/10 border-violet-500 text-violet-400'
                            : 'bg-slate-900/30 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <input
                  type="text"
                  disabled={submittedAnswer}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all disabled:opacity-50"
                />
              )}

              {!submittedAnswer && (
                <button
                  onClick={handleSubmit}
                  disabled={!userAnswer.trim()}
                  className="w-full flex items-center justify-center bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </button>
              )}
            </div>

            {/* Feedback Panel */}
            {submittedAnswer && quizFeedback && (
              <div className="border-t border-slate-800/80 pt-5 space-y-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  {quizFeedback.isCorrect ? (
                    <>
                      <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center animate-bounce-in">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      </div>
                      <h4 className="text-base font-bold text-emerald-400">Correct! Great reasoning. +50 XP</h4>
                    </>
                  ) : (
                    <>
                      <div className="h-8 w-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <XCircle className="h-5 w-5 text-red-400" />
                      </div>
                      <h4 className="text-base font-bold text-red-400">Incorrect — let's learn from it. +10 XP</h4>
                    </>
                  )}
                </div>

                <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Correct Answer</span>
                    <p className="text-sm font-bold text-white mt-0.5">{quizQuestion.correct_answer}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Explanation</span>
                    <p className="text-sm text-slate-300 mt-1 leading-relaxed">{quizQuestion.explanation}</p>
                  </div>
                  {quizQuestion.common_mistake && (
                    <div className="border-t border-slate-800/50 pt-3">
                      <span className="text-[10px] font-semibold text-red-400/80 uppercase tracking-wider block">Common Pitfall</span>
                      <p className="text-sm text-slate-400 mt-1 leading-relaxed italic">"{quizQuestion.common_mistake}"</p>
                    </div>
                  )}

                  {/* AI Detailed Explanation */}
                  {loadingAiExplanation && (
                    <div className="border-t border-slate-800/50 pt-3 flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
                      <span className="text-xs text-slate-500">Gemini is preparing a detailed explanation...</span>
                    </div>
                  )}
                  {aiExplanation && (
                    <div className="border-t border-slate-800/50 pt-3">
                      <span className="text-[10px] font-semibold text-violet-400/80 uppercase tracking-wider block flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> AI Analysis
                      </span>
                      <p className="text-sm text-slate-300 mt-1 leading-relaxed">{aiExplanation}</p>
                    </div>
                  )}
                </div>

                {/* Next Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleNext}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold py-3 rounded-xl transition-all text-sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Next Question
                  </button>
                  <button
                    onClick={handleTutor}
                    className="flex-1 flex items-center justify-center gap-2 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 font-semibold py-3 rounded-xl border border-violet-500/20 transition-all text-sm"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Discuss with Tutor
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      }
    </div >
  )
}

