import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { cn } from '../../utils/cn'

const SEVERITY_CONFIG = {
  positive: {
    bg: 'from-pm-green/30 to-pm-bg',
    border: 'border-pm-green',
    glow: 'shadow-[0_0_60px_rgba(6,214,160,0.4)]',
    badge: 'bg-pm-green text-pm-bg',
    badgeText: '✦ GOOD NEWS',
    icon: '✨',
    scanColor: 'rgba(6,214,160,0.15)',
    textColor: 'text-pm-green',
  },
  neutral: {
    bg: 'from-pm-cyan/20 to-pm-bg',
    border: 'border-pm-cyan/60',
    glow: 'shadow-[0_0_40px_rgba(0,180,216,0.2)]',
    badge: 'bg-pm-cyan/20 text-pm-cyan border border-pm-cyan/40',
    badgeText: '▸ NOTIFICATION',
    icon: '📋',
    scanColor: 'rgba(0,180,216,0.1)',
    textColor: 'text-pm-cyan',
  },
  negative: {
    bg: 'from-pm-yellow/20 to-pm-bg',
    border: 'border-pm-yellow/60',
    glow: 'shadow-[0_0_50px_rgba(255,209,102,0.3)]',
    badge: 'bg-pm-yellow/20 text-pm-yellow border border-pm-yellow/40',
    badgeText: '⚠ WARNING',
    icon: '⚠️',
    scanColor: 'rgba(255,209,102,0.12)',
    textColor: 'text-pm-yellow',
  },
  critical: {
    bg: 'from-pm-red/40 to-pm-bg',
    border: 'border-pm-red',
    glow: 'shadow-[0_0_80px_rgba(239,71,111,0.5)]',
    badge: 'bg-pm-red text-white',
    badgeText: '🔥 CRITICAL',
    icon: '🔥',
    scanColor: 'rgba(239,71,111,0.2)',
    textColor: 'text-pm-red',
  },
}

export function EventModal() {
  const { activeEvent, resolveEvent, dismissEvent } = useGameStore()
  const [phase, setPhase] = useState<'enter' | 'reveal' | 'choices'>('enter')
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (!activeEvent) return
    setPhase('enter')
    setShake(false)

    const t1 = setTimeout(() => {
      setPhase('reveal')
      if (activeEvent.severity === 'critical') {
        setShake(true)
        setTimeout(() => setShake(false), 600)
      }
    }, 400)
    const t2 = setTimeout(() => setPhase('choices'), 1200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [activeEvent?.id])

  if (!activeEvent) return null
  const cfg = SEVERITY_CONFIG[activeEvent.severity]

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* フルスクリーン背景 */}
      <motion.div
        className={cn('absolute inset-0 bg-gradient-to-b', cfg.bg)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* スキャンライン演出 */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.3] }}
        transition={{ duration: 0.8, times: [0, 0.3, 1] }}
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            ${cfg.scanColor} 2px,
            ${cfg.scanColor} 4px
          )`,
        }}
      />

      {/* シェイク効果 */}
      <motion.div
        className="relative flex-1 flex flex-col overflow-hidden"
        animate={shake ? {
          x: [0, -8, 8, -6, 6, -4, 4, 0],
          transition: { duration: 0.5, times: [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1] }
        } : {}}
      >
        {/* 上部ヘッダー */}
        <motion.div
          className="flex-shrink-0 pt-10 pb-4 px-6 text-center"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* バッジ */}
          <motion.div
            className="inline-flex items-center justify-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 20 }}
          >
            <span className={cn('px-4 py-1.5 rounded-full text-xs font-bold tracking-widest', cfg.badge)}>
              {cfg.badgeText}
            </span>
          </motion.div>

          {/* メインアイコン */}
          <motion.div
            className="text-6xl mb-4"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 18 }}
          >
            {cfg.icon}
          </motion.div>

          {/* タイトル */}
          <AnimatePresence>
            {phase !== 'enter' && (
              <motion.h2
                className={cn('text-2xl font-bold mb-1', cfg.textColor)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeEvent.name}
              </motion.h2>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 本文エリア */}
        <div className="flex-1 px-6 overflow-y-auto">
          <AnimatePresence>
            {phase !== 'enter' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className={cn(
                  'rounded-xl border p-4 mb-4',
                  cfg.border,
                  'bg-black/30 backdrop-blur-sm',
                  cfg.glow,
                )}
              >
                <p className="text-pm-text text-sm leading-relaxed mb-3">{activeEvent.description}</p>
                <p className="text-pm-muted text-xs italic border-t border-white/10 pt-2">{activeEvent.flavor}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 選択肢 */}
          <AnimatePresence>
            {phase === 'choices' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 pb-6"
              >
                <p className={cn('text-xs font-bold tracking-widest text-center mb-3', cfg.textColor)}>
                  ── どう対応する？ ──
                </p>
                {activeEvent.choices.map((choice, i) => (
                  <motion.button
                    key={choice.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.12 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => resolveEvent(activeEvent.id, choice.id)}
                    className={cn(
                      'w-full text-left p-4 rounded-xl border transition-all',
                      'bg-black/40 backdrop-blur-sm hover:bg-white/10',
                      'border-white/15 hover:border-white/30',
                    )}
                  >
                    <p className="text-white text-sm font-bold mb-1">{choice.label}</p>
                    <p className="text-pm-muted text-xs">{choice.description}</p>
                  </motion.button>
                ))}

                {activeEvent.choices.length === 0 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={dismissEvent}
                    className="w-full py-4 bg-white/10 text-white text-sm rounded-xl font-bold"
                  >
                    了解
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 下部デコ */}
        <motion.div
          className={cn('flex-shrink-0 h-1', cfg.border.replace('border-', 'bg-').split('/')[0])}
          style={{ opacity: 0.6 }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        />
      </motion.div>
    </motion.div>
  )
}
