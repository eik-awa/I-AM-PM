import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import type { PersonnelCard } from '../../types/card'
import { COMBO_RECIPES } from '../../constants/combos'
import { cn } from '../../utils/cn'

const PERSONNEL_TYPE_COLOR: Record<string, string> = {
  engineer: 'border-pm-cyan/40',
  newcomer: 'border-pm-yellow/30',
  specialist: 'border-orange-400/40',
  lead: 'border-blue-400/60',
}
const PERSONNEL_TYPE_BG: Record<string, string> = {
  engineer: 'bg-pm-cyan/10',
  newcomer: 'bg-pm-yellow/5',
  specialist: 'bg-orange-500/10',
  lead: 'bg-blue-500/15',
}

const SKILL_LABEL: Record<string, string> = {
  frontend: 'FE', backend: 'BE', infra: 'Infra', qa: 'QA', design: 'Design', general: '汎用',
}
const SKILL_COLOR: Record<string, string> = {
  frontend: 'bg-blue-500/30 text-blue-300',
  backend: 'bg-purple-500/30 text-purple-300',
  infra: 'bg-orange-500/30 text-orange-300',
  qa: 'bg-green-500/30 text-green-300',
  design: 'bg-pink-500/30 text-pink-300',
  general: 'bg-gray-500/30 text-gray-300',
}

// スキル系カテゴリバッジ（色ではなくスキル感で表現）
const SKILL_CATEGORY_BADGE: Record<string, { icon: string; label: string; cls: string }> = {
  tech:   { icon: '⚙️', label: '技術系',   cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  drive:  { icon: '🚀', label: '推進系',   cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  adjust: { icon: '📋', label: '管理系',   cls: 'bg-green-500/20 text-green-300 border-green-500/30' },
  blitz:  { icon: '⭐', label: '精鋭系',   cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
}

export function HandPanel() {
  const { hand, activePersonnel, deck, activeComboEffects, discoveredCombos } = useGameStore()
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [selectedActiveId, setSelectedActiveId] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  // 手札 or 稼働中から選択中のカードを取得
  const selectedHandCard = hand.find(c => c.id === selectedCard) as PersonnelCard | undefined
  const selectedActiveCard = activePersonnel.find(p => p.id === selectedActiveId)

  const detailCard = selectedHandCard ?? selectedActiveCard
  const isActiveCard = !!selectedActiveCard && !selectedHandCard

  // 現在発動中のコンボ
  const activeComboRecipes = activeComboEffects
    .map(e => COMBO_RECIPES.find(r => r.id === e.comboId))
    .filter(Boolean)

  const idlePersonnel = activePersonnel.filter(p => !p.assignedTaskId)
  const workingPersonnel = activePersonnel.filter(p => p.assignedTaskId)

  return (
    <div className="flex-shrink-0 bg-pm-surface/90 border-t border-white/10">
      {/* ヘッダー */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/5"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-pm-muted text-xs tracking-wider">人員</span>
          <span className="text-pm-cyan text-xs bg-pm-cyan/20 px-1.5 py-0.5 rounded-full">
            手札 {hand.length}
          </span>
          <span className="text-pm-muted text-xs bg-white/5 px-1.5 py-0.5 rounded-full">
            山札 {deck.length}
          </span>
          {workingPersonnel.length > 0 && (
            <span className="text-pm-green text-xs bg-pm-green/20 px-1.5 py-0.5 rounded-full">
              稼働 {workingPersonnel.length}名
            </span>
          )}
          {idlePersonnel.length > 0 && (
            <span className="text-pm-yellow text-xs bg-pm-yellow/20 px-1.5 py-0.5 rounded-full animate-pulse">
              待機 {idlePersonnel.length}名
            </span>
          )}
        </div>
        <span className={cn('text-pm-muted text-xs transition-transform', isExpanded ? '' : 'rotate-180')}>▲</span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {/* 発動中コンボ（解放済みのみ表示） */}
            {activeComboRecipes.length > 0 && (
              <div className="px-3 pt-2 pb-1 border-b border-white/5">
                <p className="text-pm-muted text-[9px] mb-1">── 発動中コンボ ──</p>
                <div className="flex gap-1.5 flex-wrap">
                  {activeComboRecipes.map(r => r && (
                    <span
                      key={r.id}
                      className="text-[10px] bg-pm-cyan/10 border border-pm-cyan/25 text-pm-cyan px-2 py-0.5 rounded-full"
                      title={r.description}
                    >
                      ⚡ {r.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* カード詳細表示 */}
            <AnimatePresence>
              {detailCard && (
                <PersonnelDetail
                  card={detailCard}
                  isActive={isActiveCard}
                  onClose={() => { setSelectedCard(null); setSelectedActiveId(null) }}
                />
              )}
            </AnimatePresence>

            {/* 稼働中の人員（作業中 + 待機中） */}
            {activePersonnel.length > 0 && (
              <div className="px-3 py-2 border-b border-white/5">
                <p className="text-pm-muted text-[9px] mb-1.5">── 稼働中（タップで詳細 / ドラッグで再アサイン） ──</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {activePersonnel.map(p => (
                    <ActivePersonnelChip
                      key={p.id}
                      personnel={p}
                      isSelected={selectedActiveId === p.id}
                      onClick={() => {
                        setSelectedCard(null)
                        setSelectedActiveId(selectedActiveId === p.id ? null : p.id)
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 手札 */}
            <div className="flex gap-2.5 overflow-x-auto px-3 py-3">
              {hand.length === 0 && activePersonnel.length === 0 && (
                <p className="text-pm-muted text-sm py-2 w-full text-center">手札なし</p>
              )}
              {hand.length === 0 && activePersonnel.length > 0 && (
                <p className="text-pm-muted text-xs py-1 px-1 italic">（手札なし — 次ターンにドロー）</p>
              )}
              {hand.map(card => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => {
                    setSelectedActiveId(null)
                    setSelectedCard(card.id === selectedCard ? null : card.id)
                  }}
                  className={cn(
                    'flex-shrink-0 cursor-pointer',
                    selectedCard === card.id ? 'scale-105' : '',
                  )}
                >
                  <PersonnelMiniCard card={card as PersonnelCard} isSelected={selectedCard === card.id} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PersonnelMiniCard({ card, isSelected }: { card: PersonnelCard; isSelected: boolean }) {
  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('personnelId', card.id)
  }

  const catBadge = card.color ? SKILL_CATEGORY_BADGE[card.color] : null

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        'w-24 p-2 rounded-lg border transition-all card-shadow cursor-grab active:cursor-grabbing select-none',
        PERSONNEL_TYPE_BG[card.personnelType],
        PERSONNEL_TYPE_COLOR[card.personnelType],
        isSelected ? 'ring-1 ring-pm-cyan' : '',
      )}
    >
      {/* スキルタグ + カテゴリ */}
      <div className="flex items-center gap-1 mb-1 flex-wrap">
        {card.skills.map(s => (
          <span key={s} className={cn('text-[9px] px-1 py-0 rounded font-bold', SKILL_COLOR[s])}>
            {SKILL_LABEL[s]}
          </span>
        ))}
      </div>
      <p className="text-white text-[11px] font-bold leading-tight truncate">{card.name}</p>
      <p className="text-pm-muted text-[9px] truncate">{card.title}</p>
      <div className="flex items-center justify-between mt-1.5 gap-1">
        <span className="text-pm-cyan text-[10px]">⚡約{card.productivity}</span>
        {catBadge && (
          <span className={cn('text-[8px] px-1 py-0 rounded border leading-4', catBadge.cls)}>
            {catBadge.icon}
          </span>
        )}
      </div>
      {card.analysisCount >= 5 && (
        <span className="text-[8px] text-pm-green">解析済み ✓</span>
      )}
    </div>
  )
}

function ActivePersonnelChip({
  personnel,
  isSelected,
  onClick,
}: {
  personnel: PersonnelCard
  isSelected: boolean
  onClick: () => void
}) {
  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('personnelId', personnel.id)
  }

  const isIdle = !personnel.assignedTaskId
  const catBadge = personnel.color ? SKILL_CATEGORY_BADGE[personnel.color] : null

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={cn(
        'flex-shrink-0 flex flex-col gap-0.5 px-2 py-1.5 rounded-lg border cursor-pointer select-none transition-all',
        PERSONNEL_TYPE_BG[personnel.personnelType],
        PERSONNEL_TYPE_COLOR[personnel.personnelType],
        isSelected ? 'ring-1 ring-pm-cyan' : 'hover:ring-1 hover:ring-white/20',
        isIdle ? 'ring-1 ring-pm-yellow/50' : '',
      )}
    >
      <div className="flex items-center gap-1">
        <p className="text-white text-[10px] font-bold whitespace-nowrap">{personnel.name}</p>
        {catBadge && (
          <span className={cn('text-[8px] px-0.5 rounded border leading-4', catBadge.cls)}>
            {catBadge.icon}
          </span>
        )}
      </div>
      {/* スキル行 */}
      <div className="flex gap-0.5 flex-wrap">
        {personnel.skills.map(s => (
          <span key={s} className={cn('text-[8px] px-1 rounded font-medium', SKILL_COLOR[s])}>
            {SKILL_LABEL[s]}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="text-pm-cyan text-[9px]">⚡{personnel.productivity}</span>
        <span className={cn('text-[9px] font-medium', isIdle ? 'text-pm-yellow' : 'text-pm-muted')}>
          {isIdle ? '待機中' : `${personnel.turnsOnTask}T`}
        </span>
      </div>
    </div>
  )
}

function SkillBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-pm-muted text-[9px] w-6 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-white text-[9px] w-6 text-right flex-shrink-0">{value}</span>
    </div>
  )
}

function PersonnelDetail({
  card,
  isActive,
  onClose,
}: {
  card: PersonnelCard
  isActive: boolean
  onClose: () => void
}) {
  const catBadge = card.color ? SKILL_CATEGORY_BADGE[card.color] : null

  return (
    <motion.div
      key={card.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mx-3 mb-2 p-3 bg-pm-card rounded-xl border border-white/15"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-white font-bold">{card.name}</p>
            {isActive && (
              <span className="text-[9px] bg-pm-green/20 text-pm-green border border-pm-green/30 px-1.5 py-0.5 rounded-full">
                稼働中
              </span>
            )}
          </div>
          <p className="text-pm-muted text-xs">{card.title}</p>
        </div>
        <button onClick={onClose} className="text-pm-muted text-sm hover:text-white">✕</button>
      </div>

      {/* スキルカテゴリ + スキルタグ */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {catBadge && (
          <span className={cn('text-[10px] px-2 py-0.5 rounded border font-bold', catBadge.cls)}>
            {catBadge.icon} {catBadge.label}
          </span>
        )}
        {card.skills.map(s => (
          <span key={s} className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', SKILL_COLOR[s])}>
            {SKILL_LABEL[s]}
          </span>
        ))}
      </div>

      {/* ステータス3列 */}
      <div className="grid grid-cols-3 gap-2 text-center mb-2">
        <div className="bg-black/30 rounded p-1">
          <p className="text-pm-muted text-[9px]">出力</p>
          <p className="text-pm-cyan font-bold text-xs">
            {card.analysisCount >= 2
              ? `${card.actualOutputRange[0]}〜${card.actualOutputRange[1]}`
              : `約${card.productivity}`}
          </p>
          {card.analysisCount < 2 && (
            <p className="text-pm-muted text-[8px]">pt</p>
          )}
        </div>
        <div className="bg-black/30 rounded p-1">
          <p className="text-pm-muted text-[9px]">コスト</p>
          <p className="text-pm-yellow font-bold text-xs">¥{card.costPerTurn}万</p>
        </div>
        <div className="bg-black/30 rounded p-1">
          <p className="text-pm-muted text-[9px]">ミス率</p>
          <p className="text-pm-red font-bold text-xs">{Math.round(card.bugRate * 100)}%</p>
        </div>
      </div>

      {/* 3スキルステータスバー */}
      <div className="bg-black/20 rounded p-2 mb-2 space-y-1.5">
        <p className="text-pm-muted text-[9px] mb-1">── スキルステータス ──</p>
        <SkillBar label="技術" value={card.engineeringSkill} color="bg-blue-400" />
        <SkillBar label="管理" value={card.managementSkill} color="bg-green-400" />
        <SkillBar label="伝達" value={card.communicationSkill} color="bg-yellow-400" />
      </div>

      {/* 稼働中の場合は継続ターン情報も表示 */}
      {isActive && (
        <div className="bg-black/20 rounded p-2 mb-2 flex items-center justify-between">
          <span className="text-pm-muted text-[10px]">同タスク継続</span>
          <span className="text-pm-cyan text-xs font-bold">{card.turnsOnTask}ターン</span>
          {card.turnsOnTask >= 1 && (
            <span className="text-pm-green text-[9px]">+継続ボーナス</span>
          )}
        </div>
      )}

      {/* 解析進捗 */}
      <div className="mb-2">
        <div className="flex justify-between text-[9px] mb-0.5">
          <span className="text-pm-muted">解析度</span>
          <span className="text-pm-cyan">
            {card.analysisCount}/5
            {card.analysisCount >= 5 ? ' ✓解析済み' : card.analysisCount >= 2 ? ' (出力範囲開示)' : ''}
          </span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-pm-cyan/60 rounded-full transition-all"
            style={{ width: `${Math.min(100, card.analysisCount * 20)}%` }}
          />
        </div>
      </div>

      <p className="text-pm-muted text-[11px] italic mb-1">{card.flavor}</p>

      {!isActive && (
        <p className="text-pm-cyan text-[10px] mt-1">↑ WBSのタスクへドラッグしてアサイン</p>
      )}
      {isActive && !card.assignedTaskId && (
        <p className="text-pm-yellow text-[10px] mt-1">タスクが完了 — 次のタスクへドラッグ</p>
      )}
    </motion.div>
  )
}
