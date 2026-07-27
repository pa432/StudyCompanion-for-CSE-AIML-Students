import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { BookOpen, Sparkles, Download, Copy, Check, Loader2, FileText, Bookmark } from 'lucide-react'
import { generateStudyNotes } from '../geminiClient'

const NOTE_CATEGORIES = [
  {
    label: 'Study Styles',
    color: 'text-cyan-400',
    formats: [
      { id: 'comprehensive', label: 'Comprehensive Breakdown', icon: '📖', desc: 'Full topic deep-dive with concepts, code & pitfalls', accent: 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300' },
      { id: 'quick', label: '5-Min Quick Summary', icon: '⏱️', desc: 'Rapid high-level overview for fast revision', accent: 'border-sky-500/50 bg-sky-950/30 text-sky-300' },
      { id: 'story', label: 'Story & Analogy', icon: '🧠', desc: 'Explains concepts via real-world analogies & stories', accent: 'border-indigo-500/50 bg-indigo-950/30 text-indigo-300' },
      { id: 'visual', label: 'Visual / Diagram Style', icon: '🗺️', desc: 'ASCII diagrams, flowcharts & structured visuals', accent: 'border-violet-500/50 bg-violet-950/30 text-violet-300' },
    ],
  },
  {
    label: 'Exam Prep',
    color: 'text-amber-400',
    formats: [
      { id: 'cheatsheet', label: 'Exam Cheat Sheet', icon: '⚡', desc: 'Condensed tables, formulas & key facts', accent: 'border-amber-500/50 bg-amber-950/30 text-amber-300' },
      { id: 'formulas', label: 'Key Terms & Formulas', icon: '🔍', desc: 'Glossary of terms, definitions & complexity tables', accent: 'border-yellow-500/50 bg-yellow-950/30 text-yellow-300' },
      { id: 'comparison', label: 'Compare & Contrast', icon: '⚖️', desc: 'Side-by-side comparison tables of related concepts', accent: 'border-orange-500/50 bg-orange-950/30 text-orange-300' },
      { id: 'mcq_notes', label: 'MCQ-Focused Notes', icon: '🎯', desc: 'Notes written around common exam question patterns', accent: 'border-red-500/50 bg-red-950/30 text-red-300' },
    ],
  },
  {
    label: 'Practice & Application',
    color: 'text-emerald-400',
    formats: [
      { id: 'interview', label: 'Interview Q&A', icon: '💼', desc: 'Top interview questions with model answers', accent: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300' },
      { id: 'code_walkthrough', label: 'Code Walkthrough', icon: '💻', desc: 'Line-by-line code explanation with trace examples', accent: 'border-green-500/50 bg-green-950/30 text-green-300' },
    ],
  },
]

const ALL_FORMATS = NOTE_CATEGORIES.flatMap((c) => c.formats)

export default function StudyNotes({ selectedTopic, selectedSubtopic, onNoteGenerated }) {
  const [selectedFormat, setSelectedFormat] = useState('comprehensive')
  const [notesContent, setNotesContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [savedNotes, setSavedNotes] = useState([])

  const handleGenerate = async () => {
    if (!selectedTopic || !selectedSubtopic) return
    setLoading(true)
    try {
      const generated = await generateStudyNotes(selectedTopic, selectedSubtopic, selectedFormat)
      setNotesContent(generated)
      if (onNoteGenerated) onNoteGenerated()
    } catch (err) {
      console.error('Notes error:', err)
      setNotesContent('Failed to generate study notes. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(notesContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([notesContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTopic}_${selectedSubtopic}_Notes.md`.replace(/\s+/g, '_')
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSaveNote = () => {
    if (!notesContent) return
    const newNote = {
      id: Date.now(),
      title: `${selectedTopic}: ${selectedSubtopic}`,
      format: selectedFormat,
      content: notesContent,
      date: new Date().toLocaleDateString(),
    }
    setSavedNotes([newNote, ...savedNotes])
  }

  return (
    <div className="max-w-5xl w-full mx-auto space-y-6 animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
            <BookOpen className="h-4 w-4" /> AI Note Generator
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {selectedTopic && selectedSubtopic
              ? `${selectedTopic} → ${selectedSubtopic}`
              : 'Select a topic to generate notes'}
          </h2>
          <p className="text-xs text-slate-400">
            Generate high-yield study sheets formatted with markdown, code snippets, and explanations.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !selectedTopic}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-cyan-600/20 whitespace-nowrap"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate Notes
            </>
          )}
        </button>
      </div>

      {/* Format Selector — categorized */}
      <div className="space-y-4">
        {NOTE_CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${cat.color}`}>{cat.label}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {cat.formats.map((fmt) => {
                const isActive = selectedFormat === fmt.id
                return (
                  <button
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all hover:scale-[1.02] ${
                      isActive
                        ? fmt.accent
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <span className="text-lg leading-none">{fmt.icon}</span>
                    <span className="text-[11px] font-bold leading-tight">{fmt.label}</span>
                    {isActive && (
                      <span className="text-[10px] opacity-80 leading-snug">{fmt.desc}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected format description pill */}
      {(() => {
        const active = ALL_FORMATS.find((f) => f.id === selectedFormat)
        return active ? (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-2.5">
            <span className="text-base">{active.icon}</span>
            <span className="font-semibold text-white">{active.label}:</span>
            <span>{active.desc}</span>
          </div>
        ) : null
      })()}

      {/* Notes Display Area */}
      {notesContent ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative">
          {/* Action Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <FileText className="h-4 w-4 text-cyan-400" />
              <span>Markdown Rendered</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" /> Download .md
              </button>
              <button
                onClick={handleSaveNote}
                className="flex items-center gap-1.5 text-xs text-white bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 rounded-lg transition-all"
              >
                <Bookmark className="h-3.5 w-3.5" /> Save Note
              </button>
            </div>
          </div>

          {/* Markdown Content */}
          <div className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const isInline = !className || !match
                  return !isInline && match ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        margin: '1em 0',
                        borderRadius: '0.75rem',
                        fontSize: '0.85rem',
                        background: 'rgba(2, 6, 23, 0.9)',
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {notesContent}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <BookOpen className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-400">No Notes Generated Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click "Generate Notes" above to create custom study materials powered by Gemini AI.
          </p>
        </div>
      )}

      {/* Saved Notes Drawer/List */}
      {savedNotes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-300">Saved Study Notes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => setNotesContent(note.content)}
                className="cursor-pointer bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/30 p-4 rounded-xl space-y-1 transition-all"
              >
                <div className="flex justify-between items-center text-xs text-cyan-400 font-semibold">
                  <span>{note.title}</span>
                  <span className="text-[10px] text-slate-500">{note.date}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{note.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
