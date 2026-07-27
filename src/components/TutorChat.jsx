import React, { useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Brain, Loader2, Send, Sparkles, Trash2 } from 'lucide-react'

const QUICK_PROMPTS = [
  'Explain with a simple example',
  'Show me the time complexity',
  'Write pseudocode for this',
  'What are the edge cases?',
  'Compare with a similar concept',
]

export default function TutorChat({
  chatMessages,
  chatInput,
  setChatInput,
  sendChatMessage,
  sendingChat,
  selectedTopic,
  selectedSubtopic,
  onClearChat,
}) {
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, sendingChat])

  const handleQuickPrompt = (prompt) => {
    setChatInput(prompt)
    inputRef.current?.focus()
  }

  return (
    <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-fade-in h-[calc(100vh-10rem)]">
      {/* Chat Header */}
      <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-violet-600/20 border border-violet-500/20 text-violet-400 flex items-center justify-center">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Gemini Tutor
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-slate-500">
              {selectedTopic && selectedSubtopic
                ? `Discussing ${selectedTopic} → ${selectedSubtopic}`
                : 'Ask me anything about your coursework'
              }
            </p>
          </div>
        </div>
        {chatMessages.length > 1 && (
          <button
            onClick={onClearChat}
            className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-red-400 transition-all bg-slate-900/50 border border-slate-800 hover:border-red-500/20 rounded-lg px-2.5 py-1.5"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Quick Prompts */}
      {chatMessages.length <= 1 && (
        <div className="px-5 py-3 border-b border-slate-800/50 flex gap-2 overflow-x-auto no-scrollbar">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleQuickPrompt(prompt)}
              className="flex-shrink-0 text-[10px] font-medium text-slate-400 bg-slate-900/60 border border-slate-800 hover:border-violet-500/30 hover:text-violet-400 rounded-lg px-3 py-1.5 transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
        {chatMessages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {msg.role !== 'user' && (
              <div className="h-7 w-7 rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/20 flex-shrink-0 flex items-center justify-center">
                <Sparkles className="h-3 w-3" />
              </div>
            )}

            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-violet-600 text-white rounded-tr-sm'
                : 'bg-slate-900/80 border border-slate-800 text-slate-300 rounded-tl-sm'
            }`}>
              {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
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
                              margin: '0.5em 0',
                              borderRadius: '0.75rem',
                              fontSize: '0.8rem',
                              background: 'rgba(2, 6, 23, 0.8)',
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
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="h-7 w-7 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex-shrink-0 flex items-center justify-center text-[10px] font-bold font-mono">
                ME
              </div>
            )}
          </div>
        ))}

        {sendingChat && (
          <div className="flex gap-3 justify-start animate-fade-in">
            <div className="h-7 w-7 rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/20 flex-shrink-0 flex items-center justify-center">
              <Sparkles className="h-3 w-3" />
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
              <span className="text-[11px] text-slate-500 font-medium">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={sendChatMessage} className="bg-slate-950 p-3.5 border-t border-slate-800 flex gap-2.5">
        <input
          ref={inputRef}
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask about concepts, code traces, complexity..."
          className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
        />
        <button
          type="submit"
          disabled={!chatInput.trim() || sendingChat}
          className="bg-violet-600 hover:bg-violet-500 text-white h-10 w-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
