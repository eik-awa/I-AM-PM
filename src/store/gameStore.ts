import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, ProjectScenario, WBSPhase, LogEntry } from '../types/game'
import type { PersonnelCard, EventCard, TaskCard } from '../types/card'
import type { Mission } from '../types/mission'
import type { SkillEffect } from '../types/skill'
import { PERSONNEL_CARDS, EVENT_CARDS } from '../constants/cards'
import { MISSION_POOL } from '../constants/missions'
import { SKILL_TREE } from '../constants/skills'
import { calculateProgress, calculateFinalScore } from '../engine/progressEngine'
import { shuffle } from '../utils/random'

interface GameStore extends GameState {
  startTutorial: () => void
  startGame: (scenario: ProjectScenario) => void
  assignPersonnel: (personnelId: string, taskId: string) => void
  unassignPersonnel: (personnelId: string) => void
  endTurn: () => void
  resolveEvent: (eventId: string, choiceId: string) => void
  dismissEvent: () => void
  goToTitle: () => void
  addLog: (msg: string, type: LogEntry['type']) => void
  unlockSkill: (skillId: string) => void
  getActiveSkillEffects: () => SkillEffect
}

function buildInitialDeck(): (PersonnelCard | EventCard)[] {
  const starters = [
    PERSONNEL_CARDS.find(p => p.id === 'p_tanaka')!,
    PERSONNEL_CARDS.find(p => p.id === 'p_sato')!,
    PERSONNEL_CARDS.find(p => p.id === 'p_yamada')!,
  ]
  const events = shuffle([...EVENT_CARDS]).slice(0, 8)
  const extraPersonnel = shuffle(
    PERSONNEL_CARDS.filter(p => !['p_tanaka', 'p_sato', 'p_yamada'].includes(p.id))
  ).slice(0, 4)
  return shuffle([...starters, ...extraPersonnel, ...events])
}

function deepCopyPhases(phases: WBSPhase[]): WBSPhase[] {
  return phases.map(ph => ({
    ...ph,
    tasks: ph.tasks.map(t => ({ ...t, statusEffects: [...t.statusEffects] })),
  }))
}

function selectMissions(): Mission[] {
  // ゲームごとに3ミッションをランダム選択（complete_gameは必ず含む）
  const base = MISSION_POOL.find(m => m.id === 'complete_game')!
  const rest = shuffle(MISSION_POOL.filter(m => m.id !== 'complete_game')).slice(0, 2)
  return [...[base], ...rest].map(def => ({
    ...def,
    status: 'active' as const,
    progress: 0,
  }))
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

const initialState: GameState = {
  status: 'title',
  scenario: null,
  turn: { current: 1, max: 8, phase: 'planning' },
  qcd: { quality: 70, cost: 0, budget: 800, delivery: 0 },
  hand: [],
  deck: [],
  discard: [],
  phases: [],
  activePersonnel: [],
  completedTaskIds: [],
  pendingEvents: [],
  activeEvent: null,
  log: [],
  missions: [],
  missionStats: { maxTasksInOneTurn: 0, maxSimultaneousPersonnel: 0 },
  totalRuns: 0,
  bestScore: 0,
  pmPoints: 0,
  unlockedSkills: [],
}

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

      startGame: (scenario) => {
        const state = get()
        const skillEffects = mergeSkillEffects(state.unlockedSkills)
        const startQuality = 70 + (skillEffects.startQualityBonus ?? 0)
        const deck = buildInitialDeck()
        const hand = deck.splice(0, 4) as (PersonnelCard | EventCard)[]

        set({
          status: 'playing',
          scenario,
          turn: { current: 1, max: scenario.totalTurns, phase: 'planning' },
          qcd: {
            quality: Math.min(100, startQuality),
            cost: 0,
            budget: scenario.budget,
            delivery: 0,
          },
          hand,
          deck,
          discard: [],
          phases: deepCopyPhases(scenario.phases),
          activePersonnel: [],
          completedTaskIds: [],
          pendingEvents: [],
          activeEvent: null,
          log: [{ turn: 1, message: 'プロジェクト開始。最初の一手を考えよう。', type: 'info' }],
          missions: selectMissions(),
          missionStats: { maxTasksInOneTurn: 0, maxSimultaneousPersonnel: 0 },
        })
      },

      assignPersonnel: (personnelId, taskId) => {
        const state = get()
        const cardInHand = state.hand.find(c => c.id === personnelId && c.type === 'personnel') as PersonnelCard | undefined

        if (!cardInHand) {
          const active = state.activePersonnel.find(p => p.id === personnelId)
          if (!active) return

          const task = findTask(state.phases, taskId)
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

        const task = findTask(state.phases, taskId)
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
        const p = state.activePersonnel.find(p => p.id === personnelId)
        if (!p) return

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

        // ── 1. 進捗計算 ──────────────────────────────────────
        const phases = deepCopyPhases(state.phases)
        let qualityDelta = 0
        let totalCostThisTurn = 0
        const newLogs: LogEntry[] = []
        let tasksCompletedThisTurn = 0

        const costMult = skillEffects.personnelCostMultiplier ?? 1.0
        for (const p of state.activePersonnel) {
          totalCostThisTurn += Math.round(p.costPerTurn * costMult)
        }

        for (const phase of phases) {
          for (const task of phase.tasks) {
            if (task.status !== 'in_progress' && task.status !== 'ready') continue

            const assigned = state.activePersonnel.filter(p => p.assignedTaskId === task.id)
            if (assigned.length === 0) continue

            task.status = 'in_progress'
            const result = calculateProgress(task, assigned, skillEffects)
            task.effortDone = Math.min(task.effortTotal, task.effortDone + result.progressGained)
            task.bugs += result.bugsAdded

            if (result.progressGained > 0) {
              newLogs.push({
                turn: state.turn.current,
                message: `${task.name}：+${result.progressGained}pt（${Math.round(task.effortDone / task.effortTotal * 100)}%）`,
                type: 'info',
              })
            }

            if (task.effortDone >= task.effortTotal) {
              task.status = 'done'
              task.effortDone = task.effortTotal
              qualityDelta += task.qualityImpact - task.bugs * 3
              tasksCompletedThisTurn++
              newLogs.push({
                turn: state.turn.current,
                message: `✅ ${task.name} 完了！`,
                type: 'success',
              })
            }
          }
        }

        // ── 2. 依存関係チェック → ロック解除 ────────────────
        const allCompletedIds = [
          ...state.completedTaskIds,
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

        // ── 3. 人員の継続ターン更新 ──────────────────────────
        const conditionRecovery = 5 + (skillEffects.conditionRecoveryBonus ?? 0)
        const updatedPersonnel = state.activePersonnel.map(p => {
          if (p.assignedTaskId) {
            return { ...p, turnsOnTask: p.turnsOnTask + 1 }
          }
          return { ...p, condition: Math.min(100, p.condition + conditionRecovery) }
        })

        // ── 4. QCD更新 ────────────────────────────────────────
        const bugPenalty = phases.flatMap(ph => ph.tasks).reduce((sum, t) => sum + t.bugs, 0) * 2
        const newQuality = Math.max(0, Math.min(100, state.qcd.quality + qualityDelta - bugPenalty * 0.1))
        const newCost = state.qcd.cost + totalCostThisTurn

        const allTasks = phases.flatMap(ph => ph.tasks)
        const doneEffort = allTasks.reduce((s, t) => s + t.effortDone, 0)
        const totalEffort = allTasks.reduce((s, t) => s + t.effortTotal, 0)
        const deliveryProgress = totalEffort > 0 ? Math.round(doneEffort / totalEffort * 100) : 0

        newLogs.push({
          turn: state.turn.current,
          message: `週次コスト：${totalCostThisTurn}万円（累計：${newCost}万円）`,
          type: newCost > state.qcd.budget * 0.8 ? 'warning' : 'info',
        })

        // ── 5. ミッション統計更新 ─────────────────────────────
        const assignedCount = state.activePersonnel.filter(p => p.assignedTaskId).length
        const newMissionStats = {
          maxTasksInOneTurn: Math.max(state.missionStats.maxTasksInOneTurn, tasksCompletedThisTurn),
          maxSimultaneousPersonnel: Math.max(state.missionStats.maxSimultaneousPersonnel, assignedCount),
        }

        // simultaneous_personnelミッション進捗更新
        let missions = state.missions.map(m => {
          if (m.status !== 'active') return m
          if (m.conditionType === 'simultaneous_personnel') {
            const val = m.conditionValue ?? 3
            if (assignedCount >= val) {
              return { ...m, status: 'completed' as const, progress: 100 }
            }
            return { ...m, progress: Math.round((assignedCount / val) * 100) }
          }
          if (m.conditionType === 'tasks_in_one_turn') {
            const val = m.conditionValue ?? 2
            const best = Math.max(newMissionStats.maxTasksInOneTurn, tasksCompletedThisTurn)
            if (best >= val) {
              return { ...m, status: 'completed' as const, progress: 100 }
            }
            return { ...m, progress: Math.round((best / val) * 100) }
          }
          return m
        })

        // ── 6. ゲームオーバー判定 ─────────────────────────────
        const scenario = state.scenario!
        const qualityMin = Math.max(0, scenario.qualityMin - (skillEffects.qualityMinReduction ?? 0))
        const budgetOverLimit = scenario.budget * (1.5 + (skillEffects.budgetBufferBonus ?? 0))
        let gameOver = false
        let gameOverReason = ''

        if (newQuality < qualityMin) {
          gameOver = true
          gameOverReason = `品質が基準値（${qualityMin}）を下回りました`
        }
        if (newCost > budgetOverLimit) {
          gameOver = true
          gameOverReason = `予算を大幅に超過しました`
        }

        // ── 7. 勝利判定 ───────────────────────────────────────
        const allDone = allTasks.every(t => t.status === 'done')
        const nextTurn = state.turn.current + 1

        if (allDone) {
          const score = calculateFinalScore(newQuality, newCost, scenario.budget, state.turn.current, state.turn.max)
          const totalBugs = allTasks.reduce((s, t) => s + t.bugs, 0)
          const budgetPercent = (newCost / scenario.budget) * 100
          const turnPercent = (state.turn.current / scenario.totalTurns) * 100

          const completedMissions = evaluateMissionsOnWin(missions, {
            quality: newQuality,
            turnPercent,
            budgetPercent,
            totalBugs,
            maxTasksInOneTurn: newMissionStats.maxTasksInOneTurn,
            maxSimultaneousPersonnel: newMissionStats.maxSimultaneousPersonnel,
          })

          const earnedPoints = completedMissions
            .filter(m => m.status === 'completed')
            .filter(m => !state.missions.find(sm => sm.id === m.id && sm.status === 'completed'))
            .reduce((sum, m) => sum + m.reward, 0)

          set({
            status: 'won',
            phases,
            activePersonnel: updatedPersonnel,
            qcd: { ...state.qcd, quality: newQuality, cost: newCost, delivery: deliveryProgress },
            completedTaskIds: allTasks.filter(t => t.status === 'done').map(t => t.id),
            log: [...state.log, ...newLogs],
            bestScore: Math.max(state.bestScore, score),
            totalRuns: state.totalRuns + 1,
            missions: completedMissions,
            missionStats: newMissionStats,
            pmPoints: state.pmPoints + earnedPoints,
          })
          return
        }

        if (gameOver) {
          set({
            status: 'lost',
            phases,
            qcd: { ...state.qcd, quality: newQuality, cost: newCost, delivery: deliveryProgress },
            log: [
              ...state.log, ...newLogs,
              { turn: state.turn.current, message: `💀 ゲームオーバー：${gameOverReason}`, type: 'danger' },
            ],
            totalRuns: state.totalRuns + 1,
            missions,
            missionStats: newMissionStats,
          })
          return
        }

        if (nextTurn > state.turn.max && !allDone) {
          set({
            status: 'lost',
            phases,
            qcd: { ...state.qcd, quality: newQuality, cost: newCost, delivery: deliveryProgress },
            log: [
              ...state.log, ...newLogs,
              { turn: state.turn.current, message: `⏰ タイムアップ！納期を達成できませんでした`, type: 'danger' },
            ],
            totalRuns: state.totalRuns + 1,
            missions,
            missionStats: newMissionStats,
          })
          return
        }

        // ── 8. ドロー ─────────────────────────────────────────
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

        // ── 9. ランダムイベント ───────────────────────────────
        const eventReduction = skillEffects.eventProbReduction ?? 0
        const pendingEvents: EventCard[] = []
        const eventProb = Math.max(0, 0.25 + (nextTurn / state.turn.max) * 0.2 - eventReduction)
        if (Math.random() < eventProb) {
          const pool = EVENT_CARDS.filter(e => e.severity !== 'positive' || Math.random() < 0.3)
          const idx = Math.floor(Math.random() * pool.length)
          pendingEvents.push(pool[idx])
        }

        set({
          phases,
          activePersonnel: updatedPersonnel,
          qcd: { ...state.qcd, quality: newQuality, cost: newCost, delivery: deliveryProgress },
          completedTaskIds: allTasks.filter(t => t.status === 'done').map(t => t.id),
          turn: { ...state.turn, current: nextTurn },
          hand: newHand,
          deck: newDeck,
          discard: newDiscard,
          pendingEvents,
          activeEvent: pendingEvents[0] ?? null,
          log: [...state.log, ...newLogs],
          missions,
          missionStats: newMissionStats,
        })
      },

      resolveEvent: (eventId, choiceId) => {
        const state = get()
        const event = EVENT_CARDS.find(e => e.id === eventId)
        if (!event) return
        const choice = event.choices.find(c => c.id === choiceId)
        if (!choice) return

        let phases = deepCopyPhases(state.phases)
        let quality = state.qcd.quality
        let cost = state.qcd.cost
        let delivery = state.qcd.delivery
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
                    if (effect.value && effect.value < 0) {
                      newLogs.push({
                        turn: state.turn.current,
                        message: `${task.name} の進捗が ${Math.abs(effect.value)}pt 巻き戻った`,
                        type: 'warning',
                      })
                    }
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
                    newLogs.push({
                      turn: state.turn.current,
                      message: `${task.name} の進捗がリセットされた 😱`,
                      type: 'danger',
                    })
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
            case 'remove_personnel': {
              const highest = [...state.activePersonnel].sort((a, b) => b.productivity - a.productivity)[0]
              if (highest) {
                set({ activePersonnel: state.activePersonnel.filter(p => p.id !== highest.id) })
                newLogs.push({
                  turn: state.turn.current,
                  message: `${highest.name} が離脱した 😢`,
                  type: 'danger',
                })
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
          }
        }

        newLogs.push({
          turn: state.turn.current,
          message: `イベント「${event.name}」→「${choice.label}」を選択`,
          type: event.severity === 'positive' ? 'success' : event.severity === 'critical' ? 'danger' : 'warning',
        })

        const remaining = state.pendingEvents.slice(1)
        set({
          phases,
          qcd: { ...state.qcd, quality, cost, delivery },
          pendingEvents: remaining,
          activeEvent: remaining[0] ?? null,
          log: [...state.log, ...newLogs],
        })
      },

      dismissEvent: () => {
        const state = get()
        const remaining = state.pendingEvents.slice(1)
        set({ pendingEvents: remaining, activeEvent: remaining[0] ?? null })
      },

      goToTitle: () => {
        const state = get()
        set({
          ...initialState,
          totalRuns: state.totalRuns,
          bestScore: state.bestScore,
          pmPoints: state.pmPoints,
          unlockedSkills: state.unlockedSkills,
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
        status: state.status === 'playing' ? 'title' : state.status,
      }),
    }
  )
)

// ── ヘルパー ──────────────────────────────────────────────

function findTask(phases: WBSPhase[], taskId: string): TaskCard | undefined {
  for (const ph of phases) {
    const t = ph.tasks.find(t => t.id === taskId)
    if (t) return t
  }
  return undefined
}

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
