import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { cn } from '../../utils/cn'

export function QCDPanel() {
  const { qcd, scenario, phases, activePersonnel, turn } = useGameStore()

  const allTasks = phases.flatMap(ph => ph.tasks)
  const totalBugs = allTasks.reduce((sum, t) => sum + t.bugs, 0)
  const weeklyBurn = activePersonnel.reduce((sum, p) => sum + p.costPerTurn, 0)
  const remainingBudget = qcd.budget - qcd.cost
  const turnsLeft = turn.max - turn.current

  return (
    <div className="h-full overflow-y-auto px-3 py-3 space-y-3">
      {/* QCDゲージ */}
      <div className="bg-pm-surface/60 rounded-xl border border-white/8 p-4">
        <p className="text-pm-muted text-xs mb-3 tracking-wider">── QCD ステータス ──</p>
        <div className="space-y-4">
          <GaugeItem
            label="Quality（品質）"
            value={qcd.quality}
            min={scenario?.qualityMin ?? 50}
            max={100}
            color={qcd.quality >= 70 ? 'bg-pm-green' : qcd.quality >= 40 ? 'bg-pm-yellow' : 'bg-pm-red'}
            sublabel={`基準値：${scenario?.qualityMin ?? 50} 以上`}
          />
          <GaugeItem
            label="Cost（コスト）"
            value={Math.min(100, (qcd.cost / qcd.budget) * 100)}
            min={0}
            max={100}
            color={qcd.cost / qcd.budget < 0.7 ? 'bg-pm-green' : qcd.cost / qcd.budget < 0.9 ? 'bg-pm-yellow' : 'bg-pm-red'}
            sublabel={`${qcd.cost}万 / ${qcd.budget}万円`}
            invert
          />
          <GaugeItem
            label="Delivery（進捗）"
            value={qcd.delivery}
            min={0}
            max={100}
            color={qcd.delivery >= 70 ? 'bg-pm-cyan' : qcd.delivery >= 40 ? 'bg-pm-yellow' : 'bg-pm-red'}
            sublabel={`${qcd.delivery}% 完了`}
          />
        </div>
      </div>

      {/* 詳細情報 */}
      <div className="bg-pm-surface/60 rounded-xl border border-white/8 p-4">
        <p className="text-pm-muted text-xs mb-3 tracking-wider">── 週次サマリー ──</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="残り週数" value={`${turnsLeft}週`} color="text-pm-cyan" />
          <StatCard label="週次コスト" value={`¥${weeklyBurn}万`} color="text-pm-yellow" />
          <StatCard label="残予算" value={`¥${remainingBudget}万`}
            color={remainingBudget > 200 ? 'text-pm-green' : remainingBudget > 0 ? 'text-pm-yellow' : 'text-pm-red'} />
          <StatCard label="蓄積バグ" value={`${totalBugs}件`}
            color={totalBugs === 0 ? 'text-pm-green' : totalBugs < 5 ? 'text-pm-yellow' : 'text-pm-red'} />
        </div>
      </div>

      {/* チーム状況 */}
      <div className="bg-pm-surface/60 rounded-xl border border-white/8 p-4">
        <p className="text-pm-muted text-xs mb-3 tracking-wider">── チーム状況 ──</p>
        {activePersonnel.length === 0 && (
          <p className="text-pm-muted text-sm text-center py-2">メンバー未アサイン</p>
        )}
        <div className="space-y-2">
          {activePersonnel.map(p => (
            <div key={p.id} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-pm-card flex items-center justify-center text-xs font-bold text-pm-cyan">
                {p.name[0]}
              </div>
              <div className="flex-1">
                <p className="text-white text-xs font-medium">{p.name}</p>
                <p className="text-pm-muted text-[10px]">
                  {p.assignedTaskId ? `作業中（${p.turnsOnTask}週連続）` : '待機中'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-pm-yellow text-xs">¥{p.costPerTurn}万/週</p>
                <div className="w-12 h-1 bg-black/40 rounded-full mt-0.5">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      p.condition >= 70 ? 'bg-pm-green' : p.condition >= 40 ? 'bg-pm-yellow' : 'bg-pm-red'
                    )}
                    style={{ width: `${p.condition}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GaugeItem({
  label, value, min, max, color, sublabel, invert,
}: {
  label: string
  value: number
  min: number
  max: number
  color: string
  sublabel: string
  invert?: boolean
}) {
  const displayValue = Math.round(Math.max(0, Math.min(100, value)))
  const dangerZone = invert ? value > 80 : value < min + 10

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-pm-text font-medium">{label}</span>
        <span className={dangerZone ? 'text-pm-red font-bold' : 'text-pm-muted'}>{sublabel}</span>
      </div>
      <div className="relative h-3 bg-black/40 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${displayValue}%` }}
          transition={{ duration: 0.6, type: 'spring' }}
          className={cn('h-full rounded-full', color)}
        />
        {/* 基準線（品質のみ） */}
        {!invert && min > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-pm-red/70"
            style={{ left: `${min}%` }}
          />
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-black/30 rounded-lg p-2 text-center">
      <p className="text-pm-muted text-[10px] mb-0.5">{label}</p>
      <p className={cn('text-base font-bold', color)}>{value}</p>
    </div>
  )
}
