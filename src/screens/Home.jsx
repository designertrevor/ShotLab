import { getRounds, getCourses } from '@/lib/storage'

const C = {
  bg: '#000', surface: '#1a1a1a', border: 'rgba(255,255,255,0.12)',
  text: '#fff', text2: '#999', text3: '#555',
  bebas: "'Bebas Neue', sans-serif", sans: "'DM Sans', sans-serif",
}

function toParStr(n) {
  if (n === 0) return 'E'
  return n > 0 ? `+${n}` : String(n)
}

function computeStats(rounds, courses) {
  if (!rounds.length) return null

  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]))
  let totalScore = 0, roundCount = 0
  let teeShots = 0, fairwaysHit = 0
  let totalPutts = 0, holeCount = 0

  for (const round of rounds) {
    const course = courseMap[round.courseId]
    if (!course) continue
    let roundScore = 0
    for (const hs of round.holes) {
      roundScore += hs.score
      totalPutts += hs.putts
      holeCount++
      const holeData = course.holes[hs.hole - 1]
      if (holeData && holeData.par >= 4) {
        for (const shot of hs.shots) {
          if (shot.type === 'tee') {
            teeShots++
            if (shot.result?.includes('Fairway ✓')) fairwaysHit++
          }
        }
      }
    }
    totalScore += roundScore
    roundCount++
  }

  return {
    avgScore: roundCount ? (totalScore / roundCount).toFixed(1) : '—',
    fairwayPct: teeShots ? Math.round((fairwaysHit / teeShots) * 100) + '%' : '—',
    avgPutts: holeCount ? (totalPutts / holeCount * 18).toFixed(1) : '—',
  }
}

export default function Home({ onNewRound, onViewRound }) {
  const rounds = getRounds()
  const courses = getCourses()
  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]))
  const stats = computeStats(rounds, courses)
  const recentRounds = rounds.slice(0, 5)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      maxWidth: 430, margin: '0 auto', background: C.bg, color: C.text,
      fontFamily: C.sans, overflow: 'hidden',
    }}>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', flexShrink: 0 }}>
        <span style={{ fontSize: 17, fontWeight: 600 }}>Caddy</span>
        <button onClick={onNewRound} style={{
          fontSize: 17, color: C.text, fontFamily: C.sans,
          background: 'none', border: 'none', cursor: 'pointer',
        }}>New Round</button>
      </div>

      {/* Scrollable */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Handicap hero */}
        <div style={{ padding: '12px 24px 32px' }}>
          <div style={{ fontSize: 15, color: C.text3, marginBottom: 8 }}>Handicap Index</div>
          <div style={{ fontFamily: C.bebas, fontSize: 96, lineHeight: 1 }}>8.2</div>
        </div>

        <div style={{ height: 1, background: C.border }} />

        {/* Stats strip */}
        <div style={{ display: 'flex', padding: '28px 24px' }}>
          {[
            { num: stats?.avgScore ?? '—', lbl: 'Avg Score' },
            { num: stats?.fairwayPct ?? '—', lbl: 'Fairways' },
            { num: stats?.avgPutts ?? '—', lbl: 'Avg Putts' },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center',
              borderLeft: i > 0 ? `1px solid ${C.border}` : 'none',
            }}>
              <div style={{ fontFamily: C.bebas, fontSize: 44, lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.text3, marginTop: 4 }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: C.border }} />

        {/* Recent rounds */}
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 20 }}>Recent Rounds</div>

          {recentRounds.length === 0 ? (
            <div style={{ fontSize: 15, color: C.text3, paddingBottom: 24 }}>
              No rounds yet. Start your first round.
            </div>
          ) : (
            recentRounds.map(round => {
              const course = courseMap[round.courseId]
              const totalScore = round.holes.reduce((s, h) => s + h.score, 0)
              const coursePar = course
                ? round.holes.reduce((s, h) => s + (course.holes[h.hole - 1]?.par ?? 0), 0)
                : 0
              const toPar = totalScore - coursePar
              const dateStr = new Date(round.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              return (
                <button key={round.id} onClick={() => onViewRound(round.id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '18px 0',
                  background: 'none', border: 'none', borderBottom: `1px solid ${C.border}`,
                  cursor: 'pointer', fontFamily: C.sans,
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 17, fontWeight: 500, color: C.text }}>{course?.name ?? 'Unknown Course'}</div>
                    <div style={{ fontSize: 14, color: C.text3, marginTop: 3 }}>{dateStr} · {round.holes.length} holes</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: C.bebas, fontSize: 44, lineHeight: 1 }}>{totalScore || '—'}</div>
                    <div style={{ fontSize: 13, color: C.text3 }}>{totalScore ? toParStr(toPar) : ''}</div>
                  </div>
                </button>
              )
            })
          )}
        </div>

        <div style={{ height: 40 }} />
      </div>

      {/* Bottom bar */}
      <div style={{
        padding: `16px 24px calc(32px + env(safe-area-inset-bottom, 0px))`,
        borderTop: `1px solid ${C.border}`, background: C.bg, flexShrink: 0,
      }}>
        <button onClick={onNewRound} style={{
          width: '100%', height: 60, background: C.text, color: '#000',
          border: 'none', borderRadius: 100, fontFamily: C.sans,
          fontSize: 17, fontWeight: 600, cursor: 'pointer',
        }}>
          Start New Round
        </button>
      </div>
    </div>
  )
}
