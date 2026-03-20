import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { cn } from '../../utils/cn'
import type { TaskCard } from '../../types/card'

const STATUS_CONFIG = {
  done: { bg: 'bg-pm-green/20', border: 'border-pm-green', text: 'text-pm-green', icon: '✓', label: '完了' },
  in_progress: { bg: 'bg-pm-cyan/15', border: 'border-pm-cyan/60', text: 'text-pm-cyan', icon: '▶', label: '作業中' },
  ready: { bg: 'bg-pm-yellow/10', border: 'border-pm-yellow/40', text: 'text-pm-yellow', icon: '●', label: '開始可能' },
  locked: { bg: 'bg-white/3', border: 'border-white/10', text: 'text-pm-muted', icon: '🔒', label: 'ロック中' },
  failed: { bg: 'bg-pm-red/15', border: 'border-pm-red', text: 'text-pm-red', icon: '✕', label: '失敗' },
}

const SKILL_COLOR: Record<string, string> = {
  frontend: 'text-pm-cyan',
  backend: 'text-pm-green',
  infra: 'text-pm-orange',
  qa: 'text-pm-yellow',
  design: 'text-purple-400',
  general: 'text-pm-muted',
}

function ProgressRing({ value, max, size = 40 }: { value: number; max: number; size?: number }) {
  const pct = max > 0 ? value / max : 0
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  const gap = circ - dash

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgb(0,180,216)" strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${gap}`}
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${dash} ${gap}` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </svg>
  )
}

function TaskNode({ task, assigned }: { task: TaskCard; assigned: string[] }) {
  const cfg = STATUS_CONFIG[task.status]
  const pct = task.effortTotal > 0 ? Math.round(task.effortDone / task.effortTotal * 100) : 0
  const hasFire = task.statusEffects.some(e => e.type === 'fire')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative rounded-xl border p-3 flex gap-3 items-start',
        cfg.bg, cfg.border,
        task.status === 'locked' ? 'opacity-50' : '',
      )}
    >
      {/* 進捗リング */}
      <div className="flex-shrink-0 relative">
        <ProgressRing value={task.effortDone} max={task.effortTotal} size={44} />
        <span className={cn('absolute inset-0 flex items-center justify-center text-xs font-bold', cfg.text)}>
          {task.status === 'done' ? '✓' : task.status === 'locked' ? '🔒' : `${pct}%`}
        </span>
      </div>

      {/* タスク情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {hasFire && <span className="text-xs">🔥</span>}
          <p className="text-white text-sm font-semibold truncate">{task.name}</p>
        </div>
        <div className="flex items-center gap-2 text-xs mb-1.5">
          <span className={SKILL_COLOR[task.requiredSkill]}>{task.requiredSkill}</span>
          <span className="text-pm-muted">★{'★'.repeat(task.difficulty - 1)}{'☆'.repeat(3 - task.difficulty)}</span>
          {task.bugs > 0 && <span className="text-pm-red">🐛{task.bugs}</span>}
        </div>

        {/* 稼働中の人員 */}
        {assigned.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {assigned.map(name => (
              <span key={name} className="px-1.5 py-0.5 bg-pm-cyan/20 text-pm-cyan text-xs rounded-full border border-pm-cyan/30">
                {name}
              </span>
            ))}
          </div>
        )}

        {/* ステータスバー */}
        {task.status !== 'locked' && task.status !== 'done' && (
          <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-pm-cyan rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ConnectorArrow({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-1">
      <div className="flex flex-col items-center">
        <div className="w-px h-3 bg-white/20" />
        <div className="w-2 h-2 border-r-2 border-b-2 border-white/20 rotate-45 -mt-1" />
        {label && <span className="text-pm-muted text-xs mt-0.5">{label}</span>}
      </div>
    </div>
  )
}

export function ProgressTree() {
  const { phases, activePersonnel } = useGameStore()

  // タスクIDから担当者名を取得
  const assignedMap: Record<string, string[]> = {}
  for (const p of activePersonnel) {
    if (p.assignedTaskId) {
      if (!assignedMap[p.assignedTaskId]) assignedMap[p.assignedTaskId] = []
      assignedMap[p.assignedTaskId].push(p.name)
    }
  }

  // 全タスクをフラット化
  const allTasks = phases.flatMap(ph => ph.tasks.map(t => ({ ...t, phaseName: ph.name })))

  // 依存グラフを使って描画順を計算
  function getLevel(taskId: string, visited = new Set<string>()): number {
    if (visited.has(taskId)) return 0
    visited.add(taskId)
    const task = allTasks.find(t => t.id === taskId)
    if (!task || task.blockedBy.length === 0) return 0
    return 1 + Math.max(...task.blockedBy.map(dep => getLevel(dep, visited)))
  }

  const taskLevels = new Map<string, number>()
  allTasks.forEach(t => taskLevels.set(t.id, getLevel(t.id)))

  const maxLevel = Math.max(...Array.from(taskLevels.values()), 0)
  const levelGroups: (typeof allTasks)[] = Array.from({ length: maxLevel + 1 }, () => [])
  allTasks.forEach(t => {
    const level = taskLevels.get(t.id) ?? 0
    levelGroups[level].push(t)
  })

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-1">
      <p className="text-pm-muted text-xs text-center mb-4 tracking-wider">── 依存関係ツリー ──</p>

      {levelGroups.map((group, levelIdx) => (
        <div key={levelIdx}>
          {levelIdx > 0 && (
            <ConnectorArrow label={levelIdx === 1 ? '依存' : undefined} />
          )}
          <div className={cn(
            'grid gap-2',
            group.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
          )}>
            {group.map(task => (
              <TaskNode
                key={task.id}
                task={task}
                assigned={assignedMap[task.id] ?? []}
              />
            ))}
          </div>
        </div>
      ))}

      {/* 凡例 */}
      <div className="mt-6 pt-4 border-t border-white/8">
        <p className="text-pm-muted text-xs mb-2">凡例</p>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={cn('w-3 h-3 rounded-sm border flex-shrink-0', cfg.bg, cfg.border)} />
              <span className="text-pm-muted">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
