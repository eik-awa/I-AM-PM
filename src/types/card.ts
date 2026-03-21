export type SkillTag = 'frontend' | 'backend' | 'infra' | 'qa' | 'design' | 'general'

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export type PersonnelType = 'engineer' | 'newcomer' | 'lead' | 'specialist'

// カラーセット用の属性
// tech(🔵)=バックエンド/インフラ系、drive(🟡)=フロントエンド/QA系
// adjust(🟢)=新人/リーダー/汎用系、blitz(🔴)=フリーランス/スペシャリスト混成
export type CardColor = 'tech' | 'drive' | 'adjust' | 'blitz'

export interface PersonnelCard {
  id: string
  type: 'personnel'
  rarity: CardRarity
  personnelType: PersonnelType
  name: string
  title: string
  skills: SkillTag[]
  color: CardColor           // シナジー用属性
  productivity: number      // ベース出力pt/ターン（表示用）
  actualOutputRange: [number, number] // 実際の出力幅 [min, max]
  bugRate: number           // ミス率 0-1
  costPerTurn: number       // 万円/ターン
  flavor: string
  personalEvents: string[]  // このメンバーが引き起こす可能性のあるイベントID
  // 実行時状態
  assignedTaskId?: string
  turnsOnTask: number       // 同一タスク継続ターン数
  condition: number         // コンディション 0-100
  analysisCount: number     // 使用回数（5回で全解析済みに）
  previousTaskId?: string   // 前ターン担当タスクID（連鎖判定用）
}

export type TaskStatus = 'locked' | 'ready' | 'in_progress' | 'done' | 'failed'

export interface TaskCard {
  id: string
  type: 'task'
  name: string
  description: string
  requiredSkill: SkillTag
  effortTotal: number       // 完了に必要なpt
  effortDone: number        // 現在の進捗pt
  difficulty: 1 | 2 | 3    // ★の数
  qualityImpact: number     // 完了時の品質への影響
  blockedBy: string[]       // 依存タスクID
  status: TaskStatus
  phaseId: string
  bugs: number              // 蓄積バグ数
  statusEffects: StatusEffect[]
  skillPointReward?: number // タスク完了時のスキルポイント（未指定なら difficulty*5）
}

export type StatusEffectType = 'fire' | 'stuck' | 'redesign' | 'debt'

export interface StatusEffect {
  type: StatusEffectType
  remainingTurns: number    // -1 = 永続
}

export type EventSeverity = 'positive' | 'neutral' | 'negative' | 'critical'

export interface EventChoice {
  id: string
  label: string
  description: string
  effects: GameEffect[]
}

export interface EventCard {
  id: string
  type: 'event'
  name: string
  description: string
  severity: EventSeverity
  choices: EventChoice[]
  flavor: string
}

export type EffectType =
  | 'quality_delta'
  | 'cost_delta'
  | 'delivery_delta'
  | 'progress_delta'       // タスクの進捗変化
  | 'progress_reset'       // 進捗リセット
  | 'add_bug'
  | 'remove_bug'
  | 'add_status'           // 状態異常付与
  | 'remove_status'        // 状態異常解除
  | 'remove_personnel'     // 人員離脱
  | 'draw_card'
  | 'block_task'

export interface GameEffect {
  type: EffectType
  value?: number
  targetTaskId?: string    // タスク対象
  statusType?: StatusEffectType
  targetPersonnelId?: string
}

export type Card = PersonnelCard | TaskCard | EventCard
