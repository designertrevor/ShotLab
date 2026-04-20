import { useState } from 'react'
import { getCourses, saveActiveRound } from '@/lib/storage'

const C = {
  bg: '#000', surface: '#1a1a1a', surface2: '#262626',
  border: 'rgba(255,255,255,0.12)', text: '#fff', text2: '#999', text3: '#555',
  bebas: "'Bebas Neue', sans-serif", sans: "'DM Sans', sans-serif",
}

export default function Setup({ onStart, onBack }) {
  const courses = getCourses()
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
  const [tees, setTees] = useState('blue')
  const [holesMode, setHolesMode] = useState('18')

  function handleStart() {
    const round = {
      id: crypto.randomUUID(),
      courseId,
      tees,
      date: new Date().toISOString().split('T')[0],
      holes: [],
      totalHoles: holesMode === '18' ? 18 : 9,
      startHole: holesMode === 'back9' ? 10 : 1,
    }
    saveActiveRound(round)
    onStart(round)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      maxWidth: 430, margin: '0 auto', background: C.bg, color: C.text,
      fontFamily: C.sans, overflow: 'hidden',
    }}>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', flexShrink: 0 }}>
        <button onClick={onBack} style={{ fontSize: 17, color: C.text, fontFamily: C.sans, background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>
        <span style={{ fontSize: 17, fontWeight: 600 }}>New Round</span>
        <div style={{ width: 60 }} />
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Course */}
        <div style={{ padding: '8px 24px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.text3, marginBottom: 14 }}>Course</div>
          {courses.map(course => {
            const isOn = courseId === course.id
            return (
              <button key={course.id} onClick={() => setCourseId(course.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 0',
                background: 'none', border: 'none', borderBottom: `1px solid ${C.border}`,
                cursor: 'pointer', textAlign: 'left', fontFamily: C.sans,
              }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 500, color: C.text }}>{course.name}</div>
                  <div style={{ fontSize: 14, color: C.text3, marginTop: 3 }}>{course.location} · Par {course.par}</div>
                </div>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  border: `1.5px solid ${isOn ? C.text : C.border}`,
                  background: isOn ? C.text : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: isOn ? '#000' : 'transparent',
                }}>✓</div>
              </button>
            )
          })}
        </div>

        {/* Tees */}
        <div style={{ padding: '32px 24px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.text3, marginBottom: 14 }}>Tees</div>
          <SegControl
            options={[
              { value: 'black', label: 'Black' },
              { value: 'blue', label: 'Blue' },
              { value: 'white', label: 'White' },
              { value: 'red', label: 'Red' },
            ]}
            value={tees}
            onChange={setTees}
          />
        </div>

        {/* Holes */}
        <div style={{ padding: '32px 24px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.text3, marginBottom: 14 }}>Holes</div>
          <SegControl
            options={[
              { value: '18', label: '18 Holes' },
              { value: 'front9', label: 'Front 9' },
              { value: 'back9', label: 'Back 9' },
            ]}
            value={holesMode}
            onChange={setHolesMode}
          />
        </div>

        <div style={{ height: 40 }} />
      </div>

      {/* Bottom bar */}
      <div style={{
        padding: `16px 24px calc(32px + env(safe-area-inset-bottom, 0px))`,
        borderTop: `1px solid ${C.border}`, background: C.bg, flexShrink: 0,
      }}>
        <button onClick={handleStart} style={{
          width: '100%', height: 60, background: C.text, color: '#000',
          border: 'none', borderRadius: 100, fontFamily: C.sans,
          fontSize: 17, fontWeight: 600, cursor: 'pointer',
        }}>
          Start Round
        </button>
      </div>
    </div>
  )
}

function SegControl({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', background: '#1a1a1a', borderRadius: 10, padding: 3 }}>
      {options.map(opt => {
        const isOn = value === opt.value
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)} style={{
            flex: 1, height: 36, border: 'none', cursor: 'pointer',
            background: isOn ? '#262626' : 'none',
            color: isOn ? '#fff' : '#999',
            fontSize: 14, fontWeight: 500, borderRadius: 8,
            fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
          }}>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
