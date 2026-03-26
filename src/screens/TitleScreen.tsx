import { useState } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { GAME_MODES, DIFFICULTY_STARS } from '../constants/gameModes'
import { MISSION_POOL } from '../constants/missions'
import { PERSONNEL_CARDS } from '../constants/cards'
import type { GameModeConfig, GameMode } from '../types/game'

const MISSION_POOL_MAP = Object.fromEntries(MISSION_POOL.map(m => [m.id, m]))

// チュートリアルを除いた選択可能なモード
const PLAYABLE_MODES = GAME_MODES.filter(m => m.id !== 'tutorial')

const MODE_ICON: Record<string, string> = {
  beginner: '🌱',
  standard: '📋',
  crisis: '🔥',
  large_scale: '🏗',
  multi_project: '🔀',
  expert: '👑',
}

const MODE_BG: Record<string, string> = {
  beginner: 'from-green-900/40 to-green-800/15 border-green-500/40',
  standard: 'from-blue-900/40 to-blue-800/15 border-blue-500/40',
  crisis: 'from-red-900/40 to-orange-900/15 border-red-500/40',
  large_scale: 'from-purple-900/40 to-purple-800/15 border-purple-500/40',
  multi_project: 'from-cyan-900/40 to-cyan-800/15 border-cyan-500/40',
  expert: 'from-yellow-900/40 to-yellow-800/15 border-yellow-500/40',
}

const MODE_ACCENT: Record<string, string> = {
  beginner: 'text-green-400',
  standard: 'text-blue-400',
  crisis: 'text-red-400',
  large_scale: 'text-purple-400',
  multi_project: 'text-pm-cyan',
  expert: 'text-pm-yellow',
}

const MODE_ACCENT_BG: Record<string, string> = {
  beginner: 'bg-green-400',
  standard: 'bg-blue-400',
  crisis: 'bg-red-400',
  large_scale: 'bg-purple-400',
  multi_project: 'bg-pm-cyan',
  expert: 'bg-pm-yellow',
}

const MODE_STATS: Record<string, { turns: number; budget: string; deck: number; tasks: string; minQuality: number }> = {
  beginner:      { turns: 15, budget: '2000万', deck: 3, tasks: '3',    minQuality: 15 },
  standard:      { turns: 15, budget: '2500万', deck: 4, tasks: '6',    minQuality: 50 },
  crisis:        { turns: 10, budget: '900万',  deck: 4, tasks: '5',    minQuality: 40 },
  large_scale:   { turns: 18, budget: '3000万', deck: 5, tasks: '15',   minQuality: 60 },
  multi_project: { turns: 12, budget: '900+1000万', deck: 7, tasks: '5+6', minQuality: 50 },
  expert:        { turns: 18, budget: '3000万', deck: 8, tasks: '15',   minQuality: 60 },
}

const CARD_FLIP_VARIANTS = {
  enter: (dir: number) => ({
    rotateY: dir > 0 ? 70 : -70,
    x: dir > 0 ? '25%' : '-25%',
    opacity: 0,
    scale: 0.92,
  }),
  center: {
    rotateY: 0,
    x: '0%',
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 320, damping: 28 },
  },
  exit: (dir: number) => ({
    rotateY: dir > 0 ? -70 : 70,
    x: dir > 0 ? '-25%' : '25%',
    opacity: 0,
    scale: 0.92,
    transition: { duration: 0.18 },
  }),
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < count ? 'text-pm-yellow' : 'text-white/15'} style={{ fontSize: '10px' }}>
          ★
        </span>
      ))}
    </div>
  )
}

function ModeCardContent({
  mode,
  isUnlocked,
  isCleared,
  completedMissionsByMode,
}: {
  mode: GameModeConfig
  isUnlocked: boolean
  isCleared: boolean
  completedMissionsByMode: Record<string, string[]>
}) {
  const completedMissionIds = completedMissionsByMode[mode.id] ?? []
  const stars = DIFFICULTY_STARS[mode.id] ?? 1
  const icon = MODE_ICON[mode.id]
  const bg = MODE_BG[mode.id]
  const accent = MODE_ACCENT[mode.id]

  const allMissionsCleared =
    mode.missionIds.length > 0 &&
    mode.missionIds.every(id => completedMissionIds.includes(id))

  return (
    <div className={`w-full p-5 rounded-2xl border bg-gradient-to-br ${bg} ${isUnlocked ? '' : 'opacity-60'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <p className={`font-bold text-base ${isUnlocked ? accent : 'text-pm-muted'}`}>
                {mode.name}
              </p>
              {isCleared && (
                <span className="text-[10px] font-bold bg-pm-yellow/20 text-pm-yellow border border-pm-yellow/40 px-1.5 py-0.5 rounded-full leading-none">
                  {allMissionsCleared ? '🏆 全達成' : '✓ クリア済'}
                </span>
              )}
            </div>
            <StarRating count={stars} />
          </div>
        </div>
        <div className="text-right">
          {!isUnlocked && <p className="text-pm-muted text-sm">🔒</p>}
          <p className="text-pm-muted text-[11px] mt-1">
            {mode.maxProjects > 1 ? `×${mode.maxProjects}案件` : '1案件'}
          </p>
          <p className="text-pm-muted text-[11px]">チーム{mode.teamSizeMin}名〜</p>
        </div>
      </div>

      <p className="text-pm-text text-sm leading-relaxed mb-3">{mode.description}</p>

      {MODE_STATS[mode.id] && (
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {[
            { label: 'ターン', value: `${MODE_STATS[mode.id].turns}` },
            { label: '予算', value: MODE_STATS[mode.id].budget },
            { label: '手札', value: `${MODE_STATS[mode.id].deck}枚` },
            { label: 'タスク', value: MODE_STATS[mode.id].tasks },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/5 rounded-lg px-1.5 py-1.5 text-center border border-white/8">
              <p className="text-pm-muted text-[9px] leading-none mb-0.5">{label}</p>
              <p className={`text-[11px] font-bold leading-none ${accent}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {mode.missionIds && mode.missionIds.length > 0 && (
        <div className="mt-3 border-t border-white/10 pt-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-pm-muted text-[10px] tracking-wider">── ミッション ──</span>
            <span className={`text-[10px] font-bold ${accent}`}>
              計{mode.missionIds.reduce((sum, id) => sum + (MISSION_POOL_MAP[id]?.reward ?? 0), 0)}PMpt
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {mode.missionIds.map(id => {
              const m = MISSION_POOL_MAP[id]
              if (!m) return null
              const done = completedMissionIds.includes(id)
              return (
                <div
                  key={id}
                  className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1 ${
                    done ? 'bg-pm-yellow/10 border border-pm-yellow/20' : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] shrink-0">{done ? '✅' : '🎯'}</span>
                    <span className={`text-[11px] font-medium truncate ${done ? 'text-pm-yellow/80' : 'text-pm-text'}`}>
                      {m.name}
                    </span>
                    <span className="text-pm-muted text-[10px] shrink-0">{m.displayTarget}</span>
                  </div>
                  <span className={`text-[11px] font-bold shrink-0 ${done ? 'text-pm-yellow/60 line-through' : accent}`}>
                    +{m.reward}pt
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isUnlocked && mode.unlocksCharacters && mode.unlocksCharacters.length > 0 && (
        <div className="mt-1 text-[10px] text-pm-muted">
          🔓 クリアで解放: {mode.unlocksCharacters.map(id => PERSONNEL_CARDS.find(p => p.id === id)?.name ?? id).join(', ')}
        </div>
      )}

      {!isUnlocked && mode.requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-pm-muted text-[10px]">必要スキル:</span>
          {mode.requiredSkills.map(s => (
            <span key={s} className="text-pm-muted text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function ModeFlipCarousel({
  unlockedSkills,
  clearedModes,
  completedMissionsByMode,
  onStart,
}: {
  unlockedSkills: string[]
  clearedModes: string[]
  completedMissionsByMode: Record<string, string[]>
  onStart: (mode: GameMode) => void
}) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const currentMode = PLAYABLE_MODES[index]
  const isUnlocked = currentMode.isUnlocked(unlockedSkills)
  const isCleared = clearedModes.includes(currentMode.id)
  const accent = MODE_ACCENT[currentMode.id]
  const accentBg = MODE_ACCENT_BG[currentMode.id]

  const goTo = (newIndex: number, dir: number) => {
    setDirection(dir)
    setIndex(newIndex)
  }

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -50) {
      goTo((index + 1) % PLAYABLE_MODES.length, 1)
    } else if (info.offset.x > 50) {
      goTo((index - 1 + PLAYABLE_MODES.length) % PLAYABLE_MODES.length, -1)
    }
  }

  return (
    <div className="px-4">
      <p className="text-pm-muted text-xs text-center mb-3 tracking-wider">── ゲームモードを選択 ──</p>

      {/* フリップカード */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ cursor: 'grab' }}
      >
        <div style={{ perspective: '1000px' }} className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentMode.id}
              custom={direction}
              variants={CARD_FLIP_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <ModeCardContent
                mode={currentMode}
                isUnlocked={isUnlocked}
                isCleared={isCleared}
                completedMissionsByMode={completedMissionsByMode}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ナビゲーション */}
      <div className="flex items-center justify-between mt-3 px-1">
        <button
          onClick={() => goTo((index - 1 + PLAYABLE_MODES.length) % PLAYABLE_MODES.length, -1)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/8 text-pm-muted hover:bg-white/15 active:scale-90 transition-all text-xl font-bold"
        >
          ‹
        </button>

        {/* ドット */}
        <div className="flex gap-1.5 items-center">
          {PLAYABLE_MODES.map((m, i) => {
            const mCleared = clearedModes.includes(m.id)
            const mAllDone = m.missionIds.length > 0 && m.missionIds.every(id => (completedMissionsByMode[m.id] ?? []).includes(id))
            return (
              <button
                key={m.id}
                onClick={() => goTo(i, i > index ? 1 : -1)}
                className={`relative rounded-full transition-all duration-200 ${
                  i === index
                    ? `w-4 h-2 ${accentBg}`
                    : mCleared
                      ? `w-2 h-2 ${MODE_ACCENT_BG[m.id]} opacity-60`
                      : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                }`}
              >
                {mAllDone && i !== index && (
                  <span className="absolute -top-1 -right-1 text-[7px] leading-none">⭐</span>
                )}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => goTo((index + 1) % PLAYABLE_MODES.length, 1)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/8 text-pm-muted hover:bg-white/15 active:scale-90 transition-all text-xl font-bold"
        >
          ›
        </button>
      </div>

      {/* STARTボタン */}
      <AnimatePresence mode="wait">
        <motion.button
          key={currentMode.id + '_btn'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          onClick={isUnlocked ? () => onStart(currentMode.id as GameMode) : undefined}
          className={`w-full mt-4 py-4 rounded-xl font-bold text-base transition-all ${
            isUnlocked
              ? `${accent} border ${MODE_BG[currentMode.id]?.split(' ')[2] ?? 'border-white/20'} bg-white/5 hover:bg-white/10 active:scale-95`
              : 'text-pm-muted bg-white/5 border border-white/10 cursor-not-allowed'
          }`}
        >
          {isUnlocked ? `▶ ${currentMode.name}を開始` : '🔒 スキルをアンロックして解放'}
        </motion.button>
      </AnimatePresence>
    </div>
  )
}

export function TitleScreen({ onOpenSkillTree }: { onOpenSkillTree: () => void }) {
  const { startGameMode, startTutorial, bestScore, totalRuns, pmPoints, unlockedSkills, clearedModes, completedMissionsByMode } = useGameStore()

  return (
    <div className="h-full flex flex-col bg-pm-bg overflow-y-auto">
      {/* ヘッダー */}
      <div className="flex-shrink-0 pt-12 pb-4 text-center px-6">
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
            AM I PM
          </h1>
          <p className="text-pm-muted text-sm mt-2">君、次のプロジェクトのPMを任せる</p>
        </motion.div>
      </div>

      {/* スタッツ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex-shrink-0 mx-4 mb-3 grid grid-cols-3 gap-2"
      >
        <div className="p-2.5 bg-pm-surface rounded-xl border border-white/8 text-center">
          <p className="text-pm-muted text-[10px]">プレイ回数</p>
          <p className="text-pm-cyan text-xl font-bold font-mono">{totalRuns}</p>
        </div>
        <div className="p-2.5 bg-pm-surface rounded-xl border border-white/8 text-center">
          <p className="text-pm-muted text-[10px]">ベストスコア</p>
          <p className="text-pm-yellow text-xl font-bold font-mono">{bestScore}</p>
        </div>
        <div className="p-2.5 bg-pm-surface rounded-xl border border-pm-yellow/30 text-center">
          <p className="text-pm-muted text-[10px]">PMポイント</p>
          <p className="text-pm-yellow text-xl font-bold font-mono">{pmPoints}</p>
        </div>
      </motion.div>

      {/* スキルツリー・チュートリアルボタン */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex-shrink-0 px-4 pb-3 flex gap-2"
      >
        <button
          onClick={onOpenSkillTree}
          className="flex-1 py-2.5 bg-pm-yellow/10 border border-pm-yellow/30 rounded-xl text-pm-yellow text-sm font-bold hover:bg-pm-yellow/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>⭐</span>
          <span>スキルツリー</span>
          <span className="text-xs text-pm-muted font-normal">{unlockedSkills.length}習得</span>
        </button>
        <button
          onClick={startTutorial}
          className="py-2.5 px-4 bg-pm-cyan/10 border border-pm-cyan/30 rounded-xl text-pm-cyan text-sm font-bold hover:bg-pm-cyan/20 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <span>📖</span>
          <span>チュートリアル</span>
        </button>
      </motion.div>

      {/* モードフリップカルーセル */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex-shrink-0 pb-4"
      >
        <ModeFlipCarousel
          unlockedSkills={unlockedSkills}
          clearedModes={clearedModes}
          completedMissionsByMode={completedMissionsByMode}
          onStart={startGameMode}
        />
      </motion.div>
    </div>
  )
}
