import type { CardColor, SkillTag } from './card'

export type ComboID =
  | 'combo_tech_set'
  | 'combo_drive_set'
  | 'combo_adjust_set'
  | 'combo_blitz_set'
  | 'combo_tanaka_chain'
  | 'combo_takahashi_chain'
  | 'combo_kimura_chain'
  | 'combo_yamada_awakening'

export type ComboType = 'colorSet' | 'personnelChain'

export interface ComboCondition {
  type: ComboType
  // colorSet用
  color?: CardColor
  minCount?: number           // 何枚同時稼働で発動（デフォルト3）
  // personnelChain用
  personnelId?: string
  requiredTaskSkill?: SkillTag // 現在担当タスクに必要なスキル
  minTurnsOnTask?: number      // 同一タスク継続ターン数
  requiresPreviousTask?: boolean // 前ターンも別タスクを担当していた
  taskHasBugs?: boolean        // タスクにバグが存在する
}

export interface ComboEffect {
  bugRateMultiplier?: number        // 例: 0.5 → バグ率-50%
  productivityMultiplier?: number   // 例: 1.3 → 出力+30%
  eventProbMultiplier?: number      // 例: 0.6 → イベント発生率-40%
  comboTurns?: number               // 効果持続ターン数（-1=条件継続中は永続）
  triggerFireAfterTurns?: number    // N+1ターン目に炎上イベントを強制発生
  nextEventPreview?: boolean        // 次ターンのイベントを事前開示
  personnelProductivityMultiplier?: number // 該当人員の個別出力倍率
}

export interface ComboRecipe {
  id: ComboID
  name: string
  type: ComboType
  condition: ComboCondition
  effect: ComboEffect
  isDiscovered: boolean
  flavorText: string
  description: string
}

export interface ActiveComboEffect {
  comboId: ComboID
  turnsActive: number      // 発動からの経過ターン
  turnsRemaining: number   // 残り効果ターン数（-1=条件が続く限り有効）
}
