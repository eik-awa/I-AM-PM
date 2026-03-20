import { useGameStore } from '../../store/gameStore'
import { cn } from '../../utils/cn'

export function StatusBar() {
  const { turn, qcd } = useGameStore()

  const qualityColor = qcd.quality >= 70 ? 'text-pm-green' : qcd.quality >= 40 ? 'text-pm-yellow' : 'text-pm-red'
  const costRatio = qcd.cost / qcd.budget
  const costColor = costRatio < 0.7 ? 'text-pm-green' : costRatio < 0.9 ? 'text-pm-yellow' : 'text-pm-red'

  return (
    <div className="flex-shrink-0 bg-pm-surface/80 backdrop-blur border-b border-white/5 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* ターン */}
        <div className="flex items-center gap-1">
          <span className="text-pm-muted text-xs">WEEK</span>
          <span className="text-pm-cyan font-bold text-lg">{turn.current}</span>
          <span className="text-pm-muted text-xs">/{turn.max}</span>
        </div>

        {/* ターンバー */}
        <div className="flex gap-0.5 flex-1 mx-3">
          {Array.from({ length: turn.max }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 flex-1 rounded-sm',
                i < turn.current - 1 ? 'bg-pm-cyan/40' :
                i === turn.current - 1 ? 'bg-pm-cyan' :
                'bg-white/10'
              )}
            />
          ))}
        </div>

        {/* QCDミニゲージ */}
        <div className="flex gap-3 text-xs">
          <span className={qualityColor}>Q:{Math.round(qcd.quality)}</span>
          <span className={costColor}>C:{qcd.cost}</span>
          <span className="text-pm-text">D:{qcd.delivery}%</span>
        </div>
      </div>
    </div>
  )
}
