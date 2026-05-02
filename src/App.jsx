import { useState, Component } from 'react'
import QuizView from './views/QuizView'
import TopicsView from './views/TopicsView'

const NAV_TABS = [
  { id: 'quiz', label: 'Quiz' },
  { id: 'topics', label: 'Topics' },
]

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) return (
      <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--terra)', fontSize: '14px' }}>
        Something went wrong: {this.state.error.message}
      </div>
    )
    return this.props.children
  }
}

export default function App() {
  const [activeView, setActiveView] = useState('quiz')

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <header style={{ padding: '12px 20px', background: 'var(--cream3)', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: '500', color: 'var(--ink2)' }}>
          Curiosity Loop
        </span>

        <div style={{ display: 'flex', gap: '2px', background: 'var(--cream3)', padding: '3px', borderRadius: '12px', border: '0.5px solid var(--border2)' }}>
          {NAV_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              style={{
                padding: '6px 16px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                color: activeView === tab.id ? 'var(--ink)' : 'var(--ink3)',
                background: activeView === tab.id ? 'var(--cream)' : 'transparent',
                border: activeView === tab.id ? '0.5px solid var(--border)' : '0.5px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1 }}>
        <ErrorBoundary>
          {activeView === 'quiz' ? <QuizView /> : <TopicsView />}
        </ErrorBoundary>
      </main>
    </div>
  )
}
