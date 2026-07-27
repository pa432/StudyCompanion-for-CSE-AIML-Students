import React, { useState } from 'react'
import { Layers, RotateCw, ChevronLeft, ChevronRight, Check, X, Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { generateFlashcards } from '../geminiClient'

export default function Flashcards({ selectedTopic, selectedSubtopic }) {
  const [cards, setCards] = useState([
    {
      id: 1,
      front: 'What is Time Complexity?',
      back: 'A measure of the amount of time an algorithm takes to run as a function of the length of the input.',
      mastered: false,
    },
    {
      id: 2,
      front: 'What is Space Complexity?',
      back: 'The total amount of memory space required by an algorithm during execution.',
      mastered: false,
    },
    {
      id: 3,
      front: 'What is Big-O Notation?',
      back: 'A mathematical notation that describes the upper bound limiting behavior of a function when the argument tends towards a particular value or infinity.',
      mastered: false,
    },
  ])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleGenerateCards = async () => {
    if (!selectedTopic || !selectedSubtopic) return
    setLoading(true)
    setIsFlipped(false)
    try {
      const generated = await generateFlashcards(selectedTopic, selectedSubtopic, 6)
      if (generated && generated.length > 0) {
        setCards(generated.map((c, i) => ({ ...c, id: i + 1, mastered: false })))
        setCurrentIndex(0)
      }
    } catch (err) {
      console.error('Flashcards generation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const currentCard = cards[currentIndex] || cards[0]
  const masteredCount = cards.filter((c) => c.mastered).length

  const handleNext = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % cards.length)
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
  }

  const toggleMastered = (status) => {
    setCards((prev) =>
      prev.map((c, i) => (i === currentIndex ? { ...c, mastered: status } : c))
    )
    handleNext()
  }

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6 animate-fade-in pb-12">
      {/* Top Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Interactive Flashcards</h2>
            <p className="text-xs text-slate-400">
              {selectedTopic && selectedSubtopic
                ? `${selectedTopic} → ${selectedSubtopic}`
                : 'Default CS Foundations Deck'}
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateCards}
          disabled={loading || !selectedTopic}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-pink-600/20"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" /> AI Generate Deck
            </>
          )}
        </button>
      </div>

      {/* Progress & Deck Status */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-2">
        <span>
          Card <strong className="text-white">{currentIndex + 1}</strong> of <strong className="text-white">{cards.length}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          Mastered: <strong className="text-emerald-400">{masteredCount}</strong> / {cards.length}
        </span>
      </div>

      {/* 3D Flip Card Container */}
      <div
        className="w-full h-80 cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full duration-500 preserve-3d transition-transform ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between backface-hidden shadow-2xl">
            <div className="flex items-center justify-between text-xs text-pink-400 font-semibold tracking-wider uppercase">
              <span>QUESTION / CONCEPT</span>
              <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                <RotateCw className="h-3 w-3" /> Click to Flip
              </span>
            </div>
            <div className="text-center my-auto">
              <h3 className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                {currentCard?.front}
              </h3>
            </div>
            <div className="text-center text-xs text-slate-500">Tap anywhere to reveal definition</div>
          </div>

          {/* BACK */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl p-8 flex flex-col justify-between backface-hidden rotate-y-180 shadow-2xl">
            <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold tracking-wider uppercase">
              <span>ANSWER / EXPLANATION</span>
              <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                <RotateCw className="h-3 w-3" /> Click to Flip Back
              </span>
            </div>
            <div className="text-center my-auto">
              <p className="text-base md:text-lg text-slate-200 leading-relaxed font-medium">
                {currentCard?.back}
              </p>
            </div>
            <div className="text-center text-xs text-indigo-300/60">Review concepts repeatedly to solidify memory</div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handlePrev}
          className="h-12 w-12 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-center transition-all hover:scale-105"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleMastered(false)}
            className="px-4 py-2.5 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <X className="h-4 w-4" /> Need Review
          </button>
          <button
            onClick={() => toggleMastered(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Check className="h-4 w-4" /> Mastered
          </button>
        </div>

        <button
          onClick={handleNext}
          className="h-12 w-12 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 flex items-center justify-center transition-all hover:scale-105"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
