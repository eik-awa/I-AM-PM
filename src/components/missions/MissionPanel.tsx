import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { cn } from '../../utils/cn'

const STATUS_STYLES = {
  active: { border: 'border-white/15', bg: 'bg-white/3', badge: 'text-pm-muted', badgeText: '進行中' },
  completed: { border: 'border-pm-green/50', bg: 'bg-pm-green/8', badge: 'text-pm-green', badgeText: '達成！' },
  failed: { border: 'border-white/8', bg: 'bg-white/2', badge: 'text-pm-red', badgeText: '失敗' },
}

export function MissionPanel() {
  const { missions, pmPoints } = useGameStore()

  if (missions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-pm-muted text-sm">
        ミッションなし
      </div>
    )
  }

  const completedCount = missions.filter(m => m.status === 'completed').length
  const totalReward = missions
    .filter(m => m.status === 'completed')
    .reduce((sum, m) => sum + m.reward, 0)

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      {/* PMポイント表示 */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 p-3 bg-pm-surface rounded-xl border border-pm-yellow/30 flex items-center justify-between"
      >
        <div>
          <p className="text-pm-muted text-xs tracking-wider">累計 PM ポイント</p>
          <p className="text-pm-yellow text-2xl font-bold font-mono">{pmPoints} <span className="text-sm font-normal text-pm-muted">pt</span></p>
        </div>
        <div className="text-right">
          <p className="text-pm-muted text-xs">今回の報酬</p>
          <p className="text-pm-green text-lg font-bold">+{totalReward} pt</p>
        </div>
      </motion.div>

      <p className="text-pm-muted text-xs text-center mb-3 tracking-wider">
        ── ミッション {completedCount}/{missions.length} 達成 ──
      </p>

      {/* ミッションリスト */}
      <div className="space-y-3">
        {missions.map((mission, i) => {
          const styles = STATUS_STYLES[mission.status]
          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                'rounded-xl border p-4',
                styles.border, styles.bg,
                mission.status === 'failed' ? 'opacity-50' : '',
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white text-sm font-bold">{mission.name}</span>
                    {mission.status === 'completed' && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                        className="text-pm-green text-base"
                      >
                        ✓
                      </motion.span>
                    )}
                  </div>
                  <p className="text-pm-muted text-xs">{mission.description}</p>
                </div>
                <div className="flex-shrink-0 ml-2 text-right">
                  <p className={cn('text-xs font-bold', styles.badge)}>{styles.badgeText}</p>
                  <p className="text-pm-yellow text-sm font-bold">+{mission.reward}pt</p>
                </div>
              </div>

              {/* 進捗バー */}
              {mission.status !== 'failed' && (
                <div>
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full rounded-full',
                        mission.status === 'completed' ? 'bg-pm-green' : 'bg-pm-cyan',
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${mission.progress}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-pm-muted text-xs">{mission.displayTarget}</span>
                    <span className={cn('text-xs font-bold', mission.status === 'completed' ? 'text-pm-green' : 'text-pm-muted')}>
                      {mission.progress}%
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <div className="mt-4 p-3 bg-pm-surface/50 rounded-lg border border-white/5">
        <p className="text-pm-muted text-xs text-center">
          PMポイントはスキルツリーでスキル習得に使えます
        </p>
      </div>
    </div>
  )
}
