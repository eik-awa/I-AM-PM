import type { PersonnelCard, TaskCard } from '../types/card'
import type { SkillEffect } from '../types/skill'
import type { ComboEffect } from '../types/combo'

// スキル適性係数
function skillMultiplier(personnel: PersonnelCard, task: TaskCard): number {
  if (personnel.skills.includes(task.requiredSkill)) return 1.5
  if (personnel.skills.includes('general') || task.requiredSkill === 'general') return 1.0
  return 0.5
}

// エンジニアスキル係数（技術力が生産性全体に影響）
// 50基準(1.0x)、100で1.5x、0で0.5x
function engineeringSkillMultiplier(skill: number): number {
  return 0.5 + (skill / 100)
}

// マネジメントスキル係数（上流工程タスクのみ追加ボーナス）
// requiredSkill === 'general' を上流工程として判定
// 0で0%、50で+25%、100で+50%のボーナス
function managementMultiplier(skill: number, task: TaskCard): number {
  if (task.requiredSkill !== 'general') return 1.0
  return 1.0 + skill / 200
}

// コミュニケーションスキルによるバグ率補正
// 低いと認識齟齬が発生しバグが増加
// 0で+1.5x、50で+1.0x(基準)、100で+0.6x
function communicationBugMultiplier(skill: number): number {
  return 1.5 - (skill / 100) * 0.9
}

// 継続ターンボーナス
function continuityBonus(turnsOnTask: number): number {
  if (turnsOnTask >= 3) return 1.4
  if (turnsOnTask >= 1) return 1.2
  return 1.0
}

// コンディション係数
function conditionMultiplier(condition: number): number {
  return 0.4 + (condition / 100) * 0.6
}

// 炎上ペナルティ
function fireMultiplier(task: TaskCard): number {
  const hasFire = task.statusEffects.some(e => e.type === 'fire')
  return hasFire ? 0.7 : 1.0
}

// 難易度係数
function difficultyMultiplier(difficulty: number): number {
  if (difficulty === 3) return 0.7
  if (difficulty === 2) return 0.85
  return 1.0
}

// チーム係数（複数人アサイン時の逓減）
function teamMultiplier(count: number): number {
  if (count >= 3) return 0.7
  if (count === 2) return 0.85
  return 1.0
}

// 実際の出力をactualOutputRangeでランダム化（隠れた個性）
function actualOutput(personnel: PersonnelCard, base: number): number {
  const [min, max] = personnel.actualOutputRange
  // 1回目使用はブレなし（表示通り）、2回目以降からブレが出る
  if (personnel.analysisCount < 1) return base
  const variance = Math.random() * (max - min) + min
  return variance
}

export interface ProgressResult {
  taskId: string
  progressGained: number
  bugsAdded: number
  skillPointsEarned: number  // タスク完了時にstoreで計算、ここでは常に0
}

// アクティブなコンボ効果をマージして単一のComboEffectに集約
export function mergeComboEffects(effects: ComboEffect[]): ComboEffect {
  return effects.reduce<ComboEffect>((acc, e) => ({
    bugRateMultiplier: (acc.bugRateMultiplier ?? 1.0) * (e.bugRateMultiplier ?? 1.0),
    productivityMultiplier: (acc.productivityMultiplier ?? 1.0) * (e.productivityMultiplier ?? 1.0),
    eventProbMultiplier: (acc.eventProbMultiplier ?? 1.0) * (e.eventProbMultiplier ?? 1.0),
    personnelProductivityMultiplier: e.personnelProductivityMultiplier ?? acc.personnelProductivityMultiplier,
    nextEventPreview: acc.nextEventPreview || e.nextEventPreview,
  }), {})
}

export function calculateProgress(
  task: TaskCard,
  assignedPersonnel: PersonnelCard[],
  skillEffects: SkillEffect = {},
  comboEffect: ComboEffect = {},
  awakeningPersonnelId?: string,  // 覚醒コンボが有効な人員ID
): ProgressResult {
  if (task.status === 'done' || task.status === 'locked' || task.status === 'failed') {
    return { taskId: task.id, progressGained: 0, bugsAdded: 0, skillPointsEarned: 0 }
  }

  const continuityMult = skillEffects.continuityBonusMultiplier ?? 1.0
  const comboProductivityMult = comboEffect.productivityMultiplier ?? 1.0
  const comboPersonnelMult = comboEffect.personnelProductivityMultiplier ?? 1.0

  let totalOutput = 0
  for (const p of assignedPersonnel) {
    const base = actualOutput(p, p.productivity + (skillEffects.productivityBonus ?? 0))
    const skill = skillMultiplier(p, task)
    const continuity = continuityBonus(p.turnsOnTask) * continuityMult
    const condition = conditionMultiplier(p.condition)
    // 覚醒コンボ: 山田新人が対象の場合、個別出力倍率を適用
    const awakeningMult = (awakeningPersonnelId && p.id === awakeningPersonnelId) ? comboPersonnelMult : 1.0
    // エンジニアスキル・マネジメントスキルの影響
    const engMult = engineeringSkillMultiplier(p.engineeringSkill)
    const mgtMult = managementMultiplier(p.managementSkill, task)
    totalOutput += base * skill * continuity * condition * awakeningMult * engMult * mgtMult
  }

  const team = teamMultiplier(assignedPersonnel.length)
  const fire = fireMultiplier(task)
  const diff = difficultyMultiplier(task.difficulty)

  const progress = Math.round(totalOutput * team * fire * diff * comboProductivityMult)

  // バグ計算（スキル・コンボ・コミュニケーションスキルでバグ率変動）
  const bugRateMult = (skillEffects.bugRateMultiplier ?? 1.0) * (comboEffect.bugRateMultiplier ?? 1.0)
  let bugProb = 0
  for (const p of assignedPersonnel) {
    const commMult = communicationBugMultiplier(p.communicationSkill)
    bugProb += p.bugRate * bugRateMult * commMult * task.difficulty * 0.5
  }
  const bugsAdded = Math.random() < bugProb ? 1 : 0

  return { taskId: task.id, progressGained: progress, bugsAdded, skillPointsEarned: 0 }
}

// 疲弊度係数
function fatigueMult(fatigue: number): number {
  if (fatigue >= 90) return 0.6
  if (fatigue >= 70) return 0.8
  return 1.0
}

// アサイン時の予想出力（ランダム要素なし・表示用）
export function estimateOutputForPersonnel(
  personnel: PersonnelCard,
  task: TaskCard,
  currentPersonnelOnTask: PersonnelCard[], // このタスクに既にアサイン済みの人員（自分を除く）
): number {
  const base = personnel.productivity
  const skill = skillMultiplier(personnel, task)
  const continuity = continuityBonus(personnel.turnsOnTask)
  const condition = conditionMultiplier(personnel.condition)
  const engMult = engineeringSkillMultiplier(personnel.engineeringSkill)
  const mgtMult = managementMultiplier(personnel.managementSkill, task)
  const fatigueMultiplier = fatigueMult(personnel.fatigue ?? 0)
  const output = base * skill * continuity * condition * engMult * mgtMult * fatigueMultiplier

  const teamCount = currentPersonnelOnTask.length + 1
  const team = teamMultiplier(teamCount)
  const diff = difficultyMultiplier(task.difficulty)

  return Math.round(output * team * diff)
}

// スコア計算（複数プロジェクト対応: 平均QCDを使用）
export function calculateFinalScore(
  quality: number,
  cost: number,
  budget: number,
  turnsUsed: number,
  totalTurns: number,
): number {
  const deliveryScore = turnsUsed <= totalTurns ? 100 : Math.max(0, 100 - (turnsUsed - totalTurns) * 15)
  const qualityScore = Math.max(0, Math.min(100, quality))
  const costScore = Math.max(0, Math.min(100, ((budget - cost) / budget) * 100 + 50))

  return Math.round(deliveryScore * 0.4 + qualityScore * 0.35 + costScore * 0.25)
}
