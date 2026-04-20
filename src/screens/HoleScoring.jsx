import { useState, useEffect } from 'react'
import { saveActiveRound, saveActiveHole } from '@/lib/storage'

// ─── Shot configuration ───────────────────────────────────────────────────────

const SHOT_TYPES = {
  drive: {
    clubs: ['D', '3W', '5W', '3H', '4H', '4i', '5i', '6i', '7i', '8i', '9i', 'PW', '52°', '56°', '60°'],
    misses: ['Fairway ✓', 'Left', 'Right', 'Slice', 'Hook', 'Pull', 'Push', 'Thin', 'Chunk', 'Topped', 'Short', 'Long'],
  },
  approach: {
    clubs: ['3W', '5W', '3H', '4H', '4i', '5i', '6i', '7i', '8i', '9i', 'PW', '52°', '56°', '60°'],
    misses: ['GIR ✓', 'Left', 'Right', 'Short', 'Long', 'Thin', 'Chunk', 'Pull', 'Push'],
  },
  chip: {
    clubs: ['56°', '60°', '52°', 'PW', '9i', '8i', '7i'],
    misses: ['Good ✓', 'Short', 'Long', 'Blade', 'Chunk', 'Left', 'Right'],
  },
}

const PUTT_DISTANCES = ['<5ft', '5–10ft', '10–20ft', '20–40ft', '40+ft']
const PUTT_MISSES = ['Made ✓', 'Left', 'Right', 'Short', 'Long', 'Pushed', 'Pulled']

function getShotCategory(shotIndex, par) {
  if (shotIndex === 0) return par >= 4 ? 'drive' : 'approach'
  if (shotIndex === 1 && par === 3) return 'chip'
  if (shotIndex === 1) return 'approach'
  return 'chip'
}

function getShotLabel(shotIndex, par) {
  if (shotIndex === 0 && par === 3) return 'Tee Shot'
  const cat = getShotCategory(shotIndex, par)
  return cat === 'drive' ? 'Drive' : cat === 'approach' ? 'Approach' : 'Chip / Pitch'
}

function getScoreName(score, par) {
  const d = score - par
  if (d <= -2) return 'Eagle'
  if (d === -1) return 'Birdie'
  if (d === 0) return 'Par'
  if (d === 1) return 'Bogey'
  if (d === 2) return 'Double'
  if (d === 3) return 'Triple'
  return `+${d}`
}

function toParStr(n) {
  if (n === 0) return 'E'
  return n > 0 ? `+${n}` : String(n)
}

function makeShotDetail() {
  return { club: null, misses: [], yardage: '' }
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg: '#000',
  surface: '#1a1a1a',
  surface2: '#262626',
  border: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.3)',
  text: '#fff',
  text2: '#999',
  text3: '#555',
  bebas: "'Bebas Neue', sans-serif",
  sans: "'DM Sans', sans-serif",
  mono: "'DM Mono', monospace",
}

// ─── HoleScoring ─────────────────────────────────────────────────────────────

export default function HoleScoring({ round, course, onNext, onFinish }) {
  const completedCount = round.holes.length
  const totalHoles = round.totalHoles ?? 18
  const startHole = round.startHole ?? 1
  const holeNum = startHole + completedCount
  const hole = course.holes[holeNum - 1]
  const teeYards = hole.yardage[round.tees]
  const isLastHole = completedCount + 1 >= totalHoles

  const runningScore = round.holes.reduce(
    (acc, hs) => acc + hs.score - course.holes[hs.hole - 1].par,
    0
  )

  const scoreOptions = [hole.par - 2, hole.par - 1, hole.par, hole.par + 1, hole.par + 2]
  if (hole.par === 5) scoreOptions.push(hole.par + 3)
  const validScores = scoreOptions.filter(s => s >= 1)

  const [score, setScore] = useState(null)
  const [putts, setPutts] = useState(null)
  const [shotDetails, setShotDetails] = useState([])
  const [puttDetail, setPuttDetail] = useState({ distance: null, misses: [] })

  // Show shots once score is selected; assume 2 putts until putts is chosen
  const numShots = score !== null ? Math.max(0, score - (putts ?? 2)) : 0
  const showDetails = score !== null

  // Resize shot detail array when score or putts changes
  useEffect(() => {
    setShotDetails(prev => {
      if (numShots === prev.length) return prev
      if (numShots > prev.length) {
        return [...prev, ...Array.from({ length: numShots - prev.length }, makeShotDetail)]
      }
      return prev.slice(0, numShots)
    })
  }, [numShots])

  // Persist draft after each interaction
  useEffect(() => {
    if (score === null) return
    saveActiveHole({ roundId: round.id, holeNum, score, putts, shotDetails, puttDetail })
  }, [score, putts, shotDetails, puttDetail])

  function buildHoleScore() {
    const shots = []
    shotDetails.forEach((s, i) => {
      const cat = getShotCategory(i, hole.par)
      const type = cat === 'drive' ? 'tee' : cat
      shots.push({
        number: i + 1,
        type,
        ...(s.club && { club: s.club }),
        ...(s.yardage && { yardage: Number(s.yardage) }),
        ...(s.misses.length && { result: s.misses.join(', ') }),
      })
    })
    for (let i = 0; i < (putts ?? 0); i++) {
      shots.push({
        number: shotDetails.length + i + 1,
        type: 'putt',
        ...(i === 0 && puttDetail.distance && { puttDistance: puttDetail.distance }),
        ...(i === 0 && puttDetail.misses.length && { result: puttDetail.misses.join(', ') }),
      })
    }
    return { hole: holeNum, score, putts: putts ?? 0, shots }
  }

  function commit(cb) {
    const holeScore = buildHoleScore()
    const updated = { ...round, holes: [...round.holes, holeScore] }
    saveActiveRound(updated)
    cb(updated)
  }

  function updateShot(i, field, value) {
    setShotDetails(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  function toggleMiss(i, miss) {
    setShotDetails(prev => prev.map((s, idx) => {
      if (idx !== i) return s
      const misses = s.misses.includes(miss)
        ? s.misses.filter(m => m !== miss)
        : [...s.misses, miss]
      return { ...s, misses }
    }))
  }

  function togglePuttMiss(miss) {
    setPuttDetail(prev => ({
      ...prev,
      misses: prev.misses.includes(miss)
        ? prev.misses.filter(m => m !== miss)
        : [...prev.misses, miss],
    }))
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', maxWidth: 430, margin: '0 auto',
      background: C.bg, color: C.text, fontFamily: C.sans,
      overflow: 'hidden',
    }}>

      {/* Hole header */}
      <div style={{ padding: '12px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.text3, marginBottom: 2 }}>Hole</div>
            <div style={{ fontFamily: C.bebas, fontSize: 96, lineHeight: 1 }}>{holeNum}</div>
          </div>
          <div style={{ textAlign: 'right', paddingTop: 12 }}>
            <div style={{ fontSize: 13, color: C.text3 }}>Par</div>
            <div style={{ fontFamily: C.bebas, fontSize: 48, lineHeight: 1, color: C.text2 }}>{hole.par}</div>
            <div style={{ fontSize: 15, color: C.text3, marginTop: 4 }}>{teeYards} yds</div>
          </div>
        </div>
        <div style={{ fontSize: 15, color: C.text3, marginTop: 12, paddingBottom: 16 }}>
          {completedCount > 0
            ? <>Thru {completedCount} · <strong style={{ color: C.text, fontWeight: 600 }}>{toParStr(runningScore)}</strong></>
            : 'Round start'}
        </div>
      </div>

      {/* Progress dots — one per hole in this round */}
      <div style={{ display: 'flex', gap: 4, padding: '0 24px 20px', flexShrink: 0 }}>
        {Array.from({ length: totalHoles }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < completedCount ? C.text3 : i === completedCount ? C.text : C.surface2,
          }} />
        ))}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>

        {/* Score */}
        <div style={{ padding: '0 24px' }}>
          <SectionLabel text="Score" />
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
            {validScores.map(s => {
              const isPar = s === hole.par
              const isOn = score === s
              return (
                <button key={s} onClick={() => setScore(s)} style={{
                  flex: isPar ? 1.5 : 1,
                  minHeight: isPar ? 88 : 72,
                  border: `1px solid ${isOn ? '#fff' : isPar ? C.borderStrong : C.border}`,
                  borderRadius: 12,
                  background: isOn ? '#fff' : C.surface,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 2, transition: 'all 0.12s',
                }}>
                  <span style={{
                    fontFamily: C.bebas, fontSize: isPar ? 52 : 40, lineHeight: 1,
                    color: isOn ? '#000' : isPar ? C.text : C.text2,
                  }}>{s}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    color: isOn ? 'rgba(0,0,0,0.5)' : C.text3,
                  }}>{getScoreName(s, hole.par)}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Shot details + putts — visible once score is selected */}
        {showDetails && (
          <div style={{ padding: '28px 24px 0' }}>
            {shotDetails.length > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <SectionLabel text="Shot Details" />
                  <span style={{ fontSize: 13, color: C.text3 }}>Optional</span>
                </div>
                {shotDetails.map((shot, i) => (
                  <ShotCard
                    key={i}
                    index={i}
                    label={getShotLabel(i, hole.par)}
                    config={SHOT_TYPES[getShotCategory(i, hole.par)]}
                    shot={shot}
                    onClubSelect={club => updateShot(i, 'club', shot.club === club ? null : club)}
                    onMissToggle={miss => toggleMiss(i, miss)}
                    onYardageChange={val => updateShot(i, 'yardage', val)}
                  />
                ))}
              </>
            )}

            {/* Putts — always at the bottom */}
            <div style={{ marginBottom: 12 }}>
              <SectionLabel text="Putts" />
              <div style={{ display: 'flex', gap: 10 }}>
                {[0, 1, 2, 3, 4].map(p => {
                  const isOn = putts === p
                  return (
                    <button key={p} onClick={() => setPutts(p)} style={{
                      flex: 1, height: 72,
                      border: `1px solid ${isOn ? '#fff' : C.border}`,
                      borderRadius: 12,
                      background: isOn ? '#fff' : C.surface,
                      color: isOn ? '#000' : C.text2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.12s',
                      fontFamily: p === 4 ? C.sans : C.bebas,
                      fontSize: p === 4 ? 13 : 40,
                      fontWeight: p === 4 ? 700 : undefined,
                      letterSpacing: p === 4 ? 0.5 : undefined,
                      textTransform: p === 4 ? 'uppercase' : undefined,
                    }}>
                      {p === 4 ? '4+' : p}
                    </button>
                  )
                })}
              </div>
            </div>

            {putts > 0 && (
              <PuttCard
                putts={putts}
                detail={puttDetail}
                onDistanceSelect={d => setPuttDetail(prev => ({ ...prev, distance: prev.distance === d ? null : d }))}
                onMissToggle={togglePuttMiss}
              />
            )}

            <div style={{ height: 8 }} />
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>

      {/* Bottom bar */}
      <div style={{
        padding: `16px 24px calc(32px + env(safe-area-inset-bottom, 0px))`,
        flexShrink: 0,
        borderTop: `1px solid ${C.border}`,
        background: C.bg,
      }}>
        {isLastHole ? (
          <button onClick={() => commit(onFinish)} style={primaryBtn}>Finish Round</button>
        ) : (
          <>
            <button onClick={() => commit(onNext)} style={primaryBtn}>Next Hole →</button>
            <button onClick={() => commit(onFinish)} style={ghostBtn}>Finish Round</button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ text }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 600, letterSpacing: 1,
      textTransform: 'uppercase', color: C.text3, marginBottom: 14,
    }}>
      {text}
    </div>
  )
}

function RowLabel({ text }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 600, letterSpacing: 0.8,
      textTransform: 'uppercase', color: C.text3, marginBottom: 10,
    }}>
      {text}
    </div>
  )
}

function Pill({ label, isOn, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      height: 40, padding: '0 16px', borderRadius: 100,
      border: `1px solid ${isOn ? '#fff' : C.border}`,
      background: isOn ? '#fff' : C.surface2,
      color: isOn ? '#000' : C.text2,
      fontSize: 14, whiteSpace: 'nowrap',
      display: 'flex', alignItems: 'center',
      transition: 'all 0.12s', fontFamily: C.sans,
      ...style,
    }}>
      {label}
    </button>
  )
}

function ShotCard({ index, label, config, shot, onClubSelect, onMissToggle, onYardageChange }) {
  return (
    <div style={{ background: C.surface, borderRadius: 16, padding: 20, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 17, fontWeight: 600 }}>Shot {index + 1} · {label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="number"
            placeholder="—"
            value={shot.yardage}
            onChange={e => onYardageChange(e.target.value)}
            style={{
              width: 72, height: 36, background: C.surface2,
              border: `1px solid ${C.border}`, borderRadius: 8,
              color: C.text, fontSize: 15, fontFamily: C.mono,
              textAlign: 'center', padding: 0, outline: 'none',
            }}
          />
          <span style={{ fontSize: 13, color: C.text3 }}>yds</span>
        </div>
      </div>

      <RowLabel text="Club" />
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16, WebkitOverflowScrolling: 'touch' }}>
        {config.clubs.map(club => (
          <button key={club} onClick={() => onClubSelect(club)} style={{
            height: 40, minWidth: 48, padding: '0 14px',
            borderRadius: 100,
            border: `1px solid ${shot.club === club ? '#fff' : C.border}`,
            background: shot.club === club ? '#fff' : C.surface2,
            color: shot.club === club ? '#000' : C.text2,
            fontSize: 14, fontWeight: 500,
            whiteSpace: 'nowrap', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.12s', fontFamily: C.sans,
          }}>
            {club}
          </button>
        ))}
      </div>

      <RowLabel text="Result" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {config.misses.map(miss => (
          <Pill
            key={miss}
            label={miss}
            isOn={shot.misses.includes(miss)}
            onClick={() => onMissToggle(miss)}
          />
        ))}
      </div>
    </div>
  )
}

function PuttCard({ putts, detail, onDistanceSelect, onMissToggle }) {
  return (
    <div style={{ background: C.surface, borderRadius: 16, padding: 20, marginBottom: 12 }}>
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 18 }}>
        Putting · {putts} putt{putts !== 1 ? 's' : ''}
      </div>

      <RowLabel text="1st Putt Distance" />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {PUTT_DISTANCES.map(d => {
          const isOn = detail.distance === d
          return (
            <button key={d} onClick={() => onDistanceSelect(d)} style={{
              flex: 1, height: 44,
              border: `1px solid ${isOn ? '#fff' : C.border}`,
              borderRadius: 8,
              background: isOn ? '#fff' : C.surface2,
              color: isOn ? '#000' : C.text2,
              fontSize: 12, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.12s', fontFamily: C.sans,
            }}>
              {d}
            </button>
          )
        })}
      </div>

      <RowLabel text="Miss Direction" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {PUTT_MISSES.map(miss => (
          <Pill
            key={miss}
            label={miss}
            isOn={detail.misses.includes(miss)}
            onClick={() => onMissToggle(miss)}
          />
        ))}
      </div>
    </div>
  )
}

const primaryBtn = {
  width: '100%', height: 60,
  background: '#fff', color: '#000',
  border: 'none', borderRadius: 100,
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 17, fontWeight: 600,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const ghostBtn = {
  width: '100%', height: 52,
  background: 'none', border: 'none',
  color: '#999', fontSize: 15,
  fontFamily: "'DM Sans', sans-serif",
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  marginTop: 4,
}
