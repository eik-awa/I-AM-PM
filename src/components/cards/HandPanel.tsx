import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import type { PersonnelCard, EventCard } from '../../types/card'
import { cn } from '../../utils/cn'

const PERSONNEL_TYPE_COLOR: Record<string, string> = {
  engineer: 'border-pm-cyan/40',
  newcomer: 'border-pm-yellow/30',
  freelance: 'border-pm-orange/40',
  lead: 'border-pm-blue/60',
}
const PERSONNEL_TYPE_BG: Record<string, string> = {
  engineer: 'bg-pm-cyan/10',
  newcomer: 'bg-pm-yellow/5',
  freelance: 'bg-pm-orange/10',
  lead: 'bg-pm-blue/15',
}
const SEVERITY_COLOR: Record<string, string> = {
  positive: 'border-pm-green/40 bg-pm-green/10',
  neutral: 'border-white/20 bg-white/5',
  negative: 'border-pm-red/30 bg-pm-red/5',
  critical: 'border-pm-red/60 bg-pm-red/10',
}
const SKILL_ICON: Record<string, string> = {
  frontend: 'F', backend: 'B', infra: 'I', qa: 'Q', design: 'D', general: 'G',
}
const SKILL_COLOR: Record<string, string> = {
  frontend: 'bg-blue-500/30 text-blue-300',
  backend: 'bg-purple-500/30 text-purple-300',
  infra: 'bg-orange-500/30 text-orange-300',
  qa: 'bg-green-500/30 text-green-300',
  design: 'bg-pink-500/30 text-pink-300',
  general: 'bg-gray-500/30 text-gray-300',
}

export function HandPanel() {
  const { hand, activePersonnel } = useGameStore()
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  const selectedCardData = hand.find(c => c.id === selectedCard)

  return (
    <div className="flex-shrink-0 bg-pm-surface/90 border-t border-white/10">
      {/* ヘッダー */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          <span className="text-pm-muted text-xs tracking-wider">手札</span>
          <span className="text-pm-cyan text-xs bg-pm-cyan/20 px-1.5 py-0.5 rounded-full">
            {hand.length}
          </span>
          {activePersonnel.length > 0 && (
            <>
              <span className="text-pm-muted text-xs">/ アクティブ</span>
              <span className="text-pm-green text-xs bg-pm-green/20 px-1.5 py-0.5 rounded-full">
                {activePersonnel.length}名
              </span>
            </>
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
            {/* カード詳細表示 */}
            {selectedCardData && (
              <CardDetail
                card={selectedCardData}
                onClose={() => setSelectedCard(null)}
              />
            )}

            {/* アクティブ人員一覧 */}
            {activePersonnel.length > 0 && (
              <div className="px-3 py-2 border-b border-white/5">
                <p className="text-pm-muted text-[10px] mb-1.5">── 稼働中の人員（ドラッグで再アサイン） ──</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {activePersonnel.map(p => (
                    <ActivePersonnelChip key={p.id} personnel={p} />
                  ))}
                </div>
              </div>
            )}

            {/* 手札 */}
            <div className="flex gap-2.5 overflow-x-auto px-3 py-3">
              {hand.length === 0 && (
                <p className="text-pm-muted text-sm py-2 w-full text-center">手札なし</p>
              )}
              {hand.map(card => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSelectedCard(card.id === selectedCard ? null : card.id)}
                  className={cn(
                    'flex-shrink-0 cursor-pointer',
                    selectedCard === card.id ? 'scale-105' : ''
                  )}
                >
                  {card.type === 'personnel' && (
                    <PersonnelMiniCard card={card} isSelected={selectedCard === card.id} />
                  )}
                  {card.type === 'event' && (
                    <EventMiniCard card={card} isSelected={selectedCard === card.id} />
                  )}
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
      <div className="flex items-center gap-1 mb-1">
        {card.skills.map(s => (
          <span key={s} className={cn('text-[9px] w-4 h-4 rounded flex items-center justify-center font-bold', SKILL_COLOR[s])}>
            {SKILL_ICON[s]}
          </span>
        ))}
      </div>
      <p className="text-white text-[11px] font-bold leading-tight truncate">{card.name}</p>
      <p className="text-pm-muted text-[9px] truncate">{card.title}</p>
      <div className="flex justify-between mt-1.5">
        <span className="text-pm-cyan text-[10px]">⚡{card.productivity}</span>
        <span className="text-pm-yellow text-[10px]">¥{card.costPerTurn}</span>
      </div>
    </div>
  )
}

function EventMiniCard({ card, isSelected }: { card: EventCard; isSelected: boolean }) {
  return (
    <div className={cn(
      'w-24 p-2 rounded-lg border transition-all card-shadow select-none',
      SEVERITY_COLOR[card.severity],
      isSelected ? 'ring-1 ring-pm-yellow' : '',
    )}>
      <p className="text-[10px] text-pm-muted mb-0.5">イベント</p>
      <p className="text-white text-[11px] font-bold leading-tight">{card.name}</p>
      <p className="text-pm-muted text-[9px] mt-1 line-clamp-2">{card.description.slice(0, 30)}...</p>
    </div>
  )
}

function ActivePersonnelChip({ personnel }: { personnel: PersonnelCard }) {
  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('personnelId', personnel.id)
  }

  const hasFire = false // 将来的に状態異常
  const taskLabel = personnel.assignedTaskId ? '作業中' : '待機'

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        'flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg border cursor-grab active:cursor-grabbing select-none',
        PERSONNEL_TYPE_BG[personnel.personnelType],
        PERSONNEL_TYPE_COLOR[personnel.personnelType],
      )}
    >
      <div>
        <p className="text-white text-[10px] font-bold whitespace-nowrap">{personnel.name}</p>
        <p className="text-pm-muted text-[9px]">{taskLabel}</p>
      </div>
      <span className="text-pm-cyan text-[10px]">⚡{personnel.productivity}</span>
    </div>
  )
}

function CardDetail({ card, onClose }: { card: PersonnelCard | EventCard; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mx-3 mb-2 p-3 bg-pm-card rounded-xl border border-white/15"
    >
      {card.type === 'personnel' && (
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-white font-bold">{card.name}</p>
              <p className="text-pm-muted text-xs">{card.title}</p>
            </div>
            <button onClick={onClose} className="text-pm-muted text-sm hover:text-white">✕</button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
            <div className="bg-black/30 rounded p-1">
              <p className="text-pm-muted text-[9px]">出力</p>
              <p className="text-pm-cyan font-bold">{card.productivity}pt</p>
            </div>
            <div className="bg-black/30 rounded p-1">
              <p className="text-pm-muted text-[9px]">コスト</p>
              <p className="text-pm-yellow font-bold">¥{card.costPerTurn}万</p>
            </div>
            <div className="bg-black/30 rounded p-1">
              <p className="text-pm-muted text-[9px]">ミス率</p>
              <p className="text-pm-red font-bold">{Math.round(card.bugRate * 100)}%</p>
            </div>
          </div>
          <div className="flex gap-1 flex-wrap mb-2">
            {card.skills.map(s => (
              <span key={s} className={cn('text-[10px] px-1.5 py-0.5 rounded', SKILL_COLOR[s])}>
                {s}
              </span>
            ))}
          </div>
          <p className="text-pm-muted text-xs italic">{card.flavor}</p>
          <p className="text-pm-cyan text-[10px] mt-1">↑ WBSのタスクへドラッグしてアサイン</p>
        </div>
      )}
      {card.type === 'event' && (
        <div>
          <div className="flex justify-between items-start mb-2">
            <p className="text-white font-bold">{card.name}</p>
            <button onClick={onClose} className="text-pm-muted text-sm hover:text-white">✕</button>
          </div>
          <p className="text-pm-text text-xs mb-2">{card.description}</p>
          <p className="text-pm-muted text-xs italic">{card.flavor}</p>
          <p className="text-pm-yellow text-[10px] mt-1">※ このカードはターン終了時に自動発動する場合があります</p>
        </div>
      )}
    </motion.div>
  )
}
