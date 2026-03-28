import { useMemo } from 'react'
import { useAgentAnimationStore } from '../../stores/agentAnimationStore'

// ASCII art faces for different mood levels
const FACES = [
  { min: 0, face: '(×_×)', label: 'CRITICAL', color: '#ff0033' },
  { min: 20, face: '(·_·)', label: 'LOW', color: '#ff0033' },
  { min: 40, face: '(·‿·)', label: 'NOMINAL', color: '#00b300' },
  { min: 60, face: '(^‿^)', label: 'GOOD', color: '#00ff41' },
  { min: 80, face: '(★‿★)', label: 'OPTIMAL', color: '#00ff41' },
]

const MESSAGES = {
  0: [
    '> system.status: CRITICAL',
    '> no tasks done. no habits. high smoke.',
    '> recommendation: start small. one task.',
  ],
  20: [
    '> system.status: LOW_POWER',
    '> progress detected but minimal.',
    '> recommendation: complete one more habit.',
  ],
  40: [
    '> system.status: NOMINAL',
    '> acceptable output. room for improvement.',
    '> keep pushing. you can do more.',
  ],
  60: [
    '> system.status: GOOD',
    '> solid productivity. habits on track.',
    '> recommendation: maintain current trajectory.',
  ],
  80: [
    '> system.status: OPTIMAL',
    '> excellent output. all systems green.',
    '> you are operating at peak efficiency.',
  ],
}

export default function MoodAgent({ tasksCompleted, totalTasks, habitsCompleted, totalHabits, weedGrams }) {
  const animation = useAgentAnimationStore((s) => s.animation)
  const animFace = useAgentAnimationStore((s) => s.face)
  const score = useMemo(() => {
    let s = 0

    // Task completion (0-40 points)
    if (totalTasks > 0) {
      s += (tasksCompleted / totalTasks) * 40
    } else {
      s += 20 // neutral if no tasks
    }

    // Habit completion (0-40 points)
    if (totalHabits > 0) {
      s += (habitsCompleted / totalHabits) * 40
    } else {
      s += 20 // neutral if no habits
    }

    // Weed penalty (0-20 points, less = better)
    if (weedGrams === 0) {
      s += 20
    } else if (weedGrams <= 0.25) {
      s += 15
    } else if (weedGrams <= 0.5) {
      s += 10
    } else if (weedGrams <= 1) {
      s += 5
    }
    // >1g = 0 bonus points

    return Math.min(100, Math.round(s))
  }, [tasksCompleted, totalTasks, habitsCompleted, totalHabits, weedGrams])

  const mood = useMemo(() => {
    let current = FACES[0]
    for (const f of FACES) {
      if (score >= f.min) current = f
    }
    return current
  }, [score])

  const messages = useMemo(() => {
    let key = 0
    for (const k of Object.keys(MESSAGES).map(Number).sort((a, b) => a - b)) {
      if (score >= k) key = k
    }
    return MESSAGES[key]
  }, [score])

  // Build segmented blocks for the score bar
  const totalBlocks = 10
  const filledBlocks = Math.round((score / 100) * totalBlocks)

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderTop: '2px solid #1a6b1a',
        borderLeft: '2px solid #1a6b1a',
        borderRight: '2px solid #003300',
        borderBottom: '2px solid #003300',
        padding: '12px',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <div className="mood-agent-layout">
        {/* Face */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div
            key={animation}
            className={animation ? `agent-${animation}` : ''}
            style={{
              fontSize: '28px',
              lineHeight: 1,
              color: mood.color,
              textShadow: `0 0 8px ${mood.color}`,
              marginBottom: '4px',
              display: 'inline-block',
            }}
          >
            {animFace ?? mood.face}
          </div>
          <div
            style={{
              fontSize: '9px',
              color: mood.color,
              letterSpacing: '1px',
            }}
          >
            {animation ? animation.toUpperCase() : `[${mood.label}]`}
          </div>
        </div>

        {/* Messages + Score */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '10px', color: 'var(--text-ghost)', marginBottom: '6px' }}>
            // AGENT_MOOD v1.0
          </div>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                fontSize: '11px',
                color: i === 0 ? mood.color : 'var(--text-dim)',
                marginBottom: '2px',
                wordBreak: 'break-word',
              }}
            >
              {msg}
            </div>
          ))}

          {/* Score bar */}
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-ghost)' }}>SCORE</span>
            <div
              style={{
                display: 'flex',
                gap: '2px',
                flex: 1,
                borderTop: '2px solid #003300',
                borderLeft: '2px solid #003300',
                borderRight: '2px solid #1a6b1a',
                borderBottom: '2px solid #1a6b1a',
                background: '#000',
                padding: '2px',
                height: '14px',
                alignItems: 'center',
              }}
            >
              {Array.from({ length: totalBlocks }, (_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: '100%',
                    background: i < filledBlocks ? mood.color : '#003300',
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: '11px', color: mood.color, fontWeight: 'bold', minWidth: '28px', textAlign: 'right' }}>
              {score}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
