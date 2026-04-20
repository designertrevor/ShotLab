import { useState } from 'react'
import Home from './screens/Home'
import Setup from './screens/Setup'
import HoleScoring from './screens/HoleScoring'
import Analysis from './screens/Analysis'
import {
  getCourseById, getActiveRound,
  saveRound, clearActiveRound, clearActiveHole, getRoundById,
} from './lib/storage'

export default function App() {
  const [screen, setScreen] = useState(() => getActiveRound() ? 'scoring' : 'home')
  const [activeRound, setActiveRound] = useState(() => getActiveRound())
  const [viewingRoundId, setViewingRoundId] = useState(null)

  // ── Navigation helpers ──────────────────────────────────────────────────────

  function goHome() {
    setScreen('home')
    setViewingRoundId(null)
  }

  // ── Screen: Home ────────────────────────────────────────────────────────────

  function handleNewRound() {
    setScreen('setup')
  }

  function handleViewRound(roundId) {
    setViewingRoundId(roundId)
    setScreen('analysis')
  }

  // ── Screen: Setup ───────────────────────────────────────────────────────────

  function handleRoundStart(round) {
    setActiveRound(round)
    setScreen('scoring')
  }

  // ── Screen: Hole Scoring ────────────────────────────────────────────────────

  function handleHoleNext(updatedRound) {
    setActiveRound(updatedRound)
  }

  function handleRoundFinish(completedRound) {
    saveRound(completedRound)
    clearActiveRound()
    clearActiveHole()
    setActiveRound(null)
    setViewingRoundId(completedRound.id)
    setScreen('analysis')
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (screen === 'home') {
    return <Home onNewRound={handleNewRound} onViewRound={handleViewRound} />
  }

  if (screen === 'setup') {
    return <Setup onStart={handleRoundStart} onBack={goHome} />
  }

  if (screen === 'scoring') {
    const round = activeRound
    const course = round ? getCourseById(round.courseId) : null
    if (!round || !course) return <Setup onStart={handleRoundStart} onBack={goHome} />
    return (
      <HoleScoring
        key={round.holes.length}
        round={round}
        course={course}
        onNext={handleHoleNext}
        onFinish={handleRoundFinish}
      />
    )
  }

  if (screen === 'analysis') {
    const round = viewingRoundId ? getRoundById(viewingRoundId) : null
    const course = round ? getCourseById(round.courseId) : null
    if (!round || !course) return <Home onNewRound={handleNewRound} onViewRound={handleViewRound} />
    return <Analysis round={round} course={course} onDone={goHome} />
  }

  return null
}
