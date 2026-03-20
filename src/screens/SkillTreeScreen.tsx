import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { SKILL_TREE } from '../constants/skills'
import { cn } from '../utils/cn'
import type { SkillDef } from '../types/skill'

const CATEGORY_CONFIG = {
  management: { label: '管理', color: 'text-pm-cyan', border: 'border-pm-cyan/40', bg: 'bg-pm-cyan/10', icon: '📋' },
  tech: { label: '技術', color: 'text-pm-green', border: 'border-pm-green/40', bg: 'bg-pm-green/10', icon: '⚙️' },
  leadership: { label: 'リーダーシップ', color: 'text-pm-yellow', border: 'border-pm-yellow/40', bg: 'bg-pm-yellow/10', icon: '👥' },
  risk: { label: 'リスク', color: 'text-pm-red', border: 'border-pm-red/40', bg: 'bg-pm-red/10', icon: '🛡️' },
}

const TIER_LABELS = { 1: '基礎', 2: '中級', 3: '上級' }

function EffectList({ skill }: { skill: SkillDef }) {
  const e = skill.effect
  const items: string[] = []
  if (e.handSizeBonus) items.push(`手札上限+${e.handSizeBonus}`)
  if (e.bugRateMultiplier) items.push(`バグ率×${e.bugRateMultiplier}`)
  if (e.productivityBonus) items.push(`生産性+${e.productivityBonus}pt`)
  if (e.conditionRecoveryBonus) items.push(`コンディション回復+${e.conditionRecoveryBonus}`)
  if (e.continuityBonusMultiplier) items.push(`継続ボーナス×${e.continuityBonusMultiplier}`)
  if (e.startQualityBonus) items.push(`開始品質+${e.startQualityBonus}`)
  if (e.eventProbReduction) items.push(`イベント確率-${Math.round(e.eventProbReduction * 100)}%`)
  if (e.budgetBufferBonus) items.push(`予算バッファ+${Math.round(e.budgetBufferBonus * 100)}%`)
  if (e.qualityMinReduction) items.push(`ゲームオーバーライン-${e.qualityMinReduction}`)
  if (e.personnelCostMultiplier) items.push(`人員コスト×${e.personnelCostMultiplier}`)
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {items.map(item => (
        <span key={item} className="px-1.5 py-0.5 bg-white/10 text-pm-text text-xs rounded">
          {item}
        </span>
      ))}
    </div>
  )
}

function SkillCard({ skill, unlocked, canUnlock, onUnlock }: {
  skill: SkillDef
  unlocked: boolean
  canUnlock: boolean
  onUnlock: () => void
}) {
  const cfg = CATEGORY_CONFIG[skill.category]
  const [pressed, setPressed] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border p-4 transition-all',
        unlocked
          ? `${cfg.border} ${cfg.bg}`
          : canUnlock
          ? 'border-white/20 bg-white/5 hover:bg-white/8'
          : 'border-white/8 bg-white/2 opacity-60',
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>{cfg.icon}</span>
          <div>
            <p className={cn('text-sm font-bold', unlocked ? cfg.color : 'text-white')}>
              {skill.name}
            </p>
            <p className="text-pm-muted text-xs">{cfg.label} · Tier {skill.tier}</p>
          </div>
        </div>
        {unlocked ? (
          <span className={cn('text-lg', cfg.color)}>✓</span>
        ) : (
          <span className="text-pm-yellow text-sm font-bold">{skill.cost}pt</span>
        )}
      </div>

      <p className="text-pm-muted text-xs mb-1">{skill.description}</p>
      <EffectList skill={skill} />

      {skill.requires.length > 0 && (
        <p className="text-pm-muted text-xs mt-2 opacity-60">
          必要: {skill.requires.map(r => SKILL_TREE.find(s => s.id === r)?.name).join(', ')}
        </p>
      )}

      {!unlocked && canUnlock && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setPressed(true)
            onUnlock()
            setTimeout(() => setPressed(false), 300)
          }}
          className={cn(
            'mt-3 w-full py-2 rounded-lg text-xs font-bold transition-all',
            pressed
              ? `${cfg.bg} ${cfg.color} border ${cfg.border}`
              : 'bg-pm-yellow/20 text-pm-yellow border border-pm-yellow/40 hover:bg-pm-yellow/30',
          )}
        >
          習得する ({skill.cost}pt)
        </motion.button>
      )}
    </motion.div>
  )
}

export function SkillTreeScreen({ onClose }: { onClose: () => void }) {
  const { pmPoints, unlockedSkills, unlockSkill } = useGameStore()
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3 | null>(null)

  const filteredSkills = selectedTier
    ? SKILL_TREE.filter(s => s.tier === selectedTier)
    : SKILL_TREE

  return (
    <div className="h-full flex flex-col bg-pm-bg overflow-hidden">
      {/* ヘッダー */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-shrink-0 pt-10 pb-4 px-5 border-b border-white/8"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-pm-cyan" style={{ fontFamily: 'monospace' }}>
              SKILL TREE
            </h2>
            <p className="text-pm-muted text-xs">スキルを習得してプロジェクトを有利に進めよう</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-pm-muted hover:text-white hover:bg-white/10 transition-all text-lg"
          >
            ✕
          </button>
        </div>

        {/* PMポイント */}
        <div className="p-3 bg-pm-surface rounded-xl border border-pm-yellow/30 flex items-center gap-3">
          <span className="text-2xl">⭐</span>
          <div>
            <p className="text-pm-muted text-xs">保有 PM ポイント</p>
            <p className="text-pm-yellow text-2xl font-bold font-mono">{pmPoints} <span className="text-sm text-pm-muted font-normal">pt</span></p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-pm-muted text-xs">習得済</p>
            <p className="text-white text-lg font-bold">{unlockedSkills.length}/{SKILL_TREE.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Tierフィルター */}
      <div className="flex-shrink-0 flex gap-2 px-4 py-3 border-b border-white/5">
        <button
          onClick={() => setSelectedTier(null)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
            selectedTier === null
              ? 'bg-pm-cyan/20 text-pm-cyan border-pm-cyan/40'
              : 'bg-white/3 text-pm-muted border-white/10 hover:bg-white/8',
          )}
        >
          全て
        </button>
        {([1, 2, 3] as const).map(tier => (
          <button
            key={tier}
            onClick={() => setSelectedTier(tier)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
              selectedTier === tier
                ? 'bg-pm-cyan/20 text-pm-cyan border-pm-cyan/40'
                : 'bg-white/3 text-pm-muted border-white/10 hover:bg-white/8',
            )}
          >
            {TIER_LABELS[tier]}
          </button>
        ))}
      </div>

      {/* スキル一覧 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Tierごとにグループ表示 */}
        {([1, 2, 3] as const).map(tier => {
          const tierSkills = filteredSkills.filter(s => s.tier === tier)
          if (tierSkills.length === 0) return null
          return (
            <div key={tier}>
              <div className="flex items-center gap-2 mb-2 mt-2">
                <div className="flex-1 h-px bg-white/10" />
                <p className="text-pm-muted text-xs font-bold tracking-widest">── Tier {tier}: {TIER_LABELS[tier]} ──</p>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="space-y-2.5">
                {tierSkills.map((skill, i) => {
                  const unlocked = unlockedSkills.includes(skill.id)
                  const reqsMet = skill.requires.every(r => unlockedSkills.includes(r))
                  const canAfford = pmPoints >= skill.cost
                  const canUnlock = !unlocked && reqsMet && canAfford
                  return (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <SkillCard
                        skill={skill}
                        unlocked={unlocked}
                        canUnlock={canUnlock}
                        onUnlock={() => unlockSkill(skill.id)}
                      />
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div className="h-4" />
      </div>
    </div>
  )
}
