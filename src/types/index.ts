export interface Hole {
  number: number
  par: number
  yardage: { black: number; blue: number; white: number; red: number }
  handicap: number
}

export interface Course {
  id: string
  name: string
  location: string
  par: number
  rating: number
  slope: number
  holes: Hole[]
}

export type Tee = 'black' | 'blue' | 'white' | 'red'

export type ShotType = 'tee' | 'approach' | 'chip' | 'pitch' | 'putt'

export interface Shot {
  number: number
  type: ShotType
  club?: string
  yardage?: number
  result?: string
  puttDistance?: string
}

export interface HoleScore {
  hole: number
  score: number
  putts: number
  shots: Shot[]
}

export interface InsightItem {
  title: string
  description: string
  severity: 'positive' | 'warning' | 'negative'
}

export interface ClubInsight {
  club: string
  stat: string
  pattern?: string
}

export interface RoundAnalysis {
  generatedAt: string
  summary: string
  wentWell: InsightItem[]
  focusAreas: InsightItem[]
  clubInsights: ClubInsight[]
}

export interface Round {
  id: string
  courseId: string
  tees: Tee
  date: string
  holes: HoleScore[]
  totalHoles: 9 | 18
  startHole: 1 | 10
  analysis?: RoundAnalysis
}
