import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import Header from './components/Header'
import TopicPicker from './components/TopicPicker'
import Dashboard from './components/Dashboard'
import PracticeQuiz from './components/PracticeQuiz'
import TutorChat from './components/TutorChat'
import StudyNotes from './components/StudyNotes'
import Flashcards from './components/Flashcards'
import PomodoroTimer from './components/PomodoroTimer'
import { generateQuizQuestion, sendTutorChat } from './geminiClient'
import { Loader2, RefreshCw } from 'lucide-react'

export default function App() {
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)

  // Active tab: 'picker' | 'dashboard' | 'quiz' | 'chat' | 'notes' | 'flashcards' | 'pomodoro'
  const [activeTab, setActiveTab] = useState('picker')

  // Topics & DB progress
  const [topics, setTopics] = useState([])
  const [progress, setProgress] = useState([])
  const [loadingData, setLoadingData] = useState(false)

  // Topic selection & difficulty
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [selectedSubtopic, setSelectedSubtopic] = useState(null)


  // Quiz state
  const [quizQuestion, setQuizQuestion] = useState(null)
  const [generatingQuestion, setGeneratingQuestion] = useState(false)
  const [userAnswer, setUserAnswer] = useState('')
  const [submittedAnswer, setSubmittedAnswer] = useState(false)
  const [quizFeedback, setQuizFeedback] = useState(null)

  // Chat state
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [sendingChat, setSendingChat] = useState(false)

  // Local feature stats
  const [notesCreated, setNotesCreated] = useState(0)

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

  // Fetch topics and progress when session is active
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

      if (topicsData && topicsData.length > 0) {
        if (!selectedTopic) {
          setSelectedTopic(topicsData[0].name)
          setSelectedSubtopic(topicsData[0].subtopic)
        }
      } else if (!selectedTopic) {
        setSelectedTopic('Data Structures & Algorithms')
        setSelectedSubtopic('Arrays & Strings')
      }

      // 2. Fetch user topic progress
      const { data: progressData, error: progressError } = await supabase
        .from('topic_progress')
        .select('*')
        .eq('user_id', session.user.id)

      if (progressError) throw progressError
      setProgress(progressData || [])
    } catch (err) {
      console.error('Error loading data:', err.message)
      if (!selectedTopic) {
        setSelectedTopic('Data Structures & Algorithms')
        setSelectedSubtopic('Arrays & Strings')
      }
    } finally {
      setLoadingData(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  // Calculate User Stats
  const totalAttempts = progress.reduce((acc, p) => acc + (p.total_attempts || 0), 0)
  const totalCorrect = progress.reduce((acc, p) => acc + (p.correct_attempts || 0), 0)
  const totalXp = totalCorrect * 50 + totalAttempts * 10
  const level = Math.floor(totalXp / 500) + 1
  const streak = totalAttempts > 0 ? Math.min(30, Math.ceil(totalAttempts / 2)) : 0

  const userStats = {
    streak,
    totalXp,
    level,
    quizzesCompleted: totalAttempts,
    notesCreated,
  }

  // Start Practice Quiz
  const startPractice = async (topicName, subtopicName) => {
    const tName = topicName || selectedTopic || 'Data Structures & Algorithms'
    const sName = subtopicName || selectedSubtopic || 'Arrays & Strings'

    setSelectedTopic(tName)
    setSelectedSubtopic(sName)

    let dynamicDifficulty = 'medium'
    const p = progress.find((item) => item.topic === tName && item.subtopic === sName)
    if (p && p.total_attempts > 0) {
      const accuracy = p.correct_attempts / p.total_attempts
      if (accuracy > 0.8) dynamicDifficulty = 'hard'
      else if (accuracy < 0.4) dynamicDifficulty = 'easy'
    }

    setGeneratingQuestion(true)
    setQuizQuestion(null)
    setSubmittedAnswer(false)
    setUserAnswer('')
    setQuizFeedback(null)
    setActiveTab('quiz')

    try {
      const q = await generateQuizQuestion(tName, sName, dynamicDifficulty)
      setQuizQuestion(q)
    } catch (err) {
      console.error('Quiz generation failed:', err)
      alert('Error generating practice question with Gemini. Please try again.')
      setActiveTab('picker')
    } finally {
      setGeneratingQuestion(false)
    }
  }

  // Submit Answer
  const submitAnswer = async () => {
    if (!userAnswer.trim() || !quizQuestion) return
    setSubmittedAnswer(true)

    const isMcq = quizQuestion.question_type === 'mcq'
    let isCorrect = false

    if (isMcq) {
      isCorrect = userAnswer.trim().toLowerCase() === quizQuestion.correct_answer.trim().toLowerCase()
    } else {
      // Normalize whitespace/punctuation but require an exact match after
      // normalizing — substring matching caused false positives (e.g. a
      // correct answer of "5" matching any answer containing a "5").
      const cleanUser = userAnswer.trim().toLowerCase().replace(/[\s\(\)\[\]\{\};]/g, '')
      const cleanCorrect = quizQuestion.correct_answer.trim().toLowerCase().replace(/[\s\(\)\[\]\{\};]/g, '')
      isCorrect = cleanUser === cleanCorrect
    }

    setQuizFeedback({ isCorrect, isSaving: true })

    try {
      if (session?.user?.id) {
        const { error } = await supabase.from('attempts').insert({
          user_id: session.user.id,
          topic: quizQuestion.topic || selectedTopic,
          subtopic: quizQuestion.subtopic || selectedSubtopic,
          difficulty: quizQuestion.difficulty,
          question_type: quizQuestion.question_type,
          question: quizQuestion,
          user_answer: userAnswer,
          is_correct: isCorrect,
        })
        if (error) throw error
        await fetchData()
      }
    } catch (err) {
      console.error('Error saving attempt to DB:', err.message)
    } finally {
      setQuizFeedback((prev) => (prev ? { ...prev, isSaving: false } : null))
    }
  }

  // Start Chat
  const startChat = (topicName, subtopicName) => {
    const tName = topicName || selectedTopic
    const sName = subtopicName || selectedSubtopic

    if (topicName && subtopicName) {
      setSelectedTopic(topicName)
      setSelectedSubtopic(subtopicName)
    }

    if (chatMessages.length === 0) {
      setChatMessages([
        {
          role: 'assistant',
          content: `Hi there! I'm your Gemini AI Tutor. Let's discuss **${tName || 'Computer Science'} → ${sName || 'General Concepts'}**. What would you like me to explain today? You can ask about code snippets, time complexities, or exam review questions!`,
        },
      ])
    }
    setActiveTab('chat')
  }

  // Send Chat Message
  const sendChatMessage = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || sendingChat) return

    const userMsg = { role: 'user', content: chatInput }
    const newMessages = [...chatMessages, userMsg]
    setChatMessages(newMessages)
    setChatInput('')
    setSendingChat(true)

    try {
      const responseText = await sendTutorChat(newMessages, selectedTopic, selectedSubtopic)
      setChatMessages((prev) => [...prev, { role: 'assistant', content: responseText }])
    } catch (err) {
      console.error('Chat error:', err)
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I ran into an error generating a response. Please check your Gemini API key.',
        },
      ])
    } finally {
      setSendingChat(false)
    }
  }

  if (loadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
          <p className="text-slate-400 font-medium">Loading Study Companion v2.0...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Background Glows */}
      <div className="fixed top-0 right-1/4 h-[40rem] w-[40rem] rounded-full bg-violet-900/10 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/4 h-[40rem] w-[40rem] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userStats={userStats}
        session={session}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 relative z-10 flex flex-col">
        {loadingData && (
          <div className="mb-4 rounded-xl bg-violet-950/20 border border-violet-900/30 py-2 px-4 flex items-center gap-3 text-xs text-violet-400">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Syncing progress with database...
          </div>
        )}

        {activeTab === 'picker' && (
          <TopicPicker
            topics={topics}
            progress={progress}
            selectedTopic={selectedTopic}
            setSelectedTopic={setSelectedTopic}
            selectedSubtopic={selectedSubtopic}
            setSelectedSubtopic={setSelectedSubtopic}

            onStartPractice={(t, s) => startPractice(t, s)}
            onStartChat={(t, s) => startChat(t, s)}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            userStats={userStats}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedTopic={selectedTopic}
            selectedSubtopic={selectedSubtopic}
            progress={progress}
            startPractice={(t, s) => startPractice(t, s)}
          />
        )}

        {activeTab === 'quiz' && (
          <PracticeQuiz
            quizQuestion={quizQuestion}
            generatingQuestion={generatingQuestion}
            userAnswer={userAnswer}
            setUserAnswer={setUserAnswer}
            submittedAnswer={submittedAnswer}
            quizFeedback={quizFeedback}
            onSubmitAnswer={submitAnswer}
            onNextQuestion={() => startPractice(selectedTopic, selectedSubtopic)}
            onAskTutor={(t, s) => startChat(t, s)}
            selectedTopic={selectedTopic}
            selectedSubtopic={selectedSubtopic}

          />
        )}

        {activeTab === 'chat' && (
          <TutorChat
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            sendChatMessage={sendChatMessage}
            sendingChat={sendingChat}
            selectedTopic={selectedTopic}
            selectedSubtopic={selectedSubtopic}
            onClearChat={() =>
              setChatMessages([
                {
                  role: 'assistant',
                  content: `Chat cleared! What shall we focus on next in **${selectedTopic}**?`,
                },
              ])
            }
          />
        )}

        {activeTab === 'notes' && (
          <StudyNotes
            selectedTopic={selectedTopic}
            selectedSubtopic={selectedSubtopic}
            onNoteGenerated={() => setNotesCreated((prev) => prev + 1)}
          />
        )}

        {activeTab === 'flashcards' && (
          <Flashcards
            selectedTopic={selectedTopic}
            selectedSubtopic={selectedSubtopic}
          />
        )}

        {activeTab === 'pomodoro' && <PomodoroTimer />}
      </main>
    </div>
  )
}
