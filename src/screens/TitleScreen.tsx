import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { SCENARIOS } from '../constants/scenarios'

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '入門',
  normal: '標準',
  hard: '困難',
  hell: '地獄',
}
const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'text-pm-green',
  normal: 'text-pm-cyan',
  hard: 'text-pm-yellow',
  hell: 'text-pm-red',
}

export function TitleScreen({ onOpenSkillTree }: { onOpenSkillTree: () => void }) {
  const { startGame, startTutorial, bestScore, totalRuns, pmPoints, unlockedSkills } = useGameStore()

  return (
    <div className="h-full flex flex-col bg-pm-bg overflow-y-auto">
      {/* ヘッダー */}
      <div className="flex-shrink-0 pt-14 pb-6 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-pm-muted text-sm tracking-[0.3em] mb-2">— SIMULATION GAME —</p>
          <h1
            className="text-5xl font-bold tracking-tight text-pm-cyan title-glow"
            style={{ fontFamily: 'monospace' }}
          >
            I AM PM
          </h1>
          <p className="text-pm-muted text-sm mt-3">君、次のプロジェクトのPMを任せる</p>
        </motion.div>
      </div>

      {/* スタッツ＋PMポイント */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex-shrink-0 mx-4 mb-4 grid grid-cols-3 gap-2"
      >
        <div className="p-3 bg-pm-surface rounded-xl border border-white/8 text-center">
          <p className="text-pm-muted text-xs">プレイ回数</p>
          <p className="text-pm-cyan text-xl font-bold font-mono">{totalRuns}</p>
        </div>
        <div className="p-3 bg-pm-surface rounded-xl border border-white/8 text-center">
          <p className="text-pm-muted text-xs">ベストスコア</p>
          <p className="text-pm-yellow text-xl font-bold font-mono">{bestScore}</p>
        </div>
        <div className="p-3 bg-pm-surface rounded-xl border border-pm-yellow/30 text-center">
          <p className="text-pm-muted text-xs">PMポイント</p>
          <p className="text-pm-yellow text-xl font-bold font-mono">{pmPoints}</p>
        </div>
      </motion.div>

      {/* スキルツリーボタン */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex-shrink-0 px-4 pb-3"
      >
        <button
          onClick={onOpenSkillTree}
          className="w-full py-3 bg-pm-yellow/10 border border-pm-yellow/30 rounded-xl text-pm-yellow text-sm font-bold hover:bg-pm-yellow/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>⭐</span>
          <span>スキルツリー</span>
          <span className="ml-auto text-xs text-pm-muted font-normal">{unlockedSkills.length}スキル習得済</span>
        </button>
      </motion.div>

      {/* チュートリアル */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="flex-shrink-0 px-4 pb-4"
      >
        <button
          onClick={startTutorial}
          className="w-full py-3 bg-pm-blue/20 border border-pm-blue/40 rounded-xl text-pm-cyan text-sm font-bold hover:bg-pm-blue/30 active:scale-95 transition-all"
        >
          ▶ チュートリアルをプレイ
        </button>
      </motion.div>

      {/* シナリオ選択 */}
      <div className="flex-shrink-0 px-4 pb-4">
        <p className="text-pm-muted text-xs text-center mb-4 tracking-wider">── プロジェクトを選択 ──</p>
        <div className="flex flex-col gap-3">
          {SCENARIOS.map((scenario, i) => (
            <motion.button
              key={scenario.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              onClick={() => startGame(scenario)}
              className="w-full text-left p-4 bg-pm-surface border border-white/10 rounded-xl hover:border-pm-cyan/40 hover:bg-pm-card transition-all active:scale-95"
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-white font-bold text-base">{scenario.name}</span>
                <span className={`text-sm font-bold ${DIFFICULTY_COLOR[scenario.difficulty]}`}>
                  {DIFFICULTY_LABEL[scenario.difficulty]}
                </span>
              </div>
              <p className="text-pm-muted text-sm mb-2">{scenario.description}</p>
              <div className="flex gap-3 text-xs text-pm-muted">
                <span>⏱ {scenario.totalTurns}週間</span>
                <span>💰 {scenario.budget}万円</span>
                <span>📊 品質基準 {scenario.qualityMin}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* フッター */}
      <div className="flex-shrink-0 pb-8 text-center">
        <p className="text-pm-muted text-xs">ターン制カード × WBS × ローグライク</p>
      </div>
    </div>
  )
}
