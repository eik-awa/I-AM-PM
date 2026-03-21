import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { COMBO_RECIPES } from '../../constants/combos'
import { cn } from '../../utils/cn'

// セットコンボの構成メンバー説明
const SET_MEMBERS: Record<string, string[]> = {
  combo_tech_set:   ['田中（BE）', '松本（Infra）', '大野（BE/Infra）', '西村（Infra/QA）'],
  combo_drive_set:  ['佐藤（FE）', '高橋（QA）', '伊藤（Design）', '中村（FE/BE）', '橋本（Design）', '渡辺（FE）'],
  combo_adjust_set: ['山田（汎用）', '鈴木（汎用）', '木村（リーダー）', '小林（汎用）'],
  combo_blitz_set:  ['藤原スペシャリスト', '伝説の坂本'],
}

const SET_CONDITION_TEXT: Record<string, string> = {
  combo_tech_set:   '⚙️技術系 3名以上を同時アサイン',
  combo_drive_set:  '🚀推進系 3名以上を同時アサイン',
  combo_adjust_set: '📋管理系 3名以上を同時アサイン',
  combo_blitz_set:  '⭐精鋭系 2名以上を同時アサイン',
}

const CHAIN_CONDITION_TEXT: Record<string, string> = {
  combo_tanaka_chain:    '田中がBEタスクを連続担当（前ターンも稼働中）',
  combo_takahashi_chain: '高橋がバグありQAタスクを担当',
  combo_kimura_chain:    '木村が同一タスクを2ターン以上継続',
  combo_yamada_awakening: '山田が同一タスクを4ターン以上継続',
}

const EFFECT_SUMMARY: Record<string, string> = {
  combo_tech_set:        'バグ率 -50%',
  combo_drive_set:       '全出力 +30%',
  combo_adjust_set:      'イベント発生率 -40%',
  combo_blitz_set:       '出力 ×1.8（3ターン）→ 4T目炎上',
  combo_tanaka_chain:    'バグ率激減 / 出力 +30%',
  combo_takahashi_chain: 'バグ発見強化 / 修正速度 ×1.5',
  combo_kimura_chain:    '次ターンのイベントを事前開示',
  combo_yamada_awakening: '山田の出力がエンジニア相当に昇格',
}

const BADGE: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  combo_tech_set:        { bg: 'bg-blue-500/15',   border: 'border-blue-500/40',   text: 'text-blue-300',   icon: '⚙️' },
  combo_drive_set:       { bg: 'bg-yellow-500/15', border: 'border-yellow-500/40', text: 'text-yellow-300', icon: '🚀' },
  combo_adjust_set:      { bg: 'bg-green-500/15',  border: 'border-green-500/40',  text: 'text-green-300',  icon: '📋' },
  combo_blitz_set:       { bg: 'bg-red-500/15',    border: 'border-red-500/40',    text: 'text-red-300',    icon: '⭐' },
  combo_tanaka_chain:    { bg: 'bg-purple-500/15', border: 'border-purple-500/40', text: 'text-purple-300', icon: '🔗' },
  combo_takahashi_chain: { bg: 'bg-teal-500/15',   border: 'border-teal-500/40',   text: 'text-teal-300',   icon: '🔗' },
  combo_kimura_chain:    { bg: 'bg-indigo-500/15', border: 'border-indigo-500/40', text: 'text-indigo-300', icon: '🔗' },
  combo_yamada_awakening: { bg: 'bg-amber-500/15',  border: 'border-amber-500/40',  text: 'text-amber-300',  icon: '🔗' },
}

export function SynergyPanel() {
  const { discoveredCombos, activeComboEffects } = useGameStore()

  const setCombos = COMBO_RECIPES.filter(r => r.type === 'colorSet')
  const chainCombos = COMBO_RECIPES.filter(r => r.type === 'personnelChain')
  const discovered = discoveredCombos.length
  const total = COMBO_RECIPES.length

  return (
    <div className="h-full overflow-y-auto">
      {/* ヘッダー */}
      <div className="sticky top-0 bg-pm-bg/95 backdrop-blur-sm px-4 py-3 border-b border-white/8 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-sm">シナジー一覧</h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-pm-muted">発見済み</span>
            <span className="text-pm-cyan font-bold">{discovered}</span>
            <span className="text-pm-muted">/ {total}</span>
          </div>
        </div>
        {/* 進捗バー */}
        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(discovered / total) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-pm-cyan to-pm-green rounded-full"
          />
        </div>
      </div>

      <div className="px-3 py-3 space-y-5 pb-6">
        {/* ── スキル系セットコンボ ────────────────────────── */}
        <section>
          <p className="text-pm-muted text-[10px] tracking-widest uppercase mb-2 px-1">
            スキル系セットコンボ — 同じ系統のメンバーを揃える
          </p>
          <div className="space-y-2">
            {setCombos.map(recipe => {
              const isDiscovered = discoveredCombos.includes(recipe.id)
              const isActive = activeComboEffects.some(e => e.comboId === recipe.id)
              const b = BADGE[recipe.id]
              return (
                <ComboCard
                  key={recipe.id}
                  recipe={recipe}
                  isDiscovered={isDiscovered}
                  isActive={isActive}
                  badge={b}
                  conditionText={SET_CONDITION_TEXT[recipe.id]}
                  effectText={EFFECT_SUMMARY[recipe.id]}
                  members={SET_MEMBERS[recipe.id]}
                  showMembers={true}
                />
              )
            })}
          </div>
        </section>

        {/* ── 人員連鎖コンボ ──────────────────────────────── */}
        <section>
          <p className="text-pm-muted text-[10px] tracking-widest uppercase mb-2 px-1">
            人員連鎖コンボ — 特定の人が特定の状況で輝く
          </p>
          <div className="space-y-2">
            {chainCombos.map(recipe => {
              const isDiscovered = discoveredCombos.includes(recipe.id)
              const isActive = activeComboEffects.some(e => e.comboId === recipe.id)
              const b = BADGE[recipe.id]
              return (
                <ComboCard
                  key={recipe.id}
                  recipe={recipe}
                  isDiscovered={isDiscovered}
                  isActive={isActive}
                  badge={b}
                  conditionText={CHAIN_CONDITION_TEXT[recipe.id]}
                  effectText={EFFECT_SUMMARY[recipe.id]}
                  showMembers={false}
                />
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

function ComboCard({
  recipe,
  isDiscovered,
  isActive,
  badge,
  conditionText,
  effectText,
  members,
  showMembers,
}: {
  recipe: (typeof COMBO_RECIPES)[number]
  isDiscovered: boolean
  isActive: boolean
  badge: { bg: string; border: string; text: string; icon: string }
  conditionText: string
  effectText: string
  members?: string[]
  showMembers: boolean
}) {
  if (!isDiscovered) {
    // 未発見: ヒントのみ表示
    return (
      <div className="rounded-xl border border-white/8 bg-white/3 p-3">
        <div className="flex items-center gap-2">
          <span className="text-white/20 text-lg">🔒</span>
          <div>
            <p className="text-white/25 font-bold text-sm">???</p>
            <p className="text-white/15 text-[10px] mt-0.5">{conditionText}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border p-3 transition-all',
        badge.bg, badge.border,
        isActive ? 'ring-1 ring-white/25 shadow-sm' : '',
      )}
    >
      {/* タイトル行 */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg leading-none">{badge.icon}</span>
          <span className={cn('font-bold text-sm', badge.text)}>{recipe.name}</span>
          {isActive && (
            <span className="text-[9px] bg-pm-cyan/20 text-pm-cyan border border-pm-cyan/30 px-1.5 py-0.5 rounded-full font-bold">
              ⚡ 発動中
            </span>
          )}
        </div>
        <span className="text-green-400 text-sm flex-shrink-0">✅</span>
      </div>

      {/* 発動条件 */}
      <div className="bg-black/20 rounded-lg px-2.5 py-1.5 mb-2">
        <p className="text-pm-muted text-[9px] mb-0.5">発動条件</p>
        <p className="text-white/70 text-[11px]">{conditionText}</p>
      </div>

      {/* 効果 */}
      <div className="bg-black/20 rounded-lg px-2.5 py-1.5 mb-2">
        <p className="text-pm-muted text-[9px] mb-0.5">効果</p>
        <p className={cn('text-[11px] font-medium', badge.text)}>{effectText}</p>
      </div>

      {/* セットコンボ: 該当メンバー一覧 */}
      {showMembers && members && (
        <div className="mb-2">
          <p className="text-pm-muted text-[9px] mb-1">該当メンバー</p>
          <div className="flex flex-wrap gap-1">
            {members.map(m => (
              <span key={m} className="text-[9px] bg-white/8 text-white/50 px-1.5 py-0.5 rounded border border-white/10">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* フレーバーテキスト */}
      <p className="text-white/35 text-[10px] italic">{recipe.flavorText}</p>
    </motion.div>
  )
}
