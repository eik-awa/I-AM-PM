import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'

const COLOR_STYLE: Record<string, { bg: string; text: string; glow: string }> = {
  combo_tech_set:        { bg: 'from-blue-900/90 to-blue-700/80',    text: 'text-blue-200',   glow: 'shadow-blue-500/50' },
  combo_drive_set:       { bg: 'from-yellow-900/90 to-yellow-700/80', text: 'text-yellow-200', glow: 'shadow-yellow-500/50' },
  combo_adjust_set:      { bg: 'from-green-900/90 to-green-700/80',   text: 'text-green-200',  glow: 'shadow-green-500/50' },
  combo_blitz_set:       { bg: 'from-red-900/90 to-red-700/80',       text: 'text-red-200',    glow: 'shadow-red-500/50' },
  combo_tanaka_chain:    { bg: 'from-purple-900/90 to-purple-700/80', text: 'text-purple-200', glow: 'shadow-purple-500/50' },
  combo_takahashi_chain: { bg: 'from-green-900/90 to-teal-700/80',    text: 'text-teal-200',   glow: 'shadow-teal-500/50' },
  combo_kimura_chain:    { bg: 'from-blue-900/90 to-indigo-700/80',   text: 'text-indigo-200', glow: 'shadow-indigo-500/50' },
  combo_yamada_awakening: { bg: 'from-orange-900/90 to-amber-700/80', text: 'text-amber-200',  glow: 'shadow-amber-500/50' },
}

const COMBO_EMOJI: Record<string, string> = {
  combo_tech_set: '🔵',
  combo_drive_set: '🟡',
  combo_adjust_set: '🟢',
  combo_blitz_set: '🔴',
  combo_tanaka_chain: '⚙️',
  combo_takahashi_chain: '🔍',
  combo_kimura_chain: '👁',
  combo_yamada_awakening: '✨',
}

export function ComboActivationOverlay() {
  const { pendingComboActivation, dismissComboActivation } = useGameStore()

  // 0.8秒後に自動dismisss
  useEffect(() => {
    if (!pendingComboActivation) return
    const timer = setTimeout(() => {
      dismissComboActivation()
    }, 2200)
    return () => clearTimeout(timer)
  }, [pendingComboActivation, dismissComboActivation])

  const style = pendingComboActivation
    ? (COLOR_STYLE[pendingComboActivation.id] ?? COLOR_STYLE.combo_tech_set)
    : null

  return (
    <AnimatePresence>
      {pendingComboActivation && style && (
        <motion.div
          key={pendingComboActivation.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ backdropFilter: 'blur(2px)' }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={`
              bg-gradient-to-br ${style.bg} rounded-2xl px-8 py-6 mx-6
              border border-white/20 shadow-2xl ${style.glow} shadow-xl
              flex flex-col items-center gap-3 text-center max-w-xs
            `}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.4, 1] }}
              transition={{ duration: 0.4, times: [0, 0.6, 1] }}
              className="text-5xl"
            >
              {COMBO_EMOJI[pendingComboActivation.id] ?? '🌟'}
            </motion.div>

            <div>
              <p className="text-white/60 text-xs tracking-widest uppercase mb-1">COMBO!</p>
              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`text-xl font-bold ${style.text}`}
              >
                {pendingComboActivation.name}
              </motion.h2>
            </div>

            <motion.p
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-white/70 text-sm italic"
            >
              {pendingComboActivation.flavorText}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/50 text-xs"
            >
              {pendingComboActivation.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-white/30 text-[10px]"
            >
              図鑑に記録されました ✓
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
