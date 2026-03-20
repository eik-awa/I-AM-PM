import type { PersonnelCard, TaskCard } from '../types/card'
import type { SkillEffect } from '../types/skill'

// スキル適性係数
function skillMultiplier(personnel: PersonnelCard, task: TaskCard): number {
  if (personnel.skills.includes(task.requiredSkill)) return 1.5
  if (personnel.skills.includes('general') || task.requiredSkill === 'general') return 1.0
  return 0.5
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

export interface ProgressResult {
  taskId: string
  progressGained: number
  bugsAdded: number
  skillPointsEarned: number  // タスク完了時にstoreで計算、ここでは常に0
}

export function calculateProgress(
  task: TaskCard,
  assignedPersonnel: PersonnelCard[],
  skillEffects: SkillEffect = {},
): ProgressResult {
  if (task.status === 'done' || task.status === 'locked' || task.status === 'failed') {
    return { taskId: task.id, progressGained: 0, bugsAdded: 0, skillPointsEarned: 0 }
  }

  const continuityMult = skillEffects.continuityBonusMultiplier ?? 1.0

  let totalOutput = 0
  for (const p of assignedPersonnel) {
    const base = p.productivity + (skillEffects.productivityBonus ?? 0)
    const skill = skillMultiplier(p, task)
    const continuity = continuityBonus(p.turnsOnTask) * continuityMult
    const condition = conditionMultiplier(p.condition)
    totalOutput += base * skill * continuity * condition
  }

  const team = teamMultiplier(assignedPersonnel.length)
  const fire = fireMultiplier(task)
  const diff = difficultyMultiplier(task.difficulty)

  const progress = Math.round(totalOutput * team * fire * diff)

  // バグ計算（スキルでバグ率軽減）
  const bugRateMult = skillEffects.bugRateMultiplier ?? 1.0
  let bugProb = 0
  for (const p of assignedPersonnel) {
    bugProb += p.bugRate * bugRateMult * task.difficulty * 0.5
  }
  const bugsAdded = Math.random() < bugProb ? 1 : 0

  return { taskId: task.id, progressGained: progress, bugsAdded, skillPointsEarned: 0 }
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
