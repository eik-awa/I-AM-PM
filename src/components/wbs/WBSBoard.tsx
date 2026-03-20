import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { WBSTaskRow } from './WBSTaskRow'

export function WBSBoard() {
  const { phases } = useGameStore()
  const [expandedPhase, setExpandedPhase] = useState<string | null>(phases[0]?.id ?? null)

  return (
    <div className="h-full overflow-y-auto px-3 py-2 space-y-2">
      {phases.map(phase => {
        const doneTasks = phase.tasks.filter(t => t.status === 'done').length
        const isExpanded = expandedPhase === phase.id
        const allDone = doneTasks === phase.tasks.length

        return (
          <div key={phase.id} className="bg-pm-surface/60 rounded-xl border border-white/8 overflow-hidden">
            {/* フェーズヘッダー */}
            <button
              onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${allDone ? 'bg-pm-green' : 'bg-pm-cyan'}`} />
                <span className="text-white text-sm font-semibold">{phase.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-pm-muted text-xs">{doneTasks}/{phase.tasks.length}</span>
                <span className={`text-pm-muted text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </div>
            </button>

            {/* タスクリスト */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-2 pb-2 space-y-1.5">
                    {phase.tasks.map(task => (
                      <WBSTaskRow key={task.id} task={task} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
