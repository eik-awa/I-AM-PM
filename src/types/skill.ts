export interface SkillEffect {
  bugRateMultiplier?: number         // 0.8 = バグ率20%減
  productivityBonus?: number         // +Npt/ターン追加
  handSizeBonus?: number             // 手札上限+N
  conditionRecoveryBonus?: number    // コンディション回復+N/週
  continuityBonusMultiplier?: number // 継続ボーナス倍率UP
  startQualityBonus?: number         // 初期品質+N
  eventProbReduction?: number        // イベント確率-N
  budgetBufferBonus?: number         // 予算超過ゲームオーバーライン+N
  qualityMinReduction?: number       // 品質ゲームオーバーライン-N
  personnelCostMultiplier?: number   // 人員コスト×N
}

export type SkillCategory = 'management' | 'tech' | 'leadership' | 'risk'

export interface SkillDef {
  id: string
  name: string
  description: string
  cost: number      // PMポイント消費
  tier: 1 | 2 | 3
  category: SkillCategory
  requires: string[]
  effect: SkillEffect
}
