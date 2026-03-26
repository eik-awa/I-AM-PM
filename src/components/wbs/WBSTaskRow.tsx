import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import type { TaskCard } from '../../types/card'
import { cn } from '../../utils/cn'

const SKILL_LABEL: Record<string, string> = {
  frontend: 'Front', backend: 'Back', infra: 'Infra',
  qa: 'QA', design: 'UI', general: '汎用',
}
const SKILL_COLOR: Record<string, string> = {
  frontend: 'bg-blue-500/30 text-blue-300',
  backend: 'bg-purple-500/30 text-purple-300',
  infra: 'bg-orange-500/30 text-orange-300',
  qa: 'bg-green-500/30 text-green-300',
  design: 'bg-pink-500/30 text-pink-300',
  general: 'bg-gray-500/30 text-gray-300',
}
const STATUS_LABEL: Record<string, string> = {
  locked: '🔒 ロック中', ready: '⏳ 待機', in_progress: '🔨 進行中',
  done: '✅ 完了', failed: '❌ 失敗',
}

interface Props {
  task: TaskCard
}

export function WBSTaskRow({ task }: Props) {
  const { activePersonnel, assignPersonnel, unassignPersonnel, pendingAssignPersonnelId, setPendingAssign } = useGameStore()
  const assignedPersonnel = activePersonnel.filter(p => p.assignedTaskId === task.id)
  const progress = task.effortTotal > 0 ? Math.round(task.effortDone / task.effortTotal * 100) : 0
  const hasFire = task.statusEffects.some(e => e.type === 'fire')

  const isDroppable = task.status === 'ready' || task.status === 'in_progress'
  const isTapAssignable = isDroppable && !!pendingAssignPersonnelId

  function handleTapAssign() {
    if (!isTapAssignable) return
    assignPersonnel(pendingAssignPersonnelId!, task.id)
    setPendingAssign(null)
  }

  return (
    <div
      data-task-id={task.id}
      data-task-droppable={String(isDroppable)}
      onClick={handleTapAssign}
      className={cn(
        'rounded-lg border transition-all',
        task.status === 'done' ? 'border-pm-green/20 bg-pm-green/5 opacity-70' :
        task.status === 'locked' ? 'border-white/5 bg-black/20 opacity-50' :
        isTapAssignable ? 'border-pm-cyan/50 bg-pm-cyan/5 cursor-pointer ring-1 ring-pm-cyan/30' :
        hasFire ? 'border-pm-red/40 bg-pm-red/5' :
        'border-white/8 bg-pm-card/50',
      )}
    >
      <div className="p-2.5">
        {/* ヘッダー行 */}
        <div className="flex items-center gap-2 mb-1.5">
          {/* スキルバッジ */}
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', SKILL_COLOR[task.requiredSkill])}>
            {SKILL_LABEL[task.requiredSkill]}
          </span>

          {/* タスク名 */}
          <span className={cn(
            'text-sm font-medium flex-1',
            task.status === 'done' ? 'text-pm-green line-through' :
            task.status === 'locked' ? 'text-pm-muted' : 'text-white',
          )}>
            {task.name}
          </span>

          {/* ステータス */}
          {task.status !== 'in_progress' && (
            <span className="text-[10px] text-pm-muted">{STATUS_LABEL[task.status]}</span>
          )}

          {/* 炎上アイコン */}
          {hasFire && (
            <span className="text-pm-red fire-pulse text-sm">🔥</span>
          )}

          {/* バグ数 */}
          {task.bugs > 0 && (
            <span className="text-[10px] bg-pm-red/20 text-pm-red px-1.5 py-0.5 rounded">
              🐛×{task.bugs}
            </span>
          )}
        </div>

        {/* 進捗バー */}
        {task.status !== 'locked' && task.status !== 'done' && (
          <div className="mb-2">
            <div className="flex justify-between text-[10px] text-pm-muted mb-0.5">
              <span>{task.effortDone}/{task.effortTotal}pt</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className={cn(
                  'h-full rounded-full',
                  hasFire ? 'bg-pm-red' : progress >= 75 ? 'bg-pm-green' : 'bg-pm-cyan',
                )}
              />
            </div>
          </div>
        )}

        {task.status === 'done' && (
          <div className="h-1.5 bg-pm-green/30 rounded-full">
            <div className="h-full w-full bg-pm-green rounded-full" />
          </div>
        )}

        {/* アサイン済み人員 */}
        {assignedPersonnel.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {assignedPersonnel.map(p => (
              <button
                key={p.id}
                onClick={() => unassignPersonnel(p.id)}
                className="flex items-center gap-1 text-[10px] bg-pm-blue/40 text-pm-cyan px-1.5 py-0.5 rounded-full hover:bg-pm-red/30 hover:text-pm-red transition-colors"
                title="クリックで解除"
              >
                <span>{p.name.split('')[0]}{p.name.split('')[1]}</span>
                <span className="text-pm-muted">×</span>
              </button>
            ))}
          </div>
        )}

        {/* アサインヒント */}
        {isTapAssignable && (
          <p className="text-pm-cyan text-[10px] text-center mt-1 animate-pulse">タップ / ドロップしてアサイン ✓</p>
        )}
      </div>
    </div>
  )
}
