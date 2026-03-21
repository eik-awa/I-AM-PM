import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  GameState, GameMode, ProjectInstance, WBSPhase, LogEntry,
  GanttEntry, GanttPlan, EventFlag, BossHint,
} from '../types/game'
import type { PersonnelCard, EventCard, TaskCard } from '../types/card'
import type { Mission, MissionDef } from '../types/mission'
import type { SkillEffect } from '../types/skill'
import type { ComboRecipe, ActiveComboEffect, ComboEffect } from '../types/combo'
import { PERSONNEL_CARDS, EVENT_CARDS } from '../constants/cards'
import { MISSION_POOL } from '../constants/missions'
import { SKILL_TREE } from '../constants/skills'
import { getScenariosForMode } from '../constants/scenarios'
import { GAME_MODES } from '../constants/gameModes'
import { COMBO_RECIPES } from '../constants/combos'
import { calculateProgress, calculateFinalScore, mergeComboEffects } from '../engine/progressEngine'
import { shuffle } from '../utils/random'

interface GameStore extends GameState {
  startTutorial: () => void
  startGameMode: (mode: GameMode) => void
  setActiveProject: (projectId: string) => void
  assignPersonnel: (personnelId: string, taskId: string, projectId?: string) => void
  unassignPersonnel: (personnelId: string) => void
  planAssignment: (personnelId: string, taskId: string, projectId: string, turn: number) => void
  cancelPlan: (personnelId: string, turn: number) => void
  endTurn: () => void
  resolveEvent: (eventId: string, choiceId: string) => void
  dismissEvent: () => void
  dismissComboActivation: () => void
  goToTitle: () => void
  addLog: (msg: string, type: LogEntry['type']) => void
  unlockSkill: (skillId: string) => void
  getActiveSkillEffects: () => SkillEffect
}

// ── ヘルパー関数 ──────────────────────────────────────────

function deepCopyPhases(phases: WBSPhase[]): WBSPhase[] {
  return phases.map(ph => ({
    ...ph,
    tasks: ph.tasks.map(t => ({ ...t, statusEffects: [...t.statusEffects] })),
  }))
}

function findTaskInProject(project: ProjectInstance, taskId: string): TaskCard | undefined {
  for (const ph of project.phases) {
    const t = ph.tasks.find(t => t.id === taskId)
    if (t) return t
  }
  return undefined
}

function findTaskInPhases(phases: WBSPhase[], taskId: string): TaskCard | undefined {
  for (const ph of phases) {
    const t = ph.tasks.find(t => t.id === taskId)
    if (t) return t
  }
  return undefined
}

function mergeSkillEffects(skillIds: string[]): SkillEffect {
  const effects: SkillEffect = {}
  for (const id of skillIds) {
    const skill = SKILL_TREE.find(s => s.id === id)
    if (!skill) continue
    const e = skill.effect
    effects.bugRateMultiplier = (effects.bugRateMultiplier ?? 1.0) * (e.bugRateMultiplier ?? 1.0)
    effects.productivityBonus = (effects.productivityBonus ?? 0) + (e.productivityBonus ?? 0)
    effects.handSizeBonus = (effects.handSizeBonus ?? 0) + (e.handSizeBonus ?? 0)
    effects.conditionRecoveryBonus = (effects.conditionRecoveryBonus ?? 0) + (e.conditionRecoveryBonus ?? 0)
    effects.continuityBonusMultiplier = (effects.continuityBonusMultiplier ?? 1.0) * (e.continuityBonusMultiplier ?? 1.0)
    effects.startQualityBonus = (effects.startQualityBonus ?? 0) + (e.startQualityBonus ?? 0)
    effects.eventProbReduction = (effects.eventProbReduction ?? 0) + (e.eventProbReduction ?? 0)
    effects.budgetBufferBonus = (effects.budgetBufferBonus ?? 0) + (e.budgetBufferBonus ?? 0)
    effects.qualityMinReduction = (effects.qualityMinReduction ?? 0) + (e.qualityMinReduction ?? 0)
    effects.personnelCostMultiplier = (effects.personnelCostMultiplier ?? 1.0) * (e.personnelCostMultiplier ?? 1.0)
  }
  return effects
}

function buildInitialDeck(mode: GameMode, unlockedCharIds: string[]): PersonnelCard[] {
  const starters = [
    PERSONNEL_CARDS.find(p => p.id === 'p_tanaka')!,
    PERSONNEL_CARDS.find(p => p.id === 'p_sato')!,
    PERSONNEL_CARDS.find(p => p.id === 'p_yamada')!,
  ]
  // Only include unlocked non-starter characters
  const extra = PERSONNEL_CARDS.filter(p =>
    !['p_tanaka', 'p_sato', 'p_yamada'].includes(p.id) &&
    unlockedCharIds.includes(p.id)
  )

  let deckSize = 4
  if (mode === 'large_scale') deckSize = 5
  if (mode === 'multi_project') deckSize = 7
  if (mode === 'expert') deckSize = 8

  // beginner/tutorialはスターター3枚のみ
  if (mode === 'beginner' || mode === 'tutorial') deckSize = 3

  const extraPick = shuffle([...extra]).slice(0, Math.max(0, deckSize - 3))
  return shuffle([...starters, ...extraPick])
}

function selectMissions(mode: GameMode): Mission[] {
  const modeConfig = GAME_MODES.find(m => m.id === mode)
  const missionIds = modeConfig?.missionIds ?? []
  const picked = missionIds
    .map(id => MISSION_POOL.find(m => m.id === id))
    .filter((m): m is MissionDef => !!m)
  // If fewer than 3, pad with complete_game
  while (picked.length < 3 && picked.length < MISSION_POOL.length) {
    const fallback = MISSION_POOL.find(m => !picked.find(p => p.id === m.id))
    if (fallback) picked.push(fallback)
    else break
  }
  return picked.map(def => ({ ...def, status: 'active' as const, progress: 0 }))
}

function buildProjectInstances(mode: GameMode, startQuality: number): ProjectInstance[] {
  const scenarios = getScenariosForMode(mode)
  return scenarios.map((scenario, idx) => ({
    id: `proj_${scenario.id}_${idx}`,
    scenarioId: scenario.id,
    name: scenario.name,
    phases: deepCopyPhases(scenario.phases),
    qcd: {
      quality: Math.min(100, startQuality),
      cost: 0,
      budget: scenario.budget,
      delivery: 0,
    },
    status: 'active' as const,
    completedTaskIds: [],
  }))
}

// ── コンボ判定ヘルパー ─────────────────────────────────────

function evaluateComboConditions(
  activePersonnel: PersonnelCard[],
  projects: ProjectInstance[],
): ComboRecipe[] {
  const active: ComboRecipe[] = []
  for (const recipe of COMBO_RECIPES) {
    const cond = recipe.condition
    if (cond.type === 'colorSet') {
      const color = cond.color!
      const minCount = cond.minCount ?? 3
      const count = activePersonnel.filter(p => p.assignedTaskId && p.color === color).length
      if (count >= minCount) active.push(recipe)
    } else if (cond.type === 'personnelChain') {
      const person = activePersonnel.find(p => p.id === cond.personnelId)
      if (!person || !person.assignedTaskId) continue
      // 担当タスクを取得
      let task: TaskCard | undefined
      for (const proj of projects) {
        task = findTaskInProject(proj, person.assignedTaskId)
        if (task) break
      }
      if (!task) continue
      if (cond.requiredTaskSkill && task.requiredSkill !== cond.requiredTaskSkill) continue
      if (cond.requiresPreviousTask && !person.previousTaskId) continue
      if (cond.minTurnsOnTask && person.turnsOnTask < cond.minTurnsOnTask) continue
      if (cond.taskHasBugs && task.bugs === 0) continue
      active.push(recipe)
    }
  }
  return active
}

function getTotalTurnsForMode(mode: GameMode): number {
  const scenarios = getScenariosForMode(mode)
  return Math.max(...scenarios.map(s => s.totalTurns))
}

function generateBossHints(
  eventFlags: EventFlag[],
  projects: ProjectInstance[],
  result: 'won' | 'lost',
): BossHint[] {
  const hints: BossHint[] = []

  const overtimeCount = eventFlags.filter(f => f.eventId === 'e_overtime' && f.choiceId === 'allow').length
  const specChangeCount = eventFlags.filter(f => f.eventId === 'e_spec_change_minor' || f.eventId === 'e_spec_change_major').length
  const reviewCount = eventFlags.filter(f => f.eventId === 'e_code_review_find').length
  const totalBugs = projects.flatMap(p => p.phases.flatMap(ph => ph.tasks)).reduce((s, t) => s + t.bugs, 0)
  const avgQuality = projects.length > 0
    ? projects.reduce((s, p) => s + p.qcd.quality, 0) / projects.length
    : 0

  if (overtimeCount >= 2) {
    hints.push({
      id: 'hint_overtime',
      condition: `残業を${overtimeCount}回承認した`,
      message: '残業に頼りすぎると、チームが疲弊して後半のパフォーマンスが落ちます。',
      advice: '早めのリスク検出と人員の適切な配置で、残業ゼロを目指しましょう。',
    })
  }

  if (specChangeCount >= 2) {
    hints.push({
      id: 'hint_spec_change',
      condition: `仕様変更が${specChangeCount}回発生した`,
      message: '仕様変更が多発しています。要件定義フェーズでのすり合わせが不十分かもしれません。',
      advice: 'プロジェクト初期にステークホルダーとのアライメントを徹底することで変更を減らせます。',
    })
  }

  if (totalBugs >= 5) {
    hints.push({
      id: 'hint_bugs',
      condition: `蓄積バグが${totalBugs}個`,
      message: 'バグが多く蓄積しています。品質への影響が出ています。',
      advice: 'コードレビューをスキルツリーで習得し、QAエンジニアを早めにアサインしましょう。',
    })
  }

  if (avgQuality < 50 && result === 'lost') {
    hints.push({
      id: 'hint_quality',
      condition: `品質が${Math.round(avgQuality)}で終了`,
      message: '品質管理が追いつきませんでした。',
      advice: '各タスクのqualityImpactが高いものを優先して完了させ、バグを溜めないよう注意しましょう。',
    })
  }

  if (reviewCount >= 1) {
    hints.push({
      id: 'hint_review_good',
      condition: `コードレビューで${reviewCount}回バグを発見`,
      message: 'コードレビューが効果的でした！早期発見は品質維持の鍵です。',
      advice: 'レビューの習慣を継続し、QAエンジニアとの連携をさらに強化しましょう。',
    })
  }

  if (result === 'won' && hints.length === 0) {
    hints.push({
      id: 'hint_congrats',
      condition: 'プロジェクト完遂',
      message: 'お見事！プロジェクトを成功させました。',
      advice: '次はより難しいモードに挑戦して、PMとしての経験値を積みましょう。',
    })
  }

  return hints.slice(0, 4)
}

// ── 初期状態 ─────────────────────────────────────────────

const initialState: GameState = {
  status: 'title',
  mode: 'standard',
  projects: [],
  activeProjectId: '',
  turn: { current: 1, max: 10, phase: 'planning' },
  hand: [],
  deck: [],
  discard: [],
  activePersonnel: [],
  pendingEvents: [],
  activeEvent: null,
  ganttHistory: [],
  ganttPlan: [],
  eventFlags: [],
  bossHints: [],
  skillPoints: 0,
  log: [],
  missions: [],
  missionStats: { maxTasksInOneTurn: 0, maxSimultaneousPersonnel: 0 },
  discoveredCombos: [],
  activeComboEffects: [],
  pendingComboActivation: null,
  nextEventPreview: null,
  totalRuns: 0,
  bestScore: 0,
  pmPoints: 0,
  unlockedSkills: [],
  clearedModes: [],
  completedMissionsByMode: {},
  unlockedCharacterIds: ['p_tanaka', 'p_sato', 'p_yamada'],
}

// ── Store ────────────────────────────────────────────────

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      getActiveSkillEffects: () => mergeSkillEffects(get().unlockedSkills),

      unlockSkill: (skillId) => {
        const state = get()
        const skill = SKILL_TREE.find(s => s.id === skillId)
        if (!skill) return
        if (state.unlockedSkills.includes(skillId)) return
        if (state.pmPoints < skill.cost) return
        const allReqsMet = skill.requires.every(r => state.unlockedSkills.includes(r))
        if (!allReqsMet) return
        set({
          pmPoints: state.pmPoints - skill.cost,
          unlockedSkills: [...state.unlockedSkills, skillId],
        })
      },

      startTutorial: () => {
        set({ status: 'tutorial' })
      },

      startGameMode: (mode: GameMode) => {
        const state = get()
        const skillEffects = mergeSkillEffects(state.unlockedSkills)
        const startQuality = 70 + (skillEffects.startQualityBonus ?? 0)
        const projects = buildProjectInstances(mode, startQuality)
        const totalTurns = getTotalTurnsForMode(mode)

        const fullDeck = buildInitialDeck(mode, state.unlockedCharacterIds)
        const handSize = 4 + (skillEffects.handSizeBonus ?? 0)
        const hand = fullDeck.splice(0, handSize)

        set({
          status: 'playing',
          mode,
          projects,
          activeProjectId: projects[0]?.id ?? '',
          turn: { current: 1, max: totalTurns, phase: 'planning' },
          hand,
          deck: fullDeck,
          discard: [],
          activePersonnel: [],
          pendingEvents: [],
          activeEvent: null,
          ganttHistory: [],
          ganttPlan: [],
          eventFlags: [],
          bossHints: [],
          skillPoints: 0,
          log: [{ turn: 1, message: 'プロジェクト開始。最初の一手を考えよう。', type: 'info' }],
          missions: selectMissions(mode),
          missionStats: { maxTasksInOneTurn: 0, maxSimultaneousPersonnel: 0 },
          discoveredCombos: [],
          activeComboEffects: [],
          pendingComboActivation: null,
          nextEventPreview: null,
        })
      },

      setActiveProject: (projectId: string) => {
        set({ activeProjectId: projectId })
      },

      planAssignment: (personnelId, taskId, projectId, turn) => {
        const state = get()
        // 同ターン・同人員の既存プランを置き換え
        const filtered = state.ganttPlan.filter(
          p => !(p.personnelId === personnelId && p.plannedTurn === turn)
        )
        set({
          ganttPlan: [...filtered, { personnelId, taskId, projectId, plannedTurn: turn }],
        })
      },

      cancelPlan: (personnelId, turn) => {
        const state = get()
        set({
          ganttPlan: state.ganttPlan.filter(
            p => !(p.personnelId === personnelId && p.plannedTurn === turn)
          ),
        })
      },

      assignPersonnel: (personnelId, taskId, projectId?) => {
        const state = get()
        const targetProjectId = projectId ?? state.activeProjectId
        const project = state.projects.find(p => p.id === targetProjectId)
        if (!project) return

        const cardInHand = state.hand.find(c => c.id === personnelId) as PersonnelCard | undefined

        if (!cardInHand) {
          // 既にアクティブな人員の再アサイン
          const active = state.activePersonnel.find(p => p.id === personnelId)
          if (!active) return

          const task = findTaskInProject(project, taskId)
          if (!task || task.status === 'done' || task.status === 'locked') return

          const updatedPersonnel = state.activePersonnel.map(p => {
            if (p.id === personnelId) {
              return {
                ...p,
                assignedTaskId: taskId,
                turnsOnTask: p.assignedTaskId === taskId ? p.turnsOnTask : 0,
                condition: p.assignedTaskId !== taskId ? Math.max(50, p.condition - 10) : p.condition,
              }
            }
            return p
          })
          set({ activePersonnel: updatedPersonnel })
          return
        }

        const task = findTaskInProject(project, taskId)
        if (!task || task.status === 'done' || task.status === 'locked') return

        const newPersonnel: PersonnelCard = { ...cardInHand, assignedTaskId: taskId, turnsOnTask: 0 }
        const newHand = state.hand.filter(c => c.id !== personnelId)

        set({
          hand: newHand,
          activePersonnel: [...state.activePersonnel, newPersonnel],
        })
        get().addLog(`${cardInHand.name} を ${task.name} にアサイン`, 'info')
      },

      unassignPersonnel: (personnelId) => {
        const state = get()
        const updated = state.activePersonnel.map(person =>
          person.id === personnelId
            ? { ...person, assignedTaskId: undefined, turnsOnTask: 0 }
            : person
        )
        set({ activePersonnel: updated })
      },

      endTurn: () => {
        const state = get()
        if (state.turn.phase !== 'planning') return

        const skillEffects = mergeSkillEffects(state.unlockedSkills)
        const newLogs: LogEntry[] = []
        let totalCostThisTurn = 0
        let tasksCompletedThisTurn = 0
        let totalSkillPointsEarned = state.skillPoints
        const newEventFlags: EventFlag[] = [...state.eventFlags]
        const newGanttHistory: GanttEntry[] = [...state.ganttHistory]

        const costMult = skillEffects.personnelCostMultiplier ?? 1.0
        for (const p of state.activePersonnel) {
          totalCostThisTurn += Math.round(p.costPerTurn * costMult)
        }
        // 手札の人員にも待機コスト（50%）
        for (const p of state.hand) {
          totalCostThisTurn += Math.round(p.costPerTurn * costMult * 0.5)
        }

        // ── コンボ判定 ────────────────────────────────────────
        const currentCombos = evaluateComboConditions(state.activePersonnel, state.projects)
        const newlyDiscovered = currentCombos.filter(c => !state.discoveredCombos.includes(c.id))

        // アクティブコンボエフェクトの更新
        // blitzコンボの持続ターン数を管理
        const prevActiveComboEffects = state.activeComboEffects
        const updatedActiveEffects: ActiveComboEffect[] = []
        for (const recipe of currentCombos) {
          const existing = prevActiveComboEffects.find(e => e.comboId === recipe.id)
          if (existing) {
            const newTurnsActive = existing.turnsActive + 1
            const turnsRemaining = recipe.effect.comboTurns
              ? recipe.effect.comboTurns - newTurnsActive
              : -1
            if (turnsRemaining === undefined || turnsRemaining >= 0 || turnsRemaining === -1) {
              updatedActiveEffects.push({
                comboId: recipe.id,
                turnsActive: newTurnsActive,
                turnsRemaining: turnsRemaining,
              })
            }
          } else {
            updatedActiveEffects.push({
              comboId: recipe.id,
              turnsActive: 1,
              turnsRemaining: recipe.effect.comboTurns ? recipe.effect.comboTurns - 1 : -1,
            })
          }
        }

        // 有効なコンボエフェクトをマージ（期限切れを除外）
        const effectiveComboEffects = updatedActiveEffects
          .filter(e => e.turnsRemaining === -1 || e.turnsRemaining >= 0)
          .map(e => COMBO_RECIPES.find(r => r.id === e.comboId)?.effect ?? {} as ComboEffect)
        const mergedComboEffect = mergeComboEffects(effectiveComboEffects)

        // blitzコンボ: 4ターン目に炎上イベントを強制発生
        const blitzEffect = updatedActiveEffects.find(e => e.comboId === 'combo_blitz_set')
        const shouldTriggerBlitzFire = blitzEffect && blitzEffect.turnsActive >= 4

        // 木村コンボ: nextEventPreviewを更新
        const hasKimuraCombo = updatedActiveEffects.some(e => e.comboId === 'combo_kimura_chain')

        // 覚醒コンボ: 山田新人が対象
        const awakeningEffect = updatedActiveEffects.find(e => e.comboId === 'combo_yamada_awakening')
        const awakeningPersonnelId = awakeningEffect ? 'p_yamada' : undefined

        // tech set コンボ: 品質への軽微なペナルティ（コミュニケーションコスト）
        const hasTechSet = updatedActiveEffects.some(e => e.comboId === 'combo_tech_set')

        // 新規発動ログ
        for (const c of newlyDiscovered) {
          newLogs.push({
            turn: state.turn.current,
            message: `🌟 コンボ発動！「${c.name}」— ${c.flavorText}`,
            type: 'success',
          })
        }
        if (newlyDiscovered.length > 0) {
          for (const c of currentCombos) {
            newLogs.push({
              turn: state.turn.current,
              message: `⚡ [${c.name}] 効果中`,
              type: 'info',
            })
          }
        }

        // ── 各プロジェクトの進捗計算 ─────────────────────────
        const updatedProjects: ProjectInstance[] = state.projects.map(project => {
          if (project.status !== 'active') return project

          const phases = deepCopyPhases(project.phases)
          let qualityDelta = 0
          // tech setコンボ: コミュニケーションコスト微増（品質-2）
          if (hasTechSet) qualityDelta -= 2
          const projectTasksCompleted: string[] = []

          for (const phase of phases) {
            for (const task of phase.tasks) {
              if (task.status !== 'in_progress' && task.status !== 'ready') continue

              const assigned = state.activePersonnel.filter(p => p.assignedTaskId === task.id)
              if (assigned.length === 0) continue

              task.status = 'in_progress'
              const result = calculateProgress(task, assigned, skillEffects, mergedComboEffect, awakeningPersonnelId)
              task.effortDone = Math.min(task.effortTotal, task.effortDone + result.progressGained)
              task.bugs += result.bugsAdded

              // ガント履歴記録
              newGanttHistory.push({
                turn: state.turn.current,
                projectId: project.id,
                taskId: task.id,
                personnelIds: assigned.map(p => p.id),
                effortSnapshot: task.effortDone,
              })

              if (result.progressGained > 0) {
                newLogs.push({
                  turn: state.turn.current,
                  message: `[${project.name}] ${task.name}：+${result.progressGained}pt（${Math.round(task.effortDone / task.effortTotal * 100)}%）`,
                  type: 'info',
                })
              }

              if (task.effortDone >= task.effortTotal) {
                task.status = 'done'
                task.effortDone = task.effortTotal
                qualityDelta += task.qualityImpact - task.bugs * 3
                tasksCompletedThisTurn++
                projectTasksCompleted.push(task.id)
                const spReward = task.skillPointReward ?? (task.difficulty * 5)
                totalSkillPointsEarned += spReward
                newLogs.push({
                  turn: state.turn.current,
                  message: `✅ [${project.name}] ${task.name} 完了！+${spReward}SP`,
                  type: 'success',
                })
              }
            }
          }

          // 依存関係チェック → ロック解除
          const allCompletedIds = [
            ...project.completedTaskIds,
            ...phases.flatMap(ph => ph.tasks.filter(t => t.status === 'done').map(t => t.id)),
          ]
          for (const phase of phases) {
            for (const task of phase.tasks) {
              if (task.status === 'locked') {
                const allDepsDone = task.blockedBy.every(dep => allCompletedIds.includes(dep))
                if (allDepsDone) task.status = 'ready'
              }
            }
          }

          // QCD更新
          const bugPenalty = phases.flatMap(ph => ph.tasks).reduce((sum, t) => sum + t.bugs, 0) * 2
          const newQuality = Math.max(0, Math.min(100, project.qcd.quality + qualityDelta - bugPenalty * 0.1))
          const newCost = project.qcd.cost + totalCostThisTurn

          const allTasks = phases.flatMap(ph => ph.tasks)
          const doneEffort = allTasks.reduce((s, t) => s + t.effortDone, 0)
          const totalEffort = allTasks.reduce((s, t) => s + t.effortTotal, 0)
          const deliveryProgress = totalEffort > 0 ? Math.round(doneEffort / totalEffort * 100) : 0

          // 勝利・敗北判定
          const allDone = allTasks.every(t => t.status === 'done')
          const qualityMin = Math.max(0, (project.phases[0]?.tasks[0]?.status ? 30 : 30) - (skillEffects.qualityMinReduction ?? 0))
          const budgetOverLimit = project.qcd.budget * (1.5 + (skillEffects.budgetBufferBonus ?? 0))

          let newStatus: ProjectInstance['status'] = 'active'
          if (allDone) {
            newStatus = 'won'
            newLogs.push({
              turn: state.turn.current,
              message: `🎉 [${project.name}] 全タスク完了！`,
              type: 'success',
            })
          } else if (newQuality < qualityMin || newCost > budgetOverLimit) {
            newStatus = 'lost'
            newLogs.push({
              turn: state.turn.current,
              message: `💀 [${project.name}] プロジェクト失敗`,
              type: 'danger',
            })
          }

          return {
            ...project,
            phases,
            qcd: { ...project.qcd, quality: newQuality, cost: newCost, delivery: deliveryProgress },
            status: newStatus,
            completedTaskIds: [
              ...project.completedTaskIds,
              ...allTasks.filter(t => t.status === 'done').map(t => t.id),
            ],
          }
        })

        // ── 人員の継続ターン更新 ──────────────────────────────
        // 完了タスクIDを収集（全プロジェクト横断）
        const allCompletedTaskIds = new Set(
          updatedProjects.flatMap(proj =>
            proj.phases.flatMap(ph => ph.tasks.filter(t => t.status === 'done').map(t => t.id))
          )
        )
        const conditionRecovery = 5 + (skillEffects.conditionRecoveryBonus ?? 0)
        const updatedPersonnel = state.activePersonnel.map(p => {
          // タスクが完了していたらアサインをクリアして待機状態に（activePersonnelには残る）
          if (p.assignedTaskId && allCompletedTaskIds.has(p.assignedTaskId)) {
            return {
              ...p,
              assignedTaskId: undefined,
              turnsOnTask: 0,
              condition: Math.min(100, p.condition + conditionRecovery),
            }
          }
          if (p.assignedTaskId) {
            return { ...p, turnsOnTask: p.turnsOnTask + 1 }
          }
          return { ...p, condition: Math.min(100, p.condition + conditionRecovery) }
        })

        // ── ミッション統計更新 ─────────────────────────────────
        const assignedCount = state.activePersonnel.filter(p => p.assignedTaskId).length
        const newMissionStats = {
          maxTasksInOneTurn: Math.max(state.missionStats.maxTasksInOneTurn, tasksCompletedThisTurn),
          maxSimultaneousPersonnel: Math.max(state.missionStats.maxSimultaneousPersonnel, assignedCount),
        }

        let missions = state.missions.map(m => {
          if (m.status !== 'active') return m
          if (m.conditionType === 'simultaneous_personnel') {
            const val = m.conditionValue ?? 3
            if (assignedCount >= val) return { ...m, status: 'completed' as const, progress: 100 }
            return { ...m, progress: Math.round((assignedCount / val) * 100) }
          }
          if (m.conditionType === 'tasks_in_one_turn') {
            const val = m.conditionValue ?? 2
            const best = Math.max(newMissionStats.maxTasksInOneTurn, tasksCompletedThisTurn)
            if (best >= val) return { ...m, status: 'completed' as const, progress: 100 }
            return { ...m, progress: Math.round((best / val) * 100) }
          }
          return m
        })

        newLogs.push({
          turn: state.turn.current,
          message: `週次コスト：${totalCostThisTurn}万円`,
          type: 'info',
        })

        // ── 全体勝敗チェック ──────────────────────────────────
        const allProjectsWon = updatedProjects.every(p => p.status === 'won')
        const anyProjectLost = updatedProjects.some(p => p.status === 'lost')
        const nextTurn = state.turn.current + 1

        if (allProjectsWon || anyProjectLost) {
          const finalResult = allProjectsWon ? 'won' : 'lost'
          const avgQuality = updatedProjects.reduce((s, p) => s + p.qcd.quality, 0) / updatedProjects.length
          const avgBudget = updatedProjects.reduce((s, p) => s + p.qcd.budget, 0) / updatedProjects.length
          const avgCost = updatedProjects.reduce((s, p) => s + p.qcd.cost, 0) / updatedProjects.length
          const score = calculateFinalScore(avgQuality, avgCost, avgBudget, state.turn.current, state.turn.max)

          const bossHints = generateBossHints(newEventFlags, updatedProjects, finalResult)

          if (allProjectsWon) {
            const completedMissions = evaluateMissionsOnWin(missions, {
              quality: avgQuality,
              turnPercent: (state.turn.current / state.turn.max) * 100,
              budgetPercent: (avgCost / avgBudget) * 100,
              totalBugs: updatedProjects.flatMap(p => p.phases.flatMap(ph => ph.tasks)).reduce((s, t) => s + t.bugs, 0),
              maxTasksInOneTurn: newMissionStats.maxTasksInOneTurn,
              maxSimultaneousPersonnel: newMissionStats.maxSimultaneousPersonnel,
            })
            const earnedPoints = completedMissions
              .filter(m => m.status === 'completed')
              .filter(m => !state.missions.find(sm => sm.id === m.id && sm.status === 'completed'))
              .reduce((sum, m) => sum + m.reward, 0)

            const modeConfig = GAME_MODES.find(m => m.id === state.mode)
            const newClearedModes = state.clearedModes.includes(state.mode)
              ? state.clearedModes
              : [...state.clearedModes, state.mode]
            const newUnlockedCharIds = [...new Set([
              ...state.unlockedCharacterIds,
              ...(modeConfig?.unlocksCharacters ?? []),
            ])]
            const existingForMode = state.completedMissionsByMode[state.mode] ?? []
            const newCompletedMissionsByMode = {
              ...state.completedMissionsByMode,
              [state.mode]: [...new Set([
                ...existingForMode,
                ...completedMissions.filter(m => m.status === 'completed').map(m => m.id),
              ])],
            }

            set({
              status: 'won',
              projects: updatedProjects,
              activePersonnel: updatedPersonnel,
              ganttHistory: newGanttHistory,
              eventFlags: newEventFlags,
              bossHints,
              skillPoints: totalSkillPointsEarned,
              log: [...state.log, ...newLogs],
              bestScore: Math.max(state.bestScore, score),
              totalRuns: state.totalRuns + 1,
              missions: completedMissions,
              missionStats: newMissionStats,
              pmPoints: state.pmPoints + earnedPoints,
              clearedModes: newClearedModes,
              completedMissionsByMode: newCompletedMissionsByMode,
              unlockedCharacterIds: newUnlockedCharIds,
            })
          } else {
            set({
              status: 'lost',
              projects: updatedProjects,
              activePersonnel: updatedPersonnel,
              ganttHistory: newGanttHistory,
              eventFlags: newEventFlags,
              bossHints,
              skillPoints: totalSkillPointsEarned,
              log: [...state.log, ...newLogs],
              totalRuns: state.totalRuns + 1,
              missions,
              missionStats: newMissionStats,
            })
          }
          return
        }

        if (nextTurn > state.turn.max) {
          const bossHints = generateBossHints(newEventFlags, updatedProjects, 'lost')
          set({
            status: 'lost',
            projects: updatedProjects,
            activePersonnel: updatedPersonnel,
            ganttHistory: newGanttHistory,
            eventFlags: newEventFlags,
            bossHints,
            skillPoints: totalSkillPointsEarned,
            log: [
              ...state.log, ...newLogs,
              { turn: state.turn.current, message: 'タイムアップ！納期を達成できませんでした', type: 'danger' },
            ],
            totalRuns: state.totalRuns + 1,
            missions,
            missionStats: newMissionStats,
          })
          return
        }

        // ── ドロー ─────────────────────────────────────────────
        const handLimit = 6 + (skillEffects.handSizeBonus ?? 0)
        let newDeck = [...state.deck]
        let newDiscard = [...state.discard]
        let newHand = [...state.hand]

        for (let i = 0; i < 2; i++) {
          if (newDeck.length === 0) {
            newDeck = shuffle(newDiscard)
            newDiscard = []
          }
          if (newDeck.length > 0) newHand.push(newDeck.shift()!)
        }
        if (newHand.length > handLimit) {
          newDiscard = [...newDiscard, ...newHand.splice(handLimit)]
        }

        // ── 人員のpreviousTaskId更新 ──────────────────────────
        const updatedPersonnelWithPrev = updatedPersonnel.map(p => ({
          ...p,
          previousTaskId: p.assignedTaskId ?? p.previousTaskId,
          analysisCount: p.assignedTaskId ? p.analysisCount + 1 : p.analysisCount,
        }))

        // ── イベント発生（アクティブメンバーのpersonalEventsから） ──
        const pendingEvents: EventCard[] = []
        const eventReduction = skillEffects.eventProbReduction ?? 0
        // adjustコンボでイベント発生率を減少
        const comboEventMult = mergedComboEffect.eventProbMultiplier ?? 1.0
        const eventProb = Math.max(0, (0.25 + (nextTurn / state.turn.max) * 0.2 - eventReduction) * comboEventMult)

        // blitz炎上強制発生
        if (shouldTriggerBlitzFire) {
          const fireEvent = EVENT_CARDS.find(e => e.id === 'e_fire')
          if (fireEvent) pendingEvents.push(fireEvent)
          newLogs.push({
            turn: state.turn.current,
            message: '🔥 神速チームの代償…炎上発生！',
            type: 'danger',
          })
        } else if (Math.random() < eventProb) {
          // 木村コンボ: nextEventPreviewが設定されている場合、そのイベントを引く
          if (hasKimuraCombo && state.nextEventPreview) {
            const previewEvent = EVENT_CARDS.find(e => e.id === state.nextEventPreview)
            if (previewEvent) pendingEvents.push(previewEvent)
          } else {
            // アクティブメンバーのpersonalEventsから選択
            const allPersonalEvents = state.activePersonnel.flatMap(p => p.personalEvents)
            const uniqueEventIds = [...new Set(allPersonalEvents)]
            const availableEvents = EVENT_CARDS.filter(e => uniqueEventIds.includes(e.id))
            const fallbackEvents = EVENT_CARDS.filter(e => e.severity !== 'positive' || Math.random() < 0.3)
            const pool = availableEvents.length > 0 ? availableEvents : fallbackEvents
            if (pool.length > 0) {
              const idx = Math.floor(Math.random() * pool.length)
              pendingEvents.push(pool[idx])
            }
          }
        }

        // 木村コンボ: 次ターンのイベントを事前生成してpreviewに保存
        let nextEventPreview: string | null = null
        if (hasKimuraCombo) {
          const allPersonalEvents = state.activePersonnel.flatMap(p => p.personalEvents)
          const uniqueEventIds = [...new Set(allPersonalEvents)]
          const availableEvents = EVENT_CARDS.filter(e => uniqueEventIds.includes(e.id))
          const fallbackEvents = EVENT_CARDS.filter(e => e.severity !== 'positive' || Math.random() < 0.3)
          const pool = availableEvents.length > 0 ? availableEvents : fallbackEvents
          if (pool.length > 0) {
            nextEventPreview = pool[Math.floor(Math.random() * pool.length)].id
          }
        }

        // 新規発動コンボがあれば演出トリガー（最初の1件のみ）
        const newPendingComboActivation = newlyDiscovered.length > 0 ? newlyDiscovered[0] : null
        const newDiscoveredCombos = [...new Set([...state.discoveredCombos, ...newlyDiscovered.map(c => c.id)])]

        set({
          projects: updatedProjects,
          activePersonnel: updatedPersonnelWithPrev,
          turn: { ...state.turn, current: nextTurn },
          hand: newHand,
          deck: newDeck,
          discard: newDiscard,
          pendingEvents,
          activeEvent: pendingEvents[0] ?? null,
          ganttHistory: newGanttHistory,
          eventFlags: newEventFlags,
          skillPoints: totalSkillPointsEarned,
          log: [...state.log, ...newLogs],
          missions,
          missionStats: newMissionStats,
          discoveredCombos: newDiscoveredCombos,
          activeComboEffects: updatedActiveEffects,
          pendingComboActivation: newPendingComboActivation,
          nextEventPreview,
        })
      },

      resolveEvent: (eventId, choiceId) => {
        const state = get()
        const event = EVENT_CARDS.find(e => e.id === eventId)
        if (!event) return
        const choice = event.choices.find(c => c.id === choiceId)
        if (!choice) return

        const activeProject = state.projects.find(p => p.id === state.activeProjectId)
        if (!activeProject) return

        // イベントフラグを記録
        const newFlag: EventFlag = {
          id: `flag_${Date.now()}`,
          turn: state.turn.current,
          eventId,
          choiceId,
          projectId: state.activeProjectId,
          description: `${event.name} → ${choice.label}`,
        }

        const updatedProjects = state.projects.map(project => {
          if (project.id !== state.activeProjectId) return project

          const phases = deepCopyPhases(project.phases)
          let quality = project.qcd.quality
          let cost = project.qcd.cost
          let delivery = project.qcd.delivery
          const newLogs: LogEntry[] = []

          for (const effect of choice.effects) {
            switch (effect.type) {
              case 'quality_delta':
                quality = Math.max(0, Math.min(100, quality + (effect.value ?? 0)))
                break
              case 'cost_delta':
                cost += effect.value ?? 0
                break
              case 'delivery_delta':
                delivery = Math.max(0, Math.min(100, delivery + (effect.value ?? 0)))
                break
              case 'progress_delta': {
                for (const ph of phases) {
                  for (const task of ph.tasks) {
                    if (task.status === 'in_progress') {
                      task.effortDone = Math.max(0, task.effortDone + (effect.value ?? 0))
                    }
                  }
                }
                break
              }
              case 'progress_reset': {
                for (const ph of phases) {
                  for (const task of ph.tasks) {
                    if (task.status === 'in_progress') {
                      task.effortDone = 0
                    }
                  }
                }
                break
              }
              case 'remove_status': {
                for (const ph of phases) {
                  for (const task of ph.tasks) {
                    task.statusEffects = task.statusEffects.filter(s => s.type !== effect.statusType)
                  }
                }
                break
              }
              case 'add_status': {
                for (const ph of phases) {
                  for (const task of ph.tasks) {
                    if (task.status === 'in_progress') {
                      task.statusEffects.push({ type: effect.statusType!, remainingTurns: -1 })
                    }
                  }
                }
                break
              }
              case 'remove_bug': {
                for (const ph of phases) {
                  for (const task of ph.tasks) {
                    task.bugs = Math.max(0, task.bugs - (effect.value ?? 1))
                  }
                }
                break
              }
              case 'remove_personnel': {
                const highest = [...state.activePersonnel].sort((a, b) => b.productivity - a.productivity)[0]
                if (highest) {
                  set({ activePersonnel: state.activePersonnel.filter(p => p.id !== highest.id) })
                  newLogs.push({
                    turn: state.turn.current,
                    message: `${highest.name} が離脱した`,
                    type: 'danger',
                  })
                }
                break
              }
            }
          }

          return {
            ...project,
            phases,
            qcd: { ...project.qcd, quality, cost, delivery },
          }
        })

        const remaining = state.pendingEvents.slice(1)
        set({
          projects: updatedProjects,
          pendingEvents: remaining,
          activeEvent: remaining[0] ?? null,
          eventFlags: [...state.eventFlags, newFlag],
          log: [
            ...state.log,
            {
              turn: state.turn.current,
              message: `イベント「${event.name}」→「${choice.label}」を選択`,
              type: event.severity === 'positive' ? 'success' : event.severity === 'critical' ? 'danger' : 'warning',
            },
          ],
        })
      },

      dismissEvent: () => {
        const state = get()
        const remaining = state.pendingEvents.slice(1)
        set({ pendingEvents: remaining, activeEvent: remaining[0] ?? null })
      },

      dismissComboActivation: () => {
        set({ pendingComboActivation: null })
      },

      goToTitle: () => {
        const state = get()
        set({
          ...initialState,
          totalRuns: state.totalRuns,
          bestScore: state.bestScore,
          pmPoints: state.pmPoints,
          unlockedSkills: state.unlockedSkills,
          clearedModes: state.clearedModes,
          completedMissionsByMode: state.completedMissionsByMode,
          unlockedCharacterIds: state.unlockedCharacterIds,
        })
      },

      addLog: (message, type) => {
        const state = get()
        set({ log: [...state.log, { turn: state.turn.current, message, type }] })
      },
    }),
    {
      name: 'i-am-pm-save',
      partialize: (state) => ({
        totalRuns: state.totalRuns,
        bestScore: state.bestScore,
        pmPoints: state.pmPoints,
        unlockedSkills: state.unlockedSkills,
        clearedModes: state.clearedModes,
        completedMissionsByMode: state.completedMissionsByMode,
        unlockedCharacterIds: state.unlockedCharacterIds,
        status: ['playing', 'won', 'lost'].includes(state.status) ? 'title' : state.status,
      }),
    }
  )
)

// ── ミッション評価 ────────────────────────────────────────

function evaluateMissionsOnWin(
  missions: Mission[],
  stats: {
    quality: number
    turnPercent: number
    budgetPercent: number
    totalBugs: number
    maxTasksInOneTurn: number
    maxSimultaneousPersonnel: number
  }
): Mission[] {
  return missions.map(m => {
    if (m.status === 'completed') return m
    let completed = false
    switch (m.conditionType) {
      case 'complete_game':
        completed = true
        break
      case 'quality_above_on_win':
        completed = stats.quality >= (m.conditionValue ?? 70)
        break
      case 'finish_within_turn_percent':
        completed = stats.turnPercent <= (m.conditionValue ?? 75)
        break
      case 'budget_under_percent':
        completed = stats.budgetPercent <= (m.conditionValue ?? 60)
        break
      case 'max_bugs_on_win':
        completed = stats.totalBugs <= (m.conditionValue ?? 3)
        break
      case 'tasks_in_one_turn':
        completed = stats.maxTasksInOneTurn >= (m.conditionValue ?? 2)
        break
      case 'simultaneous_personnel':
        completed = stats.maxSimultaneousPersonnel >= (m.conditionValue ?? 3)
        break
    }
    return { ...m, status: completed ? 'completed' : 'failed', progress: completed ? 100 : m.progress }
  })
}
