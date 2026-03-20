import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { calculateFinalScore } from '../engine/progressEngine'

const RANK_THRESHOLDS = [
  { min: 90, rank: 'S', label: '完璧なPM', color: 'text-pm-yellow' },
  { min: 75, rank: 'A', label: '優秀なPM', color: 'text-pm-cyan' },
  { min: 60, rank: 'B', label: '及第点', color: 'text-pm-green' },
  { min: 40, rank: 'C', label: '課題あり', color: 'text-pm-muted' },
  { min: 0, rank: 'D', label: '再挑戦を', color: 'text-pm-red' },
]

export function ResultScreen() {
  const { status, qcd, turn, scenario, goToTitle, log, missions, pmPoints } = useGameStore()
  const won = status === 'won'

  const score = scenario
    ? calculateFinalScore(qcd.quality, qcd.cost, qcd.budget, turn.current, turn.max)
    : 0

  const rankEntry = RANK_THRESHOLDS.find(r => score >= r.min) ?? RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1]

  const lastLogs = log.slice(-5)

  return (
    <div className="h-full flex flex-col bg-pm-bg overflow-y-auto">
      {/* 結果ヘッダー */}
      <div className="flex-shrink-0 pt-12 pb-6 text-center px-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          <div className="text-6xl mb-3">{won ? '🎉' : '💀'}</div>
          <h2 className="text-3xl font-bold text-white mb-1">
            {won ? 'プロジェクト完了！' : 'プロジェクト失敗'}
          </h2>
          <p className="text-pm-muted text-sm">
            {won ? `${turn.current - 1}週間でデリバリー達成` : '次回に活かそう'}
          </p>
        </motion.div>
      </div>

      {/* スコア */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex-shrink-0 mx-6 mb-5 p-5 bg-pm-surface rounded-xl border border-white/10 text-center"
      >
        <p className="text-pm-muted text-sm mb-2">総合スコア</p>
        <div className="flex items-end justify-center gap-3">
          <span className={`text-7xl font-bold ${rankEntry.color}`}>{rankEntry.rank}</span>
          <span className="text-4xl font-bold text-white mb-2">{score}</span>
        </div>
        <p className={`text-sm mt-1 ${rankEntry.color}`}>{rankEntry.label}</p>
      </motion.div>

      {/* QCD詳細 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex-shrink-0 mx-6 mb-5 p-4 bg-pm-surface rounded-xl border border-white/10"
      >
        <p className="text-pm-muted text-xs mb-3">── 評価詳細 ──</p>
        <div className="space-y-3">
          <QCDBar label="品質（Quality）" value={qcd.quality} color="bg-pm-green" weight={35} />
          <QCDBar
            label="コスト（Cost）"
            value={Math.max(0, Math.min(100, 100 - (qcd.cost / qcd.budget) * 100 + 50))}
            color="bg-pm-cyan"
            weight={25}
            sublabel={`${qcd.cost}万/${qcd.budget}万`}
          />
          <QCDBar
            label="納期（Delivery）"
            value={won ? 100 : qcd.delivery}
            color="bg-pm-yellow"
            weight={40}
          />
        </div>
      </motion.div>

      {/* ミッション結果 */}
      {missions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex-shrink-0 mx-6 mb-5 p-4 bg-pm-surface rounded-xl border border-pm-yellow/20"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-pm-muted text-xs">── ミッション結果 ──</p>
            <p className="text-pm-yellow text-sm font-bold">
              +{missions.filter(m => m.status === 'completed').reduce((s, m) => s + m.reward, 0)}pt 獲得
            </p>
          </div>
          <div className="space-y-2">
            {missions.map(m => (
              <div key={m.id} className="flex items-center gap-2">
                <span className={m.status === 'completed' ? 'text-pm-green' : 'text-pm-muted'}>
                  {m.status === 'completed' ? '✓' : '✕'}
                </span>
                <span className="text-sm text-white flex-1">{m.name}</span>
                <span className={`text-xs font-bold ${m.status === 'completed' ? 'text-pm-yellow' : 'text-pm-muted'}`}>
                  {m.status === 'completed' ? `+${m.reward}pt` : '---'}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-white/8 flex justify-between">
            <span className="text-pm-muted text-xs">累計 PM ポイント</span>
            <span className="text-pm-yellow font-bold">{pmPoints} pt</span>
          </div>
        </motion.div>
      )}

      {/* ログ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex-shrink-0 mx-6 mb-6 p-4 bg-pm-surface rounded-xl border border-white/10"
      >
        <p className="text-pm-muted text-xs mb-2">── 最終週の記録 ──</p>
        <div className="space-y-1">
          {lastLogs.map((entry, i) => (
            <p key={i} className="text-xs text-pm-muted">
              <span className="text-pm-muted mr-1">W{entry.turn}</span>
              {entry.message}
            </p>
          ))}
        </div>
      </motion.div>

      {/* 上司コメント */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex-shrink-0 mx-6 mb-6 p-4 bg-pm-card rounded-xl border border-pm-cyan/20"
      >
        <p className="text-pm-cyan text-xs mb-1">上司より</p>
        <p className="text-white text-sm italic">
          {won && score >= 80 && '「よくやった。これが本物のPMだ」'}
          {won && score >= 60 && score < 80 && '「まあ、悪くない。次はもっと上手くやれ」'}
          {won && score < 60 && '「ギリギリだな。クオリティは上げろ」'}
          {!won && '「それが現実というものだ。次の案件で取り返せ」'}
        </p>
      </motion.div>

      {/* ボタン */}
      <div className="flex-shrink-0 px-6 pb-12">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={goToTitle}
          className="w-full py-4 bg-pm-cyan text-pm-bg font-bold text-lg rounded-xl hover:bg-pm-cyan/80 active:scale-95 transition-all"
        >
          タイトルへ戻る
        </motion.button>
      </div>
    </div>
  )
}

function QCDBar({
  label, value, color, weight, sublabel,
}: {
  label: string
  value: number
  color: string
  weight: number
  sublabel?: string
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-pm-text">{label}</span>
        <span className="text-pm-muted">{sublabel ?? `${Math.round(value)}`} <span className="text-pm-muted/60">（×{weight}%）</span></span>
      </div>
      <div className="h-2 bg-black/40 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  )
}
