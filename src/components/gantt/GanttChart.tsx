import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import type { TaskCard } from '../../types/card'
import type { WBSPhase } from '../../types/game'
import { cn } from '../../utils/cn'

const SKILL_COLOR: Record<string, string> = {
  frontend: 'bg-blue-500/30 text-blue-300 border-blue-500/40',
  backend: 'bg-purple-500/30 text-purple-300 border-purple-500/40',
  infra: 'bg-orange-500/30 text-orange-300 border-orange-500/40',
  qa: 'bg-green-500/30 text-green-300 border-green-500/40',
  design: 'bg-pink-500/30 text-pink-300 border-pink-500/40',
  general: 'bg-gray-500/30 text-gray-300 border-gray-500/40',
}

const PERSONNEL_TYPE_COLOR: Record<string, string> = {
  engineer: 'bg-pm-cyan/20 text-pm-cyan',
  newcomer: 'bg-yellow-500/20 text-yellow-300',
  specialist: 'bg-orange-500/20 text-orange-300',
  lead: 'bg-blue-500/20 text-blue-300',
}

function getTaskStatusColor(status: string): string {
  switch (status) {
    case 'done': return 'bg-green-500/20 border-green-500/40'
    case 'in_progress': return 'bg-pm-cyan/10 border-pm-cyan/40'
    case 'ready': return 'bg-yellow-500/10 border-yellow-500/30'
    case 'locked': return 'bg-white/5 border-white/10'
    default: return 'bg-white/5 border-white/10'
  }
}

export function GanttChart() {
  const {
    projects,
    activeProjectId,
    turn,
    activePersonnel,
    ganttHistory,
    ganttPlan,
    planAssignment,
    cancelPlan,
  } = useGameStore()

  const [pickerCell, setPickerCell] = useState<{ taskId: string; turnNum: number } | null>(null)

  const project = projects.find(p => p.id === activeProjectId)
  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-pm-muted text-sm">
        プロジェクトが見つかりません
      </div>
    )
  }

  const allTasks = project.phases.flatMap(ph => ph.tasks)
  const turns = Array.from({ length: turn.max }, (_, i) => i + 1)

  function getHistoryForCell(taskId: string, turnNum: number) {
    return ganttHistory.filter(h =>
      h.projectId === activeProjectId && h.taskId === taskId && h.turn === turnNum
    )
  }

  function getPlannedForCell(taskId: string, turnNum: number) {
    return ganttPlan.filter(p =>
      p.projectId === activeProjectId && p.taskId === taskId && p.plannedTurn === turnNum
    )
  }

  function getPersonnelInitials(personnelId: string): string {
    const p = activePersonnel.find(p => p.id === personnelId)
    if (!p) return '?'
    return p.name.slice(0, 2)
  }

  function getPersonnelType(personnelId: string): string {
    const p = activePersonnel.find(p => p.id === personnelId)
    return p?.personnelType ?? 'engineer'
  }

  function handleFutureCellClick(task: TaskCard, turnNum: number) {
    if (task.status === 'locked') return
    if (pickerCell?.taskId === task.id && pickerCell?.turnNum === turnNum) {
      setPickerCell(null)
    } else {
      setPickerCell({ taskId: task.id, turnNum })
    }
  }

  function handlePickPersonnel(personnelId: string, taskId: string, turnNum: number) {
    const existing = ganttPlan.find(
      p => p.projectId === activeProjectId && p.taskId === taskId &&
        p.plannedTurn === turnNum && p.personnelId === personnelId
    )
    if (existing) {
      cancelPlan(personnelId, turnNum)
    } else {
      planAssignment(personnelId, taskId, activeProjectId, turnNum)
    }
    setPickerCell(null)
  }

  return (
    <div className="h-full flex flex-col bg-pm-bg">
      {/* プロジェクト名 */}
      <div className="flex-shrink-0 px-3 py-2 bg-pm-surface/50 border-b border-white/8">
        <p className="text-pm-cyan text-xs font-bold tracking-wider">{project.name} — ガントチャート</p>
        <p className="text-pm-muted text-[10px] mt-0.5">
          未来のセルをタップして人員をプランニングできます
        </p>
      </div>

      {/* ガント本体（横スクロール） */}
      <div className="flex-1 overflow-auto">
        <div style={{ minWidth: `${60 + turn.max * 52}px` }}>
          {/* ヘッダー行 */}
          <div className="flex sticky top-0 z-10 bg-pm-bg border-b border-white/10">
            <div className="w-44 flex-shrink-0 px-2 py-1.5 border-r border-white/10">
              <p className="text-pm-muted text-[10px]">タスク</p>
            </div>
            {turns.map(t => (
              <div
                key={t}
                className={cn(
                  'w-12 flex-shrink-0 text-center py-1.5 border-r border-white/5',
                  t === turn.current ? 'bg-pm-cyan/10' : t < turn.current ? 'bg-white/3' : ''
                )}
              >
                <p className={cn('text-[10px] font-mono', t === turn.current ? 'text-pm-cyan font-bold' : 'text-pm-muted')}>
                  W{t}
                </p>
              </div>
            ))}
          </div>

          {/* フェーズ・タスク行 */}
          {project.phases.map(phase => (
            <div key={phase.id}>
              {/* フェーズヘッダー */}
              <div className="flex bg-pm-surface/30 border-b border-white/5">
                <div className="w-44 flex-shrink-0 px-2 py-1 border-r border-white/10">
                  <p className="text-pm-muted text-[10px] font-bold tracking-wider">
                    {phase.name}
                  </p>
                </div>
                {turns.map(t => (
                  <div key={t} className="w-12 flex-shrink-0 border-r border-white/5" />
                ))}
              </div>

              {/* タスク行 */}
              {phase.tasks.map(task => {
                const progressPct = task.effortTotal > 0
                  ? Math.round(task.effortDone / task.effortTotal * 100)
                  : 0

                return (
                  <div key={task.id} className="flex border-b border-white/5 hover:bg-white/2 transition-colors">
                    {/* タスク名列 */}
                    <div className={cn(
                      'w-44 flex-shrink-0 px-2 py-2 border-r border-white/10',
                      getTaskStatusColor(task.status),
                    )}>
                      <div className="flex items-start gap-1">
                        <span className={cn(
                          'flex-shrink-0 text-[9px] px-1 py-0.5 rounded border',
                          SKILL_COLOR[task.requiredSkill],
                        )}>
                          {task.requiredSkill.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className={cn(
                            'text-[11px] font-medium leading-tight truncate',
                            task.status === 'done' ? 'text-green-400' :
                            task.status === 'locked' ? 'text-pm-muted' : 'text-white',
                          )}>
                            {task.status === 'done' ? '✓ ' : ''}{task.name}
                          </p>
                          {task.status !== 'locked' && task.status !== 'done' && (
                            <div className="mt-0.5 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-pm-cyan/60 rounded-full transition-all"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          )}
                          {task.bugs > 0 && (
                            <p className="text-pm-red text-[9px]">🐛×{task.bugs}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ターン列 */}
                    {turns.map(turnNum => {
                      const isPast = turnNum < turn.current
                      const isCurrent = turnNum === turn.current
                      const isFuture = turnNum > turn.current

                      const history = getHistoryForCell(task.id, turnNum)
                      const planned = getPlannedForCell(task.id, turnNum)
                      const isPickerOpen = pickerCell?.taskId === task.id && pickerCell?.turnNum === turnNum

                      return (
                        <div
                          key={turnNum}
                          className={cn(
                            'w-12 flex-shrink-0 border-r border-white/5 p-0.5 relative',
                            isCurrent ? 'bg-pm-cyan/5' : '',
                            isFuture && task.status !== 'locked' ? 'cursor-pointer hover:bg-white/5' : '',
                          )}
                          onClick={() => isFuture && handleFutureCellClick(task, turnNum)}
                        >
                          {/* 過去: 実績表示 */}
                          {isPast && history.length > 0 && (
                            <div className="flex flex-wrap gap-0.5">
                              {history[0].personnelIds.slice(0, 2).map(pid => (
                                <span
                                  key={pid}
                                  className={cn(
                                    'text-[9px] px-1 py-0.5 rounded font-bold leading-none',
                                    PERSONNEL_TYPE_COLOR[getPersonnelType(pid)],
                                  )}
                                >
                                  {getPersonnelInitials(pid)}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* 過去のタスク完了表示 */}
                          {isPast && task.status === 'done' && history.length === 0 && (
                            <div className="flex items-center justify-center h-full">
                              <span className="text-green-400/40 text-[10px]">✓</span>
                            </div>
                          )}

                          {/* 現在: 現在のアサイン */}
                          {isCurrent && (() => {
                            const currentAssigned = activePersonnel.filter(p => p.assignedTaskId === task.id)
                            return currentAssigned.length > 0 ? (
                              <div className="flex flex-wrap gap-0.5">
                                {currentAssigned.slice(0, 2).map(p => (
                                  <span
                                    key={p.id}
                                    className={cn(
                                      'text-[9px] px-1 py-0.5 rounded font-bold leading-none ring-1 ring-pm-cyan/50',
                                      PERSONNEL_TYPE_COLOR[p.personnelType],
                                    )}
                                  >
                                    {p.name.slice(0, 2)}
                                  </span>
                                ))}
                              </div>
                            ) : null
                          })()}

                          {/* 未来: プラン表示 */}
                          {isFuture && planned.length > 0 && (
                            <div className="flex flex-wrap gap-0.5">
                              {planned.slice(0, 2).map(plan => {
                                const p = activePersonnel.find(p => p.id === plan.personnelId)
                                return p ? (
                                  <span
                                    key={plan.personnelId}
                                    className={cn(
                                      'text-[9px] px-1 py-0.5 rounded font-bold leading-none opacity-60 border border-dashed',
                                      PERSONNEL_TYPE_COLOR[p.personnelType],
                                    )}
                                  >
                                    {p.name.slice(0, 2)}
                                  </span>
                                ) : null
                              })}
                            </div>
                          )}

                          {/* 未来セル: ロック状態 */}
                          {isFuture && task.status === 'locked' && (
                            <div className="flex items-center justify-center h-full">
                              <span className="text-white/15 text-[10px]">🔒</span>
                            </div>
                          )}

                          {/* 未来セル: 空のプランナブル */}
                          {isFuture && task.status !== 'locked' && planned.length === 0 && (
                            <div className="flex items-center justify-center h-full min-h-[24px]">
                              <span className="text-white/10 text-[10px]">+</span>
                            </div>
                          )}

                          {/* ピッカー */}
                          {isPickerOpen && (
                            <PersonnelPicker
                              taskId={task.id}
                              turnNum={turnNum}
                              onPick={handlePickPersonnel}
                              onClose={() => setPickerCell(null)}
                              currentPlanned={planned.map(p => p.personnelId)}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 凡例 */}
      <div className="flex-shrink-0 px-3 py-1.5 bg-pm-surface/30 border-t border-white/8 flex gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500/40 inline-block" />
          <span className="text-pm-muted text-[10px]">完了</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-pm-cyan/10 border border-pm-cyan/40 inline-block" />
          <span className="text-pm-muted text-[10px]">進行中</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-500/10 border border-yellow-500/30 inline-block" />
          <span className="text-pm-muted text-[10px]">着手可能</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-white/5 border border-dashed border-white/20 inline-block" />
          <span className="text-pm-muted text-[10px]">プラン（未来）</span>
        </div>
      </div>
    </div>
  )
}

// ── 人員ピッカー ──────────────────────────────────────────

function PersonnelPicker({
  taskId,
  turnNum,
  onPick,
  onClose,
  currentPlanned,
}: {
  taskId: string
  turnNum: number
  onPick: (personnelId: string, taskId: string, turnNum: number) => void
  onClose: () => void
  currentPlanned: string[]
}) {
  const { activePersonnel } = useGameStore()

  return (
    <div
      className="absolute top-0 left-full z-50 ml-1 bg-pm-card border border-white/20 rounded-lg shadow-xl p-2 w-36"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-1.5">
        <p className="text-pm-muted text-[10px]">W{turnNum} にアサイン</p>
        <button onClick={onClose} className="text-pm-muted text-xs hover:text-white">✕</button>
      </div>
      {activePersonnel.length === 0 ? (
        <p className="text-pm-muted text-[10px] text-center py-1">稼働中の人員なし</p>
      ) : (
        <div className="flex flex-col gap-1">
          {activePersonnel.map(p => {
            const isPlanned = currentPlanned.includes(p.id)
            return (
              <button
                key={p.id}
                onClick={() => onPick(p.id, taskId, turnNum)}
                className={cn(
                  'text-left px-2 py-1 rounded text-[10px] transition-all border',
                  isPlanned
                    ? 'bg-pm-cyan/20 border-pm-cyan/40 text-pm-cyan'
                    : 'bg-white/5 border-white/10 text-pm-text hover:bg-white/10',
                )}
              >
                <span className="font-bold">{p.name.slice(0, 4)}</span>
                <span className="text-pm-muted ml-1">⚡{p.productivity}</span>
                {isPlanned && <span className="ml-1">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
