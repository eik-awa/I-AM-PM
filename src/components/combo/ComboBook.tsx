import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { COMBO_RECIPES } from '../../constants/combos'
import type { ComboRecipe } from '../../types/combo'
import { cn } from '../../utils/cn'

const COLOR_BADGE: Record<string, { label: string; bg: string; border: string }> = {
  combo_tech_set:        { label: '⚙️ 技術系セット',     bg: 'bg-blue-500/20',   border: 'border-blue-500/40' },
  combo_drive_set:       { label: '🚀 推進系セット',     bg: 'bg-yellow-500/20', border: 'border-yellow-500/40' },
  combo_adjust_set:      { label: '📋 管理系セット',     bg: 'bg-green-500/20',  border: 'border-green-500/40' },
  combo_blitz_set:       { label: '⭐ 精鋭系セット',     bg: 'bg-red-500/20',    border: 'border-red-500/40' },
  combo_tanaka_chain:    { label: '🔗 人員連鎖',         bg: 'bg-purple-500/20', border: 'border-purple-500/40' },
  combo_takahashi_chain: { label: '🔗 人員連鎖',         bg: 'bg-teal-500/20',   border: 'border-teal-500/40' },
  combo_kimura_chain:    { label: '🔗 人員連鎖',         bg: 'bg-indigo-500/20', border: 'border-indigo-500/40' },
  combo_yamada_awakening: { label: '🔗 人員連鎖',        bg: 'bg-amber-500/20',  border: 'border-amber-500/40' },
}

interface Props {
  onClose: () => void
}

export function ComboBook({ onClose }: Props) {
  const { discoveredCombos, activeComboEffects } = useGameStore()
  const discovered = discoveredCombos.length
  const total = COMBO_RECIPES.length

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-40 flex flex-col bg-pm-bg/95 backdrop-blur-sm"
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div>
          <h2 className="text-white font-bold text-base">コンボ図鑑</h2>
          <p className="text-pm-muted text-xs">{discovered} / {total} 発見済み</p>
        </div>
        <button
          onClick={onClose}
          className="text-pm-muted hover:text-white text-lg w-8 h-8 flex items-center justify-center"
        >
          ✕
        </button>
      </div>

      {/* 進捗バー */}
      <div className="px-4 py-2 border-b border-white/5">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(discovered / total) * 100}%` }}
            className="h-full bg-gradient-to-r from-pm-cyan to-pm-green rounded-full"
          />
        </div>
      </div>

      {/* コンボ一覧 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {COMBO_RECIPES.map(recipe => {
          const isDiscovered = discoveredCombos.includes(recipe.id)
          const isActive = activeComboEffects.some(e => e.comboId === recipe.id)
          const badge = COLOR_BADGE[recipe.id]
          return (
            <ComboEntry
              key={recipe.id}
              recipe={recipe}
              isDiscovered={isDiscovered}
              isActive={isActive}
              badge={badge}
            />
          )
        })}
      </div>
    </motion.div>
  )
}

function ComboEntry({
  recipe,
  isDiscovered,
  isActive,
  badge,
}: {
  recipe: ComboRecipe
  isDiscovered: boolean
  isActive: boolean
  badge: { label: string; bg: string; border: string }
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-all',
        isDiscovered
          ? cn(badge.bg, badge.border, isActive ? 'ring-1 ring-white/30' : '')
          : 'bg-white/3 border-white/8',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {isDiscovered ? (
            <>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-white font-bold text-sm">{recipe.name}</span>
                {isActive && (
                  <span className="text-[9px] bg-pm-cyan/20 text-pm-cyan border border-pm-cyan/30 px-1.5 py-0.5 rounded-full">
                    発動中
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', badge.bg, badge.border, 'text-white/70')}>
                {badge.label}
              </span>
              <p className="text-pm-muted text-[11px] mt-1.5 leading-relaxed">{recipe.description}</p>
              <p className="text-white/50 text-[10px] italic mt-1">{recipe.flavorText}</p>
            </>
          ) : (
            <>
              <p className="text-white/30 font-bold text-sm">???</p>
              <p className="text-white/20 text-[11px] mt-1">
                {recipe.type === 'colorSet' ? 'スキル系セットコンボ' : '人員連鎖コンボ'}
              </p>
              <p className="text-white/15 text-[10px] mt-0.5">条件を満たすと発動</p>
            </>
          )}
        </div>
        <div className="flex-shrink-0 text-xl mt-0.5">
          {isDiscovered ? '✅' : '🔒'}
        </div>
      </div>
    </div>
  )
}
