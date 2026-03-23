import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'

export function TurnPanel() {
  const { turn, endTurn, activePersonnel, projects, activeProjectId, activeEvent, log } = useGameStore()
  const [showLog, setShowLog] = useState(false)

  // アクティブプロジェクトの進捗サマリー
  const activeProject = projects.find(p => p.id === activeProjectId)
  const phases = activeProject?.phases ?? []
  const allTasks = phases.flatMap(ph => ph.tasks)
  const doneTasks = allTasks.filter(t => t.status === 'done').length
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length
  const totalTasks = allTasks.length

  const unassignedPersonnel = activePersonnel.filter(p => !p.assignedTaskId).length
  const recentLogs = log.slice(-5).reverse()

  return (
    <div className="flex-shrink-0 bg-pm-surface/90 border-t border-white/10 px-3 py-3">
      {/* ログトグル */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setShowLog(!showLog)}
          className="flex-1 text-left text-pm-muted text-xs hover:text-pm-text transition-colors"
        >
          {showLog ? '▼' : '▶'} ログ {showLog ? '（非表示）' : '（表示）'}
        </button>
        <div className="flex items-center gap-2 text-xs text-pm-muted">
          <span>✅{doneTasks}/{totalTasks}</span>
          <span>🔨{inProgressTasks}</span>
          {unassignedPersonnel > 0 && (
            <span className="text-pm-yellow">⚠️{unassignedPersonnel}名未配置</span>
          )}
        </div>
      </div>

      {/* ログ */}
      <AnimatePresence>
        {showLog && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-2"
          >
            <div className="bg-black/40 rounded-lg p-2 max-h-28 overflow-y-auto space-y-0.5">
              {recentLogs.map((entry, i) => (
                <p key={i} className={`text-[10px] ${
                  entry.type === 'success' ? 'text-pm-green' :
                  entry.type === 'warning' ? 'text-pm-yellow' :
                  entry.type === 'danger' ? 'text-pm-red' :
                  'text-pm-muted'
                }`}>
                  <span className="text-pm-muted/60 mr-1">W{entry.turn}</span>
                  {entry.message}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ターン終了ボタン */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={endTurn}
        disabled={!!activeEvent}
        className={`w-full py-3.5 rounded-xl font-bold text-base transition-all ${
          activeEvent
            ? 'bg-pm-muted/30 text-pm-muted cursor-not-allowed'
            : 'bg-gradient-to-r from-pm-cyan to-pm-blue text-white hover:opacity-90 glow-cyan'
        }`}
      >
        {activeEvent
          ? 'イベントを解決してください'
          : turn.current >= turn.max
            ? `最終Week ${turn.current} 終了（ゲーム終了）`
            : `Week ${turn.current} 終了 → Week ${turn.current + 1} へ`}
      </motion.button>
    </div>
  )
}
