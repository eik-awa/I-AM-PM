import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'

export function BossHintModal({ onClose }: { onClose: () => void }) {
  const { bossHints, status } = useGameStore()

  const isWon = status === 'won'

  return (
    <AnimatePresence>
      <motion.div
        key="boss-hint-overlay"
        className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-h-[85vh] bg-pm-surface rounded-t-2xl border-t border-white/15 overflow-hidden flex flex-col"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        >
          {/* ヘッダー */}
          <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-4xl">👔</span>
              <div>
                <p className="text-pm-muted text-xs tracking-wider">上司からのフィードバック</p>
                <h2 className={`text-xl font-bold ${isWon ? 'text-pm-green' : 'text-pm-yellow'}`}>
                  {isWon ? 'よくやった！' : 'お疲れ様でした。'}
                </h2>
              </div>
            </div>
            <p className="text-pm-muted text-xs mt-2 italic">
              {isWon
                ? '「今回のプロジェクト、しっかりまとめてくれたな。次はさらに難しい案件を任せたい。」'
                : '「今回は残念だったが、失敗から学ぶことが大切だ。次に活かせ。」'}
            </p>
          </div>

          {/* ヒント一覧 */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {bossHints.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-pm-muted text-sm">「特に言うことはない。よくやった。」</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {bossHints.map((hint, i) => (
                  <motion.div
                    key={hint.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.12 }}
                    className="bg-pm-card rounded-xl border border-white/10 p-4"
                  >
                    {/* トリガー条件 */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-pm-muted text-[9px] uppercase tracking-wider">観察事項</span>
                      <span className="text-pm-muted text-[10px] bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                        {hint.condition}
                      </span>
                    </div>

                    {/* メッセージ */}
                    <div className="mb-2">
                      <div className="flex items-start gap-2">
                        <span className="text-pm-yellow text-sm mt-0.5 flex-shrink-0">💬</span>
                        <p className="text-white text-sm leading-relaxed">{hint.message}</p>
                      </div>
                    </div>

                    {/* アドバイス */}
                    <div className="bg-pm-cyan/5 border border-pm-cyan/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <span className="text-pm-cyan text-sm mt-0.5 flex-shrink-0">💡</span>
                        <p className="text-pm-text text-xs leading-relaxed">{hint.advice}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 署名 */}
            <div className="mt-4 text-right pb-2">
              <p className="text-pm-muted text-xs italic">— プロジェクト統括部長 田所</p>
            </div>
          </div>

          {/* フッターボタン */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-white/10 bg-pm-surface">
            <button
              onClick={onClose}
              className="w-full py-3 bg-pm-cyan/20 border border-pm-cyan/40 rounded-xl text-pm-cyan font-bold text-sm hover:bg-pm-cyan/30 active:scale-95 transition-all"
            >
              次のプロジェクトへ →
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
