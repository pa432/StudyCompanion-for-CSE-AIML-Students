import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import {
  BookOpen,
  Award,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Brain,
  Code2,
  Compass,
  HelpCircle,
  Send,
  LogOut,
  RefreshCw,
  Play,
  Loader2,
  AlertCircle
} from 'lucide-react'

export default function App() {
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)

  // Navigation
  const [activeTab, setActiveTab] = useState('picker') // 'picker' | 'practice' | 'chat' | 'dashboard'

  // Topic list & user progress
  const [topics, setTopics] = useState([])
  const [progress, setProgress] = useState([])
  const [loadingData, setLoadingData] = useState(false)

  // Selection state
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [selectedSubtopic, setSelectedSubtopic] = useState(null)
  const [difficulty, setDifficulty] = useState('medium') // 'easy' | 'medium' | 'hard'

  // Quiz state
  const [quizQuestion, setQuizQuestion] = useState(null)
  const [generatingQuestion, setGeneratingQuestion] = useState(false)
  const [userAnswer, setUserAnswer] = useState('')
  const [submittedAnswer, setSubmittedAnswer] = useState(false)
  const [quizFeedback, setQuizFeedback] = useState(null) // { isCorrect, isSaving }

  // Chat state
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [sendingChat, setSendingChat] = useState(false)

  // Setup Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoadingSession(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch topics and progress when session changes or is active
  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    setLoadingData(true)
    try {
      // 1. Fetch seed topics
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .order('name', { ascending: true })

      if (topicsError) throw topicsError
      setTopics(topicsData || [])

      // Set default topic/subtopic if available and none selected
      if (topicsData && topicsData.length > 0 && !selectedTopic) {
        setSelectedTopic(topicsData[0].name)
        setSelectedSubtopic(topicsData[0].subtopic)
      }

      // 2. Fetch user topic progress
      const { data: progressData, error: progressError } = await supabase
        .from('topic_progress')
        .select('*')
        .eq('user_id', session.user.id)

      if (progressError) throw progressError
      setProgress(progressData || [])

    } catch (err) {
      console.error("Error loading data:", err.message)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  // Get edge function url dynamically matching supabase endpoint
  const getEdgeFunctionUrl = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    return supabaseUrl ? `${supabaseUrl}/functions/v1/gemini-chat` : 'http://localhost:54321/functions/v1/gemini-chat'
  }

  // Start Practice Quiz
  const startPractice = async (topicName, subtopicName, forceNew = true) => {
    const tName = topicName || selectedTopic
    const sName = subtopicName || selectedSubtopic
    
    if (topicName && subtopicName) {
      setSelectedTopic(topicName)
      setSelectedSubtopic(subtopicName)
    }

    setGeneratingQuestion(true)
    setQuizQuestion(null)
    setSubmittedAnswer(false)
    setUserAnswer('')
    setQuizFeedback(null)
    setActiveTab('practice')

    try {
      const response = await fetch(getEdgeFunctionUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          mode: 'practice',
          topic: tName,
          subtopic: sName,
          difficulty: difficulty
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate question: ${response.statusText}`)
      }

      const questionData = await response.json()
      setQuizQuestion(questionData)
    } catch (err) {
      console.error(err)
      alert("Error generating practice question. Please check if your Edge Function is running and GEMINI_API_KEY is configured.")
      setActiveTab('picker')
    } finally {
      setGeneratingQuestion(false)
    }
  }

  // Submit Quiz Answer
  const submitAnswer = async () => {
    if (!userAnswer.trim()) return
    setSubmittedAnswer(true)

    const isMcq = quizQuestion.question_type === 'mcq'
    let isCorrect = false

    if (isMcq) {
      isCorrect = userAnswer.trim().toLowerCase() === quizQuestion.correct_answer.trim().toLowerCase()
    } else {
      // Short answer check: lenient string comparison (trimmed, lowercase)
      const cleanUser = userAnswer.trim().toLowerCase().replace(/[\s\(\)\[\]\{\};]/g, '')
      const cleanCorrect = quizQuestion.correct_answer.trim().toLowerCase().replace(/[\s\(\)\[\]\{\};]/g, '')
      isCorrect = cleanUser === cleanCorrect || cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser)
    }

    setQuizFeedback({ isCorrect, isSaving: true })

    try {
      // Save attempt to Supabase attempts table
      const { error } = await supabase.from('attempts').insert({
        user_id: session.user.id,
        topic: quizQuestion.topic,
        subtopic: quizQuestion.subtopic,
        difficulty: quizQuestion.difficulty,
        question_type: quizQuestion.question_type,
        question: quizQuestion,
        user_answer: userAnswer,
        is_correct: isCorrect
      })

      if (error) throw error

      // Refresh progress metrics from DB
      await fetchData()
    } catch (err) {
      console.error("Error saving attempt:", err.message)
    } finally {
      setQuizFeedback(prev => prev ? { ...prev, isSaving: false } : null)
    }
  }

  // Start Chat / Explain Mode
  const startChat = (topicName, subtopicName) => {
    const tName = topicName || selectedTopic
    const sName = subtopicName || selectedSubtopic

    if (topicName && subtopicName) {
      setSelectedTopic(topicName)
      setSelectedSubtopic(subtopicName)
    }

    setChatMessages([
      {
        role: 'assistant',
        content: `Hi there! I'm your patient CS tutor. Let's discuss **${tName} - ${sName}**. What would you like me to explain? You can ask about core concepts, dynamic programming recurrences, complexity analysis, or paste in a code snippet you're struggling to trace.`
      }
    ])
    setActiveTab('chat')
  }

  // Send Chat Message
  const sendChatMessage = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || sendingChat) return

    const userMessage = { role: 'user', content: chatInput }
    const updatedMessages = [...chatMessages, userMessage]
    setChatMessages(updatedMessages)
    setChatInput('')
    setSendingChat(true)

    try {
      const response = await fetch(getEdgeFunctionUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          mode: 'explain',
          messages: updatedMessages
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to chat: ${response.statusText}`)
      }

      const data = await response.json()
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (err) {
      console.error(err)
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I encountered an error communicating with the Gemini API. Please make sure the Edge Function is serving and valid key is set."
      }])
    } finally {
      setSendingChat(false)
    }
  }

  // Group topics by category
  const groupedTopics = topics.reduce((acc, curr) => {
    if (!acc[curr.name]) acc[curr.name] = []
    acc[curr.name].push(curr.subtopic)
    return acc
  }, {})

  // Fetch aggregate accuracy and attempts for subtopics
  const getSubtopicProgress = (topicName, subtopicName) => {
    const prog = progress.find(p => p.topic === topicName && p.subtopic === subtopicName)
    if (!prog) return { total: 0, correct: 0, accuracy: null }
    const accuracy = prog.total_attempts > 0 ? Math.round((prog.correct_attempts / prog.total_attempts) * 100) : null
    return { total: prog.total_attempts, correct: prog.correct_attempts, accuracy }
  }

  if (loadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
          <p className="text-slate-400 font-medium">Booting Study Companion...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Background Gradients */}
      <div className="absolute top-0 right-1/4 h-[40rem] w-[40rem] rounded-full bg-violet-900/10 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 h-[40rem] w-[40rem] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 border border-violet-500/20 text-violet-400">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Study Companion
            </h1>
            <p className="text-xs text-slate-500 font-medium">B.Tech AI/ML Coursework Assistant</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 md:gap-2">
          <button
            onClick={() => setActiveTab('picker')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'picker' ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span className="hidden sm:inline">Topics</span>
          </button>
          <button
            onClick={() => {
              if (quizQuestion) setActiveTab('practice')
              else startPractice(selectedTopic, selectedSubtopic, false)
            }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'practice' ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Practice</span>
          </button>
          <button
            onClick={() => {
              if (chatMessages.length === 0) startChat(selectedTopic, selectedSubtopic)
              else setActiveTab('chat')
            }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'chat' ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Tutor Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'dashboard' ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <span className="hidden lg:inline text-xs text-slate-500 font-mono">{session?.user?.email}</span>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-800 hover:border-red-500/30 hover:bg-red-500/5 text-slate-400 hover:text-red-400 transition-all"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 relative z-10 flex flex-col">
        {loadingData && (
          <div className="mb-4 rounded-xl bg-violet-950/10 border border-violet-900/20 py-2 px-4 flex items-center gap-3 text-xs text-violet-400">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Fetching progress updates...
          </div>
        )}

        {/* 1. TOPIC PICKER SCREEN */}
        {activeTab === 'picker' && (
          <div className="space-y-8 flex-1 animate-fade-in">
            {/* Greeting Header */}
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Personalized Study Planner</h2>
              <p className="text-slate-400">
                Select your coursework topic, difficulty level, and begin practicing or explaining concepts with Gemini.
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Attempts</p>
                  <h3 className="text-3xl font-extrabold text-white mt-1">
                    {progress.reduce((acc, curr) => acc + curr.total_attempts, 0)}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/10 flex items-center justify-center">
                  <Play className="h-5 w-5" />
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Accuracy</p>
                  <h3 className="text-3xl font-extrabold text-white mt-1">
                    {(() => {
                      const total = progress.reduce((acc, curr) => acc + curr.total_attempts, 0)
                      const correct = progress.reduce((acc, curr) => acc + curr.correct_attempts, 0)
                      return total > 0 ? `${Math.round((correct / total) * 100)}%` : '0%'
                    })()}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/10 flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Focus Recommendation</p>
                  <h3 className="text-md font-bold text-violet-400 mt-2 truncate max-w-[200px]">
                    {(() => {
                      if (progress.length === 0) return "Start a practice quiz"
                      // Sort progress to find weakest
                      const sortedProgress = [...progress].sort((a, b) => {
                        const accA = a.correct_attempts / a.total_attempts
                        const accB = b.correct_attempts / b.total_attempts
                        return accA - accB
                      })
                      return sortedProgress[0].subtopic
                    })()}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 flex items-center justify-center">
                  <Brain className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Difficulty Settings */}
            <div className="glass-panel rounded-2xl p-6">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Set Quiz Difficulty</h4>
              <div className="flex gap-4">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider border transition-all ${
                      difficulty === level
                        ? level === 'easy'
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                          : level === 'medium'
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                          : 'bg-red-500/10 border-red-500/50 text-red-400'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.keys(groupedTopics).length === 0 ? (
                <div className="col-span-2 py-20 text-center glass-panel rounded-2xl border border-slate-900 flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-500 mb-3" />
                  <p className="text-slate-400 font-medium">Loading course seeds...</p>
                </div>
              ) : (
                Object.entries(groupedTopics).map(([topicName, subtopics]) => (
                  <div key={topicName} className="glass-panel rounded-2xl p-6 border border-slate-800">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800/80 pb-3">
                      <Code2 className="h-5 w-5 text-violet-400" />
                      {topicName}
                    </h3>
                    <div className="space-y-4">
                      {subtopics.map((sub) => {
                        const prog = getSubtopicProgress(topicName, sub)
                        const isSelected = selectedTopic === topicName && selectedSubtopic === sub
                        return (
                          <div
                            key={sub}
                            onClick={() => {
                              setSelectedTopic(topicName)
                              setSelectedSubtopic(sub)
                            }}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              isSelected
                                ? 'bg-violet-600/10 border-violet-500/40'
                                : 'bg-slate-950/40 border-slate-900 hover:border-slate-800 hover:bg-slate-900/20'
                            }`}
                          >
                            <div className="space-y-1">
                              <p className="font-semibold text-white text-sm md:text-base">{sub}</p>
                              <p className="text-xs text-slate-500">
                                {prog.total > 0 ? (
                                  <>
                                    Accuracy: <span className="font-semibold text-violet-400">{prog.accuracy}%</span> ({prog.total} attempts)
                                  </>
                                ) : (
                                  'Not attempted yet'
                                )}
                              </p>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startPractice(topicName, sub)
                                }}
                                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
                              >
                                <Play className="h-3 w-3" />
                                Practice
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startChat(topicName, sub)
                                }}
                                className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
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
                ))
              )}
            </div>
          </div>
        )}

        {/* 2. PRACTICE/QUIZ VIEW SCREEN */}
        {activeTab === 'practice' && (
          <div className="max-w-3xl w-full mx-auto space-y-6 flex-1 flex flex-col justify-center animate-fade-in">
            {generatingQuestion && (
              <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center border border-slate-900">
                <Loader2 className="h-10 w-10 animate-spin text-violet-500 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Generating personalized quiz...</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  Gemini is analyzing your syllabus for <span className="text-violet-400 font-semibold">{selectedSubtopic}</span> to curate a {difficulty}-level challenge.
                </p>
              </div>
            )}

            {!generatingQuestion && !quizQuestion && (
              <div className="glass-panel rounded-2xl p-8 text-center border border-slate-900">
                <AlertCircle className="h-10 w-10 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No active quiz question</h3>
                <p className="text-sm text-slate-400 mb-6">Select a subtopic on the topic page to load a practice question.</p>
                <button
                  onClick={() => setActiveTab('picker')}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 px-6 rounded-xl transition-all"
                >
                  Browse Topics
                </button>
              </div>
            )}

            {!generatingQuestion && quizQuestion && (
              <div className="glass-panel rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl space-y-6">
                {/* Quiz Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <span>{quizQuestion.topic}</span>
                      <ChevronRight className="h-3 w-3" />
                      <span className="text-violet-400">{quizQuestion.subtopic}</span>
                    </div>
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      quizQuestion.difficulty === 'easy'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : quizQuestion.difficulty === 'medium'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {quizQuestion.difficulty}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-500 border border-slate-800/80 rounded-lg px-2.5 py-1 bg-slate-900/30">
                    {quizQuestion.question_type.toUpperCase()}
                  </span>
                </div>

                {/* Question Render */}
                <div className="space-y-4">
                  <h3 className="text-lg md:text-xl font-bold text-white leading-relaxed">
                    {/* Separate text and code block if question_type is code_trace */}
                    {quizQuestion.question_type === 'code_trace' ? (
                      (() => {
                        const parts = quizQuestion.question.split('\n');
                        const codeIndex = parts.findIndex(p => p.startsWith('```') || p.includes('class') || p.includes('def ') || p.includes('import ') || p.includes('public static') || p.includes('int main') || p.includes('#include'));
                        if (codeIndex !== -1) {
                          const questionText = parts.slice(0, codeIndex).join('\n');
                          const codeText = parts.slice(codeIndex).join('\n').replace(/```[a-z]*/g, '');
                          return (
                            <div className="space-y-4">
                              <p className="font-bold text-white">{questionText}</p>
                              <pre className="bg-slate-950/80 font-mono text-violet-300 p-5 rounded-xl border border-slate-900 border-l-4 border-l-violet-500 overflow-x-auto whitespace-pre text-sm">
                                <code>{codeText}</code>
                              </pre>
                            </div>
                          );
                        }
                        return quizQuestion.question;
                      })()
                    ) : (
                      quizQuestion.question
                    )}
                  </h3>
                </div>

                {/* Answers Fields */}
                <div className="space-y-4 pt-4">
                  {quizQuestion.question_type === 'mcq' ? (
                    <div className="grid grid-cols-1 gap-3">
                      {quizQuestion.options.map((option) => {
                        const isSelected = userAnswer === option
                        return (
                          <button
                            key={option}
                            disabled={submittedAnswer}
                            onClick={() => setUserAnswer(option)}
                            className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition-all ${
                              submittedAnswer
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
                            <span className="inline-block h-6 w-6 rounded-lg bg-slate-950 border border-slate-800 text-center leading-6 text-xs text-slate-400 mr-3">
                              {option.charAt(0) === 'A' || option.charAt(0) === 'B' || option.charAt(0) === 'C' || option.charAt(0) === 'D' ? option.charAt(0) : '•'}
                            </span>
                            {option}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        disabled={submittedAnswer}
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your final answer here..."
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all disabled:opacity-50"
                      />
                    </div>
                  )}

                  {!submittedAnswer && (
                    <button
                      onClick={submitAnswer}
                      disabled={!userAnswer.trim()}
                      className="w-full flex items-center justify-center bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Answer
                    </button>
                  )}
                </div>

                {/* Feedback Panel */}
                {submittedAnswer && quizFeedback && (
                  <div className="border-t border-slate-800/80 pt-6 space-y-4 animate-fade-in">
                    <div className="flex items-center gap-3">
                      {quizFeedback.isCorrect ? (
                        <>
                          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                          <h4 className="text-lg font-bold text-emerald-400">Correct! Great reasoning.</h4>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-6 w-6 text-red-400" />
                          <h4 className="text-lg font-bold text-red-400">Incorrect Answer</h4>
                        </>
                      )}
                    </div>

                    <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-4 space-y-3">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Correct Answer</span>
                        <p className="text-sm font-bold text-white mt-0.5">{quizQuestion.correct_answer}</p>
                      </div>
                      
                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Explanation</span>
                        <p className="text-sm text-slate-300 mt-1 leading-relaxed">{quizQuestion.explanation}</p>
                      </div>

                      {quizQuestion.common_mistake && (
                        <div className="border-t border-slate-800/50 pt-3">
                          <span className="text-xs font-semibold text-red-400/80 uppercase tracking-wider block">Common Pitfall</span>
                          <p className="text-sm text-slate-400 mt-1 leading-relaxed italic">"{quizQuestion.common_mistake}"</p>
                        </div>
                      )}
                    </div>

                    {/* Next actions */}
                    <div className="flex gap-4 pt-2">
                      <button
                        onClick={() => startPractice(quizQuestion.topic, quizQuestion.subtopic)}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold py-3.5 rounded-xl transition-all"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Next Question
                      </button>
                      <button
                        onClick={() => startChat(quizQuestion.topic, quizQuestion.subtopic)}
                        className="flex-1 flex items-center justify-center gap-2 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 font-semibold py-3.5 rounded-xl border border-violet-500/20 transition-all"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Discuss with Tutor
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. CHAT/EXPLAIN TUTOR SCREEN */}
        {activeTab === 'chat' && (
          <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-fade-in h-[calc(100vh-12rem)]">
            {/* Chat Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-violet-600/20 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">CS Classroom Assistant</h3>
                <p className="text-xs text-slate-500">Trained for Python OOP, Dynamic Programming, and Graph Algorithms</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role !== 'user' && (
                    <div className="h-8 w-8 rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/20 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                      TA
                    </div>
                  )}

                  <div className={`max-w-[75%] rounded-2xl px-4 py-3.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-tr-none'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-300 rounded-tl-none'
                  }`}>
                    {/* Render newlines */}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="h-8 w-8 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex-shrink-0 flex items-center justify-center text-xs font-bold font-mono">
                      ME
                    </div>
                  )}
                </div>
              ))}

              {sendingChat && (
                <div className="flex gap-4 justify-start">
                  <div className="h-8 w-8 rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/20 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                    TA
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                    <span className="text-xs text-slate-500 font-medium">Tutor is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={sendChatMessage} className="bg-slate-950 p-4 border-t border-slate-800 flex gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask your question or paste a DP recurrence relation..."
                className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || sendingChat}
                className="bg-violet-600 hover:bg-violet-500 text-white h-11 w-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* 4. PROGRESS DASHBOARD SCREEN */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 flex-1 animate-fade-in">
            {/* Dashboard Title */}
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Performance Dashboard</h2>
              <p className="text-slate-400">
                Track your syllabus coverage and focus on subjects with lower accuracy. We've sorted your coursework weakest-first.
              </p>
            </div>

            {/* Overall Course Stats Card */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 glass-panel rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-around gap-6">
                <div className="text-center md:border-r border-slate-800/80 md:pr-12">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Course Coverage</span>
                  <div className="flex items-baseline justify-center gap-1 mt-2">
                    <span className="text-4xl font-extrabold text-white">
                      {Math.round((progress.length / (topics.length || 1)) * 100)}%
                    </span>
                    <span className="text-xs text-slate-500">({progress.length}/{topics.length} topics)</span>
                  </div>
                </div>

                <div className="text-center md:border-r border-slate-800/80 md:pr-12">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Practices</span>
                  <p className="text-4xl font-extrabold text-white mt-2">
                    {progress.reduce((acc, curr) => acc + curr.total_attempts, 0)}
                  </p>
                </div>

                <div className="text-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Target Proficiency</span>
                  <p className="text-4xl font-extrabold text-emerald-400 mt-2">
                    {(() => {
                      const proficient = progress.filter(p => (p.correct_attempts / p.total_attempts) >= 0.75).length
                      return `${proficient} subtopics`
                    })()}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 rounded-2xl p-6 flex flex-col justify-between">
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-base">Study Tip</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Double down on concepts with less than 60% accuracy. Try practicing at least 3 hard-difficulty questions using Code Trace modes.
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Pick weakest
                    if (progress.length > 0) {
                      const sorted = [...progress].sort((a, b) => (a.correct_attempts/a.total_attempts) - (b.correct_attempts/b.total_attempts))
                      startPractice(sorted[0].topic, sorted[0].subtopic)
                    } else {
                      setActiveTab('picker')
                    }
                  }}
                  className="mt-4 w-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold py-2.5 rounded-lg transition-all"
                >
                  Practice Weakest Topic
                </button>
              </div>
            </div>

            {/* Performance Breakdown - Weakest First */}
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Syllabus Weak-Topic Tracking</h3>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-red-400" />
                  Sorted Weakest-First
                </span>
              </div>

              {progress.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <AlertCircle className="h-8 w-8 mx-auto text-slate-600 mb-3" />
                  <p className="text-sm font-medium">No progress records yet. Start answering quiz questions to populate this dashboard!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {[...progress]
                    .sort((a, b) => {
                      const accA = a.total_attempts > 0 ? (a.correct_attempts / a.total_attempts) : 0
                      const accB = b.total_attempts > 0 ? (b.correct_attempts / b.total_attempts) : 0
                      return accA - accB
                    })
                    .map((item) => {
                      const accuracy = Math.round((item.correct_attempts / item.total_attempts) * 100)
                      return (
                        <div key={`${item.topic}-${item.subtopic}`} className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-900/10 transition-all">
                          <div className="space-y-1 md:max-w-md w-full">
                            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block">{item.topic}</span>
                            <h4 className="text-base font-bold text-white">{item.subtopic}</h4>
                            <div className="flex items-center gap-3 pt-2">
                              <div className="w-full bg-slate-900 rounded-full h-2">
                                <div
                                  style={{ width: `${accuracy}%` }}
                                  className={`h-2 rounded-full ${
                                    accuracy < 50
                                      ? 'bg-red-500'
                                      : accuracy < 75
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                ></div>
                              </div>
                              <span className={`text-xs font-extrabold ${
                                accuracy < 50
                                  ? 'text-red-400'
                                  : accuracy < 75
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}>
                                {accuracy}%
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-8">
                            <div className="text-left md:text-right">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Stats</span>
                              <span className="text-sm font-semibold text-white mt-1 block">
                                {item.correct_attempts}/{item.total_attempts} correct
                              </span>
                            </div>

                            <div className="text-left md:text-right">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Last Active</span>
                              <span className="text-xs text-slate-400 mt-1 block">
                                {new Date(item.last_attempted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => startPractice(item.topic, item.subtopic)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all"
                                title="Practice Topic"
                              >
                                <Play className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => startChat(item.topic, item.subtopic)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-all"
                                title="Discuss with Tutor"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        <p>© 2026 Study Companion. Built for B.Tech AI/ML IgniteX HackFest.</p>
      </footer>
    </div>
  )
}
