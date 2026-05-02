import { useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import QuestionCard from '../components/QuestionCard'
import ScoreScreen from '../components/ScoreScreen'
import NotConfigured from '../components/NotConfigured'

const CATEGORY_COLORS = {
  wine:    { color: '#C4603A', bg: '#FBF0EB' },
  design:  { color: '#7B5EA7', bg: '#F5F0FF' },
  science: { color: '#7A8C6E', bg: '#F2F6EE' },
  culture: { color: '#C4933A', bg: '#FFFBF0' },
}

function formatWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

function startOfWeekISO() {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString()
}

export default function QuizView() {
  const [phase, setPhase] = useState('intro') // intro | questions | score
  const [rows, setRows] = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // question flow
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }
    async function load() {
      setLoading(true)
      const { data, error } = await supabase.from('this_week_quiz').select('*')
      if (error) { setError(error.message); setLoading(false); return }
      setRows(data || [])
      setLoading(false)
    }
    load()
  }, [])

  // Flatten nested questions into a flat list
  function buildQuestions(data) {
    return data.flatMap(row =>
      (row.questions || []).map(q => ({
        fact_id: row.fact_id,
        topic_name: row.topic_name,
        category: row.category,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation,
      }))
    )
  }

  const totalQuestions = rows.reduce((sum, r) => sum + (r.questions?.length || 0), 0)

  function handleStart() {
    const qs = buildQuestions(rows)
    setQuestions(qs)
    setAnswers(new Array(qs.length).fill(null))
    setQIndex(0)
    setSelected(null)
    setShowExplanation(false)
    setPhase('questions')
  }

  function handleSelect(i) {
    setSelected(i)
    setShowExplanation(true)
    setAnswers(prev => { const next = [...prev]; next[qIndex] = i; return next })
  }

  function handleNext() {
    if (qIndex + 1 >= questions.length) {
      markQuizzed()
      setPhase('score')
    } else {
      setQIndex(q => q + 1)
      setSelected(null)
      setShowExplanation(false)
    }
  }

  async function markQuizzed() {
    await supabase
      .from('facts')
      .update({ quizzed: true })
      .gte('sent_at', startOfWeekISO())
  }

  function handleRetry() {
    setPhase('intro')
    setSelected(null)
    setShowExplanation(false)
    setQIndex(0)
    setAnswers([])
  }

  // Unique topics for intro tag cloud
  const uniqueTopics = [...new Map(rows.map(r => [r.topic_name, r.category])).entries()]

  if (!isConfigured) return <NotConfigured />

  if (loading) return (
    <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--ink3)' }}>Loading…</div>
  )
  if (error) return (
    <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--terra)', fontSize: '14px' }}>
      Could not load quiz: {error}
    </div>
  )

  // ── SCORE ──
  if (phase === 'score') {
    return (
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '24px 20px' }}>
        <ScoreScreen questions={questions} answers={answers} onRetry={handleRetry} />
      </div>
    )
  }

  // ── QUESTIONS ──
  if (phase === 'questions') {
    const q = questions[qIndex]
    const cat = CATEGORY_COLORS[q.category] || { color: 'var(--ink3)', bg: 'var(--cream3)' }
    const isLast = qIndex + 1 >= questions.length

    return (
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '16px 20px 32px' }}>
        {/* Progress bar */}
        <div style={{ height: '4px', background: 'var(--cream3)', borderRadius: '2px', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((qIndex + 1) / questions.length) * 100}%`, background: 'var(--terra)', borderRadius: '2px', transition: 'width 0.3s ease' }} />
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: cat.bg, color: cat.color, fontWeight: '500' }}>
            {q.topic_name}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--ink3)' }}>{qIndex + 1} / {questions.length}</span>
        </div>

        <QuestionCard
          question={q.question}
          options={q.options}
          selectedIndex={selected}
          correctIndex={q.correct_index}
          onSelect={handleSelect}
        />

        {showExplanation && (
          <div style={{ marginTop: '16px', padding: '14px 16px', background: 'var(--sage-faint)', border: '0.5px solid var(--sage-light)', borderRadius: '12px', fontSize: '14px', color: 'var(--ink2)', lineHeight: '1.6' }}>
            {q.explanation}
          </div>
        )}

        {showExplanation && (
          <button
            onClick={handleNext}
            style={{ marginTop: '20px', width: '100%', padding: '13px', background: 'var(--terra)', color: '#FFF8F5', borderRadius: '12px', fontSize: '15px', fontWeight: '500' }}
          >
            {isLast ? 'See results' : 'Next question'}
          </button>
        )}
      </div>
    )
  }

  // ── INTRO ──
  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ background: 'var(--cream2)', border: '0.5px solid var(--border)', borderRadius: '20px', padding: '28px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: '8px' }}>
          Weekly Quiz
        </p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--ink)', marginBottom: '4px' }}>
          {formatWeekRange()}
        </h1>

        {rows.length === 0 ? (
          <p style={{ color: 'var(--ink3)', fontSize: '14px', marginTop: '16px' }}>
            No facts delivered this week yet. Come back after today's delivery!
          </p>
        ) : (
          <>
            <p style={{ fontSize: '14px', color: 'var(--ink3)', marginBottom: '20px' }}>
              {totalQuestions} {totalQuestions === 1 ? 'question' : 'questions'} across {uniqueTopics.length} {uniqueTopics.length === 1 ? 'topic' : 'topics'}
            </p>

            {/* Topic pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '28px' }}>
              {uniqueTopics.map(([name, category]) => {
                const c = CATEGORY_COLORS[category] || { color: 'var(--ink3)', bg: 'var(--cream3)' }
                return (
                  <span key={name} style={{ fontSize: '13px', padding: '4px 12px', borderRadius: '20px', background: c.bg, color: c.color, fontWeight: '500' }}>
                    {name}
                  </span>
                )
              })}
            </div>

            <button
              onClick={handleStart}
              style={{ width: '100%', padding: '14px', background: 'var(--terra)', color: '#FFF8F5', borderRadius: '12px', fontSize: '15px', fontWeight: '500' }}
            >
              Start quiz
            </button>
          </>
        )}
      </div>
    </div>
  )
}
