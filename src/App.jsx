import { useState } from 'react'
import HoleScoring from './screens/HoleScoring'
import { getCourseById, getActiveRound, saveActiveRound, saveRound, clearActiveRound, clearActiveHole } from './lib/storage'

function createRound(courseId = 'logan-river', tees = 'blue') {
  return {
    id: crypto.randomUUID(),
    courseId,
    tees,
    date: new Date().toISOString().split('T')[0],
    holes: [],
  }
}

export default function App() {
  const [round, setRound] = useState(() => getActiveRound() ?? createRound())

  const course = getCourseById(round.courseId)

  function handleNext(updatedRound) {
    saveActiveRound(updatedRound)
    setRound(updatedRound)
  }

  function handleFinish(completedRound) {
    saveRound(completedRound)
    clearActiveRound()
    clearActiveHole()
    // TODO: navigate to Round Analysis screen
    setRound(createRound())
  }

  if (!course) return <div style={{ color: '#fff', padding: 24 }}>Course not found.</div>

  return (
    <HoleScoring
      key={round.holes.length}
      round={round}
      course={course}
      onNext={handleNext}
      onFinish={handleFinish}
    />
  )
}
