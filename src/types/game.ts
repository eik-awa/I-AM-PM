import type { PersonnelCard, TaskCard, EventCard } from './card'
import type { Mission } from './mission'

export interface WBSPhase {
  id: string
  name: string
  tasks: TaskCard[]
}

export interface QCDState {
  quality: number      // 0-100
  cost: number         // 実際の支出（万円）
  budget: number       // 予算（万円）
  delivery: number     // 0-100（進捗率）
}

export type TurnPhase = 'planning' | 'executing' | 'event' | 'summary'

export interface TurnState {
  current: number
  max: number
  phase: TurnPhase
}

export interface ProjectScenario {
  id: string
  name: string
  description: string
  difficulty: 'easy' | 'normal' | 'hard' | 'hell'
  phases: WBSPhase[]
  totalTurns: number
  budget: number
  qualityMin: number   // ゲームオーバーライン
}

export type GameStatus = 'title' | 'tutorial' | 'playing' | 'won' | 'lost'

export interface LogEntry {
  turn: number
  message: string
  type: 'info' | 'warning' | 'success' | 'danger'
}

export interface GameState {
  status: GameStatus
  scenario: ProjectScenario | null
  turn: TurnState
  qcd: QCDState
  // カード
  hand: (PersonnelCard | EventCard)[]
  deck: (PersonnelCard | EventCard)[]
  discard: (PersonnelCard | EventCard)[]
  // WBS
  phases: WBSPhase[]
  // 稼働中人員
  activePersonnel: PersonnelCard[]
  // 完了タスク
  completedTaskIds: string[]
  // イベント
  pendingEvents: EventCard[]
  activeEvent: EventCard | null
  // ログ
  log: LogEntry[]
  // ミッション
  missions: Mission[]
  missionStats: {
    maxTasksInOneTurn: number
    maxSimultaneousPersonnel: number
  }
  // メタ（永続）
  totalRuns: number
  bestScore: number
  pmPoints: number
  unlockedSkills: string[]
}

export interface RunResult {
  won: boolean
  turns: number
  qcd: QCDState
  score: number
}
