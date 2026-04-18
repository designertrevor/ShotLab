import type { Course, Round } from '@/types'
import { courses as seedCourses } from '@/data/courses'

const KEYS = {
  rounds: 'caddy:rounds',
  activeRound: 'caddy:active-round',
  activeHole: 'caddy:active-hole',
  courses: 'caddy:courses',
} as const

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

// ─── Rounds ───────────────────────────────────────────────────────────────────

export function getRounds(): Round[] {
  return readJSON<Round[]>(KEYS.rounds) ?? []
}

export function getRoundById(id: string): Round | undefined {
  return getRounds().find(r => r.id === id)
}

export function saveRound(round: Round): void {
  const rounds = getRounds()
  const idx = rounds.findIndex(r => r.id === round.id)
  if (idx >= 0) {
    rounds[idx] = round
  } else {
    rounds.unshift(round)
  }
  writeJSON(KEYS.rounds, rounds)
}

export function deleteRound(id: string): void {
  writeJSON(KEYS.rounds, getRounds().filter(r => r.id !== id))
}

// ─── Active (in-progress) Round ───────────────────────────────────────────────

export function getActiveRound(): Round | null {
  return readJSON<Round>(KEYS.activeRound)
}

export function saveActiveRound(round: Round): void {
  writeJSON(KEYS.activeRound, round)
}

export function clearActiveRound(): void {
  localStorage.removeItem(KEYS.activeRound)
}

// ─── Active hole draft (crash recovery for current hole) ──────────────────────

export function getActiveHole<T>(): T | null {
  return readJSON<T>(KEYS.activeHole)
}

export function saveActiveHole(state: unknown): void {
  writeJSON(KEYS.activeHole, state)
}

export function clearActiveHole(): void {
  localStorage.removeItem(KEYS.activeHole)
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export function getCourses(): Course[] {
  const overrides = readJSON<Course[]>(KEYS.courses)
  if (!overrides) return seedCourses

  // Merge: seed courses with any saved overrides applied
  return seedCourses.map(seed => overrides.find(o => o.id === seed.id) ?? seed)
}

export function getCourseById(id: string): Course | undefined {
  return getCourses().find(c => c.id === id)
}

export function saveCourse(course: Course): void {
  const overrides = readJSON<Course[]>(KEYS.courses) ?? []
  const idx = overrides.findIndex(c => c.id === course.id)
  if (idx >= 0) {
    overrides[idx] = course
  } else {
    overrides.push(course)
  }
  writeJSON(KEYS.courses, overrides)
}
