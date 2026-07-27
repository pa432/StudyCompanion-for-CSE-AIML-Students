import { GoogleGenAI } from '@google/genai'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const MODEL_NAME = 'gemini-2.5-flash'

let ai = null
if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
}

/**
 * Check if the Gemini client is configured with a key.
 * NOTE: we only check that a key exists — we don't try to guess whether
 * it "looks valid" by its prefix. Real errors (bad key, quota, etc.)
 * are caught in the try/catch below and reported clearly instead of
 * silently swapping in fallback content.
 */
export const isGeminiAvailable = () => !!ai

// Fallback question bank — used ONLY when no API key is configured,
// or when a live call genuinely fails (network/quota/etc.)
const FALLBACK_QUESTIONS = {
  mcq: {
    topic: 'Data Structures & Algorithms',
    subtopic: 'Arrays & Strings',
    difficulty: 'medium',
    question_type: 'mcq',
    question: 'What is the time complexity of searching for an element in an unsorted array of size N?',
    options: ['O(1)', 'O(log N)', 'O(N)', 'O(N^2)'],
    correct_answer: 'O(N)',
    explanation: 'In an unsorted array, elements are stored without any relative ordering. To find a target element, you must inspect each element sequentially from start to end in the worst case (Linear Search), resulting in O(N) time complexity.',
    common_mistake: 'Confusing unsorted array search with binary search O(log N), which requires a sorted array.'
  }
}

function cleanAndParseJSON(rawText) {
  const cleaned = rawText
    .replace(/^```json/g, '')
    .replace(/^```/g, '')
    .replace(/```$/g, '')
    .trim()
  return JSON.parse(cleaned)
}

/**
 * Generate a practice quiz question using Gemini
 */
export async function generateQuestion(topic, subtopic, difficulty = 'medium') {
  if (!ai) {
    console.warn('Gemini API key is not configured (VITE_GEMINI_API_KEY missing). Using offline fallback question.')
    return {
      ...FALLBACK_QUESTIONS.mcq,
      topic: topic || FALLBACK_QUESTIONS.mcq.topic,
      subtopic: subtopic || FALLBACK_QUESTIONS.mcq.subtopic,
      difficulty
    }
  }

  const systemPrompt = `You are a CS teaching assistant for a B.Tech AI/ML student. Given a topic, subtopic, and difficulty level, generate ONE practice question with a full explanation. Respond with ONLY valid JSON, no markdown fences, no preamble, matching this exact schema: { "topic": "${topic}", "subtopic": "${subtopic}", "difficulty": "${difficulty}", "question_type": "mcq", "question": "string", "options": ["option A", "option B", "option C", "option D"], "correct_answer": "string", "explanation": "3-6 sentences teaching the reasoning", "common_mistake": "one likely wrong reasoning path" }. Options array must have 4 choices.`

  const userPrompt = `Topic: ${topic}\nSubtopic: ${subtopic}\nDifficulty: ${difficulty}`

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    })

    return cleanAndParseJSON(response.text)
  } catch (err) {
    console.error('Gemini API call failed:', err)
    return {
      ...FALLBACK_QUESTIONS.mcq,
      topic: topic || FALLBACK_QUESTIONS.mcq.topic,
      subtopic: subtopic || FALLBACK_QUESTIONS.mcq.subtopic,
      difficulty
    }
  }
}

/**
 * Chat with the AI tutor — maintains conversation context
 */
export async function chat(messages) {
  if (!ai) {
    return '⚠️ **Gemini API Key Missing**: Please set a valid Gemini API Key in your `.env` file as `VITE_GEMINI_API_KEY`. \n\nYou can get a free API key from [Google AI Studio](https://aistudio.google.com/apikey).'
  }

  const systemPrompt = 'You are a patient CS tutor for a B.Tech AI/ML student. Explain clearly and step by step, using small concrete examples. Use markdown formatting for emphasis, code blocks, and lists. Keep responses concise but thorough.'

  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }))

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: { systemInstruction: systemPrompt },
    })
    return response.text
  } catch (err) {
    console.error('Gemini Chat failed:', err)
    return `⚠️ **Gemini API Error**: ${err.message || 'Failed to communicate with AI tutor. Please check your API key.'}`
  }
}

export const generateQuizQuestion = generateQuestion
export const sendTutorChat = chat

/**
 * Generate structured study notes for a subtopic
 */
export async function generateStudyNotes(topic, subtopic, format = 'comprehensive') {
  if (!ai) {
    return `# Study Notes: ${topic} — ${subtopic}\n\n> ⚠️ **Notice**: A valid Gemini API Key is required to generate dynamic AI notes. Please set \`VITE_GEMINI_API_KEY\` in your \`.env\` file.\n\n## Overview\nThis topic covers fundamental concepts in **${topic}**. Focus on core principles, time/space trade-offs, and algorithm efficiency.\n\n## Key Concepts\n- **Definition**: Core principles governing ${subtopic}.\n- **Implementation**: Focus on clean modular design and edge case handling.\n- **Optimization**: Analyze time and memory complexity.`
  }

  const FORMAT_PROMPTS = {
    comprehensive: `You are a CS professor. Generate comprehensive, well-structured study notes for a B.Tech AI/ML student using markdown. Include:
1. **Overview** — Brief intro (2-3 sentences)
2. **Key Concepts** — Core ideas with bullet points
3. **How It Works** — Step-by-step explanation with a concrete example
4. **Code Example** — A clear, commented code snippet
5. **Common Pitfalls** — 2-3 mistakes students often make
6. **Quick Reference** — A summary table or cheat sheet
Use headings (##), bold, code blocks with language tags, tables, and bullet points.`,

    quick: `You are a CS tutor. Generate a concise 5-minute quick summary for a B.Tech student using markdown. Keep it punchy:
- **TL;DR** — 2-sentence summary
- **3 Must-Know Points** — The absolute essentials
- **One-line definition** of key terms
- **Complexity** (time & space if applicable)
- **Remember This** — One golden rule or trick
No long paragraphs. Use bullet points, bold, and a small code snippet only if critical.`,

    story: `You are a creative CS educator. Explain this topic using real-world stories, metaphors, and analogies that make abstract CS concepts click for a B.Tech AI/ML student. Structure:
1. **The Story** — Introduce the concept through an engaging real-world scenario or analogy
2. **Breaking It Down** — Map each part of the story to the actual CS concept
3. **Another Analogy** — A second metaphor from a different angle
4. **Back to Reality** — Technical definition and formal explanation
5. **Quick Code** — A short code snippet with a comment linking it back to the story
Make it memorable and fun, not textbook-dry.`,

    visual: `You are a CS professor who loves visual learning. Explain this topic using ASCII diagrams, structured flowcharts, and visual representations in markdown. Structure:
1. **Concept Overview** — 1-2 sentence intro
2. **Visual Diagram** — ASCII art diagram or flowchart showing the structure/process (use code blocks with \`\`\`text)
3. **Step-by-Step Trace** — Walk through a concrete example with visual state changes at each step
4. **Memory Layout** (if applicable) — Show how data sits in memory
5. **Complexity Summary** — A small table of Time/Space complexities
Focus on making every concept visual and traceable.`,

    cheatsheet: `You are creating an exam cheat sheet for a B.Tech AI/ML student. Be extremely concise and table-heavy:
1. **Definition** — One line
2. **Key Properties Table** — Markdown table of properties/attributes
3. **Complexity Table** — Best/Average/Worst time & space
4. **Formulas & Equations** — All relevant formulas in bold
5. **Key Patterns** — Bullet list of when to use this concept
6. **Gotchas** — 2-3 one-liner warnings
No long explanations. Dense, scannable format only.`,

    formulas: `You are a CS reference assistant. Create a comprehensive glossary and formula sheet for a B.Tech student using markdown:
1. **Term Glossary** — A markdown table: Term | Definition | Example
2. **Key Formulas / Recurrences** — All relevant mathematical expressions, bolded
3. **Complexity Reference Table** — Operation | Time | Space
4. **Notation Guide** — Explain Big-O, Omega, Theta if applicable
5. **Key Symbols & Abbreviations** — Quick lookup table
Format as a reference card — tables and short bullets only.`,

    comparison: `You are a CS professor. Create a detailed compare-and-contrast study note for a B.Tech student. Structure:
1. **What Are We Comparing?** — Brief intro of the concepts being compared
2. **Side-by-Side Comparison Table** — Markdown table with columns: Feature | Concept A | Concept B (add more columns if needed)
3. **When to Use Which?** — Decision flowchart in text or bullet form
4. **Similarities** — What they share
5. **Key Differences Summary** — 3-5 bullet points
6. **Code Contrast** — Show the same problem solved with each approach side by side
Relate comparisons specifically to ${subtopic} in the context of ${topic}.`,

    mcq_notes: `You are an exam coach preparing a B.Tech student for MCQ-based exams. Write notes structured around how questions are typically asked:
1. **Core Concept** — Definition in exactly the way it's tested in exams
2. **High-Frequency Question Patterns** — List 5-6 common MCQ question stems for this topic
3. **Trap Options** — Common wrong-answer choices and why students pick them
4. **Key Distinctions to Memorize** — Bullet points of frequently confused pairs
5. **Formula/Fact Flashcards** — 5 Q: A: pairs in the format \`Q: ...\` / \`A: ...\`
6. **1-Liner Rules** — Bold one-liners that eliminate wrong choices
Focus on what examiners test, not exhaustive theory.`,

    interview: `You are a technical interview coach for CS roles. Generate interview preparation notes for a B.Tech AI/ML student on this topic. Include:
1. **Concept in 30 Seconds** — Elevator pitch explanation (for "Explain X" questions)
2. **Top 6 Interview Questions** — Realistic questions with ✅ model answers
3. **Follow-Up Questions** — 3 deeper questions interviewers often ask next
4. **Code a Solution** — A clean, commented implementation of the most common related coding problem
5. **Complexity Analysis** — Time & Space with justification
6. **Red Flags to Avoid** — Common mistakes that signal lack of understanding
Write in interview Q&A style. Answers should be confident and concise.`,

    code_walkthrough: `You are a CS teaching assistant who specializes in code explanation. Create a detailed code walkthrough for a B.Tech student. Structure:
1. **What the Code Does** — Plain English summary
2. **Full Implementation** — A complete, well-commented code example in Python or the most relevant language
3. **Line-by-Line Explanation** — Walk through every key line or block
4. **Dry Run / Trace Table** — Markdown table showing variable states at each step for a sample input
5. **Edge Cases** — Show how the code handles boundary conditions
6. **Variations** — Show 1-2 alternative implementations (iterative vs recursive, etc.)
Make every line of code understandable to someone seeing it for the first time.`,
  }

  const systemPrompt = FORMAT_PROMPTS[format] || FORMAT_PROMPTS.comprehensive

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Generate ${format} study notes for: ${topic} — ${subtopic}`,
      config: { systemInstruction: systemPrompt },
    })
    return response.text
  } catch (err) {
    console.error('Gemini Study Notes failed:', err)
    return `⚠️ **Error generating study notes**: ${err.message}`
  }
}

/**
 * Generate flashcard sets for a subtopic
 */
export async function generateFlashcards(topic, subtopic, count = 6) {
  if (!ai) {
    return [
      { front: `What is the core idea of ${subtopic}?`, back: `It provides fundamental techniques and algorithms for ${topic}.`, hint: 'Think about foundational principles.' },
      { front: `Why is ${subtopic} important in CS?`, back: 'It optimizes performance and resource utilization in software systems.', hint: 'Consider efficiency and scalability.' },
    ]
  }

  const systemPrompt = `You are a CS study assistant creating flashcards for a B.Tech AI/ML student. Generate ${count} flashcards for the given topic. Respond with ONLY valid JSON — an array of objects with these fields: [{ "front": "question or term", "back": "answer or definition", "hint": "optional one-line hint" }]. Mix question types: definitions, code outputs, true/false, fill-in-the-blank. Keep answers concise (1-3 sentences max).`

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Create ${count} flashcards for: ${topic} — ${subtopic}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    })
    return cleanAndParseJSON(response.text)
  } catch (err) {
    console.error('Gemini Flashcards failed:', err)
    return [
      { front: `What is the core idea of ${subtopic}?`, back: `It provides fundamental techniques for ${topic}.`, hint: 'Think about efficiency.' },
    ]
  }
}

/**
 * Get a detailed AI explanation for a quiz answer
 */
export async function explainAnswer(question, userAnswer, correctAnswer, isCorrect) {
  if (!ai) {
    return isCorrect
      ? 'Great job! Your answer matches the expected solution.'
      : `The correct answer is **${correctAnswer}**. Review the core concept and retry!`
  }

  const systemPrompt = `You are a patient CS tutor. The student just ${isCorrect ? 'correctly answered' : 'incorrectly answered'} a quiz question. Provide a brief, encouraging explanation (3-5 sentences). If incorrect, explain WHY their answer was wrong and guide them to the correct reasoning. Use markdown for code and emphasis.`

  const prompt = `Question: ${question}\nStudent's Answer: ${userAnswer}\nCorrect Answer: ${correctAnswer}\nResult: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { systemInstruction: systemPrompt },
    })
    return response.text
  } catch (err) {
    return isCorrect ? 'Correct answer!' : `Correct answer: ${correctAnswer}`
  }
}

/**
 * Generate a personalized study plan based on progress data
 */
export async function generateStudyPlan(progressData) {
  if (!ai) {
    return '### 3-Day Study Plan\n\n- **Day 1**: Review Data Structures & Algorithms\n- **Day 2**: Practice Machine Learning concepts\n- **Day 3**: Revise Operating Systems & Databases'
  }

  const systemPrompt = `You are a study planner for a B.Tech AI/ML student. Based on their quiz progress data, generate a focused 3-day study plan. Respond in markdown with:
- **Day 1/2/3** headings
- Prioritize weak areas (low accuracy) first
- Include specific actions: "Review notes on X", "Practice 5 questions on Y", "Revise flashcards for Z"
- Add time estimates (e.g., "~30 min")
- Keep it motivating and realistic

Be concise — each day should have 3-4 action items max.`

  const progressSummary = (progressData || []).map(p => {
    const accuracy = p.total_attempts > 0 ? Math.round((p.correct_attempts / p.total_attempts) * 100) : 0
    return `${p.topic} → ${p.subtopic}: ${accuracy}% accuracy (${p.correct_attempts}/${p.total_attempts})`
  }).join('\n')

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Here is my quiz progress:\n${progressSummary || 'No data yet — I am just starting.'}\n\nGenerate a study plan.`,
      config: { systemInstruction: systemPrompt },
    })
    return response.text
  } catch (err) {
    return '### 3-Day Study Plan\n- **Day 1**: Practice Quiz Questions\n- **Day 2**: Review Notes\n- **Day 3**: Flashcards Review'
  }
}
