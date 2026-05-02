import { useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import TopicItem from '../components/TopicItem'
import AddTopicForm from '../components/AddTopicForm'
import NotConfigured from '../components/NotConfigured'

const CATEGORY_ORDER = ['wine', 'design', 'science', 'culture']

const CATEGORY_COLORS = {
  wine:    '#C4603A',
  design:  '#7B5EA7',
  science: '#7A8C6E',
  culture: '#C4933A',
}

export default function TopicsView() {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadTopics() {
    const { data, error } = await supabase.from('topics_with_stats').select('*').order('name')
    if (error) { setError(error.message); return }
    setTopics(data || [])
  }

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }
    loadTopics().finally(() => setLoading(false))
  }, [])

  async function handlePause(id) {
    setTopics(prev => prev.map(t => t.id === id ? { ...t, paused: true } : t))
    await supabase.from('topics').update({ paused: true }).eq('id', id)
  }

  async function handleResume(id) {
    setTopics(prev => prev.map(t => t.id === id ? { ...t, paused: false } : t))
    await supabase.from('topics').update({ paused: false }).eq('id', id)
  }

  async function handleRename(id, name) {
    setTopics(prev => prev.map(t => t.id === id ? { ...t, name } : t))
    await supabase.from('topics').update({ name }).eq('id', id)
  }

  async function handleDelete(id) {
    setTopics(prev => prev.filter(t => t.id !== id))
    await supabase.from('topics').delete().eq('id', id)
  }

  async function handleAdd(name, category) {
    const { data, error } = await supabase
      .from('topics')
      .insert({ name, category, paused: false })
      .select()
      .single()
    if (!error && data) {
      setTopics(prev => [...prev, { ...data, fact_count: 0 }])
    }
  }

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = topics.filter(t => t.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  if (!isConfigured) return <NotConfigured />

  if (loading) return (
    <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--ink3)' }}>Loading…</div>
  )
  if (error) return (
    <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--terra)', fontSize: '14px' }}>
      Could not load topics: {error}
    </div>
  )

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '24px 20px 48px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--ink)', marginBottom: '24px' }}>
        Topics
      </h1>

      {Object.keys(grouped).length === 0 && (
        <p style={{ color: 'var(--ink3)', fontSize: '14px', marginBottom: '32px' }}>No topics yet. Add one below.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '40px' }}>
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CATEGORY_COLORS[cat] }} />
              <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                {cat}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {items.map(topic => (
                <TopicItem
                  key={topic.id}
                  topic={topic}
                  onPause={handlePause}
                  onResume={handleResume}
                  onRename={handleRename}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '20px', background: 'var(--cream2)', border: '0.5px solid var(--border)', borderRadius: '16px' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink3)', marginBottom: '12px' }}>Add a topic</p>
        <AddTopicForm onAdd={handleAdd} />
      </div>
    </div>
  )
}
