import type { PersonnelCard, TaskCard, EventCard } from './card'
import type { Mission } from './mission'
import type { ComboRecipe, ActiveComboEffect } from './combo'

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

export type GameMode = 'tutorial' | 'beginner' | 'standard' | 'crisis' | 'large_scale' | 'multi_project' | 'expert'

export interface ProjectInstance {
  id: string
  scenarioId: string
  name: string
  phases: WBSPhase[]
  qcd: QCDState
  status: 'active' | 'won' | 'lost'
  completedTaskIds: string[]
}

export interface GanttEntry {
  turn: number
  projectId: string
  taskId: string
  personnelIds: string[]
  effortSnapshot: number
}

export interface GanttPlan {
  projectId: string
  taskId: string
  personnelId: string
  plannedTurn: number
}

export interface EventFlag {
  id: string
  turn: number
  eventId: string
  choiceId: string
  projectId: string
  description: string
}

export interface BossHint {
  id: string
  condition: string
  message: string
  advice: string
}

export interface GameModeConfig {
  id: GameMode
  name: string
  description: string
  requiredSkills: string[]
  maxProjects: number
  teamSizeMin: number
  isUnlocked: (skills: string[]) => boolean
  missionIds: string[]
  unlocksCharacters: string[]
}

export interface ProjectScenario {
  id: string
  name: string
  description: string
  difficulty: 'easy' | 'normal' | 'hard' | 'hell'
  phases: WBSPhase[]
  totalTurns: number
  budget: number
  qualityMin: number
  modeId?: GameMode
  requiredSkills?: string[]
}

export type GameStatus = 'title' | 'tutorial' | 'playing' | 'won' | 'lost'

export interface LogEntry {
  turn: number
  message: string
  type: 'info' | 'warning' | 'success' | 'danger'
}

export interface GameState {
  status: GameStatus
  mode: GameMode
  // 複数プロジェクト
  projects: ProjectInstance[]
  activeProjectId: string
  // ターン
  turn: TurnState
  // カード（人員のみ）
  hand: PersonnelCard[]
  deck: PersonnelCard[]
  discard: PersonnelCard[]
  // 稼働中人員
  activePersonnel: PersonnelCard[]
  // イベント
  pendingEvents: EventCard[]
  activeEvent: EventCard | null
  // ガントチャート
  ganttHistory: GanttEntry[]
  ganttPlan: GanttPlan[]
  // イベントフラグ（振り返り用）
  eventFlags: EventFlag[]
  // 上司ヒント
  bossHints: BossHint[]
  // スキルポイント（ゲーム内、リセット）
  skillPoints: number
  // ログ
  log: LogEntry[]
  // ミッション
  missions: Mission[]
  missionStats: {
    maxTasksInOneTurn: number
    maxSimultaneousPersonnel: number
  }
  // シナジー（コンボ）システム
  discoveredCombos: string[]                     // 発動済みコンボID一覧（図鑑記録）
  activeComboEffects: ActiveComboEffect[]         // 現在有効なコンボ効果
  pendingComboActivation: ComboRecipe | null      // 発動演出待ちコンボ（アニメーション用）
  nextEventPreview: string | null                 // 木村コンボ: 次ターンのイベントID
  // メタ（永続）
  totalRuns: number
  bestScore: number
  pmPoints: number
  unlockedSkills: string[]
  clearedModes: GameMode[]
  completedMissionsByMode: Record<string, string[]>
  unlockedCharacterIds: string[]
}

export interface RunResult {
  won: boolean
  turns: number
  qcd: QCDState
  score: number
}

// 後方互換性のためのエイリアス（既存コンポーネント向け）
export type { QCDState as QCD }
