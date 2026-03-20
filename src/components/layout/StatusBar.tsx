import { useGameStore } from '../../store/gameStore'
import { cn } from '../../utils/cn'

const MODE_LABEL: Record<string, string> = {
  tutorial: '入門',
  standard: '標準',
  crisis: '炎上',
  large_scale: '大規模',
  multi_project: '複数案件',
  expert: 'EX',
}

const MODE_COLOR: Record<string, string> = {
  tutorial: 'text-green-400',
  standard: 'text-blue-400',
  crisis: 'text-pm-red',
  large_scale: 'text-purple-400',
  multi_project: 'text-pm-cyan',
  expert: 'text-pm-yellow',
}

export function StatusBar() {
  const { turn, projects, activeProjectId, mode, skillPoints } = useGameStore()

  // アクティブプロジェクトのQCDを表示
  const activeProject = projects.find(p => p.id === activeProjectId)
  const qcd = activeProject?.qcd ?? { quality: 0, cost: 0, budget: 0, delivery: 0 }

  const qualityColor = qcd.quality >= 70 ? 'text-pm-green' : qcd.quality >= 40 ? 'text-pm-yellow' : 'text-pm-red'
  const costRatio = qcd.budget > 0 ? qcd.cost / qcd.budget : 0
  const costColor = costRatio < 0.7 ? 'text-pm-green' : costRatio < 0.9 ? 'text-pm-yellow' : 'text-pm-red'

  return (
    <div className="flex-shrink-0 bg-pm-surface/80 backdrop-blur border-b border-white/5 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* ターン + モード */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-pm-muted text-xs">W</span>
            <span className="text-pm-cyan font-bold text-lg">{turn.current}</span>
            <span className="text-pm-muted text-xs">/{turn.max}</span>
          </div>
          <span className={cn('text-[10px] font-bold', MODE_COLOR[mode] ?? 'text-pm-muted')}>
            [{MODE_LABEL[mode] ?? mode}]
          </span>
        </div>

        {/* ターンバー */}
        <div className="flex gap-0.5 flex-1 mx-2">
          {Array.from({ length: Math.min(turn.max, 18) }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-sm',
                i < turn.current - 1 ? 'bg-pm-cyan/40' :
                i === turn.current - 1 ? 'bg-pm-cyan' :
                'bg-white/10',
              )}
            />
          ))}
        </div>

        {/* QCDミニゲージ + スキルポイント */}
        <div className="flex items-center gap-2 text-xs">
          <span className={qualityColor}>Q:{Math.round(qcd.quality)}</span>
          <span className={costColor}>C:{qcd.cost}</span>
          <span className="text-pm-text">D:{qcd.delivery}%</span>
          {skillPoints > 0 && (
            <span className="text-pm-yellow font-bold">⚡{skillPoints}SP</span>
          )}
        </div>
      </div>
    </div>
  )
}
