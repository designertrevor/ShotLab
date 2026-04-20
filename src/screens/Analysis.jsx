import { useState } from 'react'

const C = {
  bg: '#000', surface: '#1a1a1a', surface2: '#262626',
  border: 'rgba(255,255,255,0.12)', text: '#fff', text2: '#999', text3: '#555',
  bebas: "'Bebas Neue', sans-serif", sans: "'DM Sans', sans-serif",
}

function toParStr(n) {
  if (n === 0) return 'E'
  return n > 0 ? `+${n}` : String(n)
}

function computeRoundStats(round, course) {
  const totalScore = round.holes.reduce((s, h) => s + h.score, 0)
  const coursePar = round.holes.reduce((s, h) => s + (course.holes[h.hole - 1]?.par ?? 0), 0)
  const toPar = totalScore - coursePar
  const totalPutts = round.holes.reduce((s, h) => s + h.putts, 0)

  let teeShots = 0, fairwaysHit = 0, approachShots = 0, girCount = 0

  for (const hs of round.holes) {
    const holePar = course.holes[hs.hole - 1]?.par ?? 4
    for (const shot of hs.shots) {
      if (shot.type === 'tee' && holePar >= 4) {
        teeShots++
        if (shot.result?.includes('Fairway ✓')) fairwaysHit++
      }
      if (shot.type === 'approach') {
        approachShots++
        if (shot.result?.includes('GIR ✓')) girCount++
      }
    }
  }

  const firStr = teeShots ? `${fairwaysHit}/${teeShots}` : '—'
  const girStr = approachShots ? `${girCount}/${round.holes.length}` : '—'

  return { totalScore, toPar, totalPutts, firStr, girStr }
}

export default function Analysis({ round, course, onDone }) {
  const [analyzing, setAnalyzing] = useState(false)
  const stats = computeRoundStats(round, course)
  const dateStr = new Date(round.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const scorecard = round.holes.map(hs => ({
    hole: hs.hole,
    par: course.holes[hs.hole - 1]?.par ?? 4,
    score: hs.score,
    putts: hs.putts,
  }))

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      maxWidth: 430, margin: '0 auto', background: C.bg, color: C.text,
      fontFamily: C.sans, overflow: 'hidden',
    }}>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', flexShrink: 0 }}>
        <button onClick={onDone} style={{ fontSize: 17, color: C.text, fontFamily: C.sans, background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>
        <span style={{ fontSize: 17, fontWeight: 600 }}>Round Analysis</span>
        <div style={{ width: 60 }} />
      </div>

      {/* Scrollable */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Hero */}
        <div style={{ padding: '12px 24px 24px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, color: C.text3, marginBottom: 8 }}>{course.name} · {dateStr} · {round.tees.charAt(0).toUpperCase() + round.tees.slice(1)} Tees</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <div style={{ fontFamily: C.bebas, fontSize: 96, lineHeight: 1 }}>{stats.totalScore}</div>
            <div style={{ fontFamily: C.bebas, fontSize: 44, color: C.text2, lineHeight: 1 }}>{toParStr(stats.toPar)}</div>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
          {[
            { num: stats.totalPutts, lbl: 'Putts' },
            { num: stats.firStr, lbl: 'Fairways' },
            { num: stats.girStr, lbl: 'GIR' },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', padding: '24px 0',
              borderLeft: i > 0 ? `1px solid ${C.border}` : 'none',
            }}>
              <div style={{ fontFamily: C.bebas, fontSize: 44, lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.text3, marginTop: 4 }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* AI Analysis card */}
        <div style={{ padding: '28px 24px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.text3, marginBottom: 14 }}>AI Analysis</div>
          <div style={{ background: C.surface, borderRadius: 16, padding: 24 }}>
            {analyzing ? (
              <div style={{ fontSize: 15, color: C.text3, lineHeight: 1.6 }}>Analyzing your round…</div>
            ) : (
              <>
                <div style={{ fontSize: 15, color: C.text2, lineHeight: 1.65, marginBottom: 20, fontWeight: 300 }}>
                  Get AI-powered insights on your round — patterns, what cost strokes, and what to focus on next.
                </div>
                <button
                  onClick={() => setAnalyzing(true)}
                  style={{
                    width: '100%', height: 52, background: C.text, color: '#000',
                    border: 'none', borderRadius: 100, fontFamily: C.sans,
                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Analyze Round
                </button>
              </>
            )}
          </div>
        </div>

        {/* Scorecard */}
        {scorecard.length > 0 && (
          <div style={{ padding: '28px 24px 0' }}>
            <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 20 }}>Scorecard</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Hole', 'Par', 'Score', 'Putts'].map(h => (
                      <th key={h} style={{ fontSize: 10, fontFamily: C.sans, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: C.text3, paddingBottom: 10, textAlign: h === 'Hole' ? 'left' : 'center' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scorecard.map(row => {
                    const diff = row.score - row.par
                    const scoreColor = diff < 0 ? C.text : diff === 0 ? C.text2 : diff === 1 ? C.text2 : C.text3
                    return (
                      <tr key={row.hole}>
                        <td style={{ padding: '12px 0', borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.text3, fontFamily: C.sans }}>{row.hole}</td>
                        <td style={{ padding: '12px 0', borderTop: `1px solid ${C.border}`, textAlign: 'center', color: C.text2 }}>{row.par}</td>
                        <td style={{ padding: '12px 0', borderTop: `1px solid ${C.border}`, textAlign: 'center', color: scoreColor, fontWeight: diff < 0 ? 700 : 400 }}>{row.score}</td>
                        <td style={{ padding: '12px 0', borderTop: `1px solid ${C.border}`, textAlign: 'center', color: C.text2 }}>{row.putts}</td>
                      </tr>
                    )
                  })}
                  <tr>
                    <td style={{ padding: '12px 0', borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.text3, fontFamily: C.sans, fontWeight: 700 }}>Total</td>
                    <td style={{ padding: '12px 0', borderTop: `1px solid ${C.border}`, textAlign: 'center', fontWeight: 700 }}>{scorecard.reduce((s, r) => s + r.par, 0)}</td>
                    <td style={{ padding: '12px 0', borderTop: `1px solid ${C.border}`, textAlign: 'center', fontWeight: 700 }}>{stats.totalScore}</td>
                    <td style={{ padding: '12px 0', borderTop: `1px solid ${C.border}`, textAlign: 'center', fontWeight: 700 }}>{stats.totalPutts}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>

      {/* Bottom bar */}
      <div style={{
        padding: `16px 24px calc(32px + env(safe-area-inset-bottom, 0px))`,
        borderTop: `1px solid ${C.border}`, background: C.bg, flexShrink: 0,
      }}>
        <button onClick={onDone} style={{
          width: '100%', height: 60, background: C.text, color: '#000',
          border: 'none', borderRadius: 100, fontFamily: C.sans,
          fontSize: 17, fontWeight: 600, cursor: 'pointer',
        }}>
          Done
        </button>
      </div>
    </div>
  )
}
