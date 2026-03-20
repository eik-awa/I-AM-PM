import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { StatusBar } from '../components/layout/StatusBar'
import { WBSBoard } from '../components/wbs/WBSBoard'
import { ProgressTree } from '../components/wbs/ProgressTree'
import { HandPanel } from '../components/cards/HandPanel'
import { TurnPanel } from '../components/turn/TurnPanel'
import { EventModal } from '../components/turn/EventModal'
import { QCDPanel } from '../components/qcd/QCDPanel'
import { MissionPanel } from '../components/missions/MissionPanel'
import { GanttChart } from '../components/gantt/GanttChart'
import { BossHintModal } from '../components/boss/BossHintModal'
import { cn } from '../utils/cn'

type Tab = 'board' | 'gantt' | 'tree' | 'missions' | 'qcd'

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active: { label: '進行中', cls: 'bg-pm-cyan/20 text-pm-cyan border-pm-cyan/30' },
  won: { label: '完了', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  lost: { label: '失敗', cls: 'bg-pm-red/20 text-pm-red border-pm-red/30' },
}

export function GameScreen() {
  const {
    goToTitle,
    activeEvent,
    missions,
    projects,
    activeProjectId,
    setActiveProject,
    mode,
    status,
    bossHints,
  } = useGameStore()

  const [tab, setTab] = useState<Tab>('board')
  const [showBossHint, setShowBossHint] = useState(() => {
    return status === 'won' || status === 'lost'
  })

  const completedMissions = missions.filter(m => m.status === 'completed').length
  const totalMissions = missions.length

  const isMultiProject = projects.length > 1

  // ゲーム終了時にBossHintModalを表示（bossHintsが生成されたとき）
  const shouldShowBossHint = (status === 'won' || status === 'lost') &&
    bossHints.length > 0 && showBossHint

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* ステータスバー */}
      <StatusBar />

      {/* マルチプロジェクト: プロジェクト切替タブ */}
      {isMultiProject && (
        <div className="flex-shrink-0 flex gap-1.5 px-3 py-1.5 bg-pm-surface/30 border-b border-white/8 overflow-x-auto">
          {projects.map(proj => {
            const badge = STATUS_BADGE[proj.status]
            return (
              <button
                key={proj.id}
                onClick={() => setActiveProject(proj.id)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all',
                  proj.id === activeProjectId
                    ? 'bg-pm-cyan/10 border-pm-cyan/30 text-pm-cyan'
                    : 'bg-pm-surface/50 border-white/10 text-pm-muted hover:border-white/20',
                )}
              >
                <span className="font-medium truncate max-w-[80px]">{proj.name}</span>
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full border', badge.cls)}>
                  {badge.label}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* タブナビ */}
      <div className="flex-shrink-0 flex border-b border-white/8 bg-pm-surface/50 overflow-x-auto">
        <TabButton active={tab === 'board'} onClick={() => setTab('board')}>
          📋
        </TabButton>
        <TabButton active={tab === 'gantt'} onClick={() => setTab('gantt')}>
          📊
        </TabButton>
        <TabButton active={tab === 'tree'} onClick={() => setTab('tree')}>
          🌳
        </TabButton>
        <TabButton active={tab === 'missions'} onClick={() => setTab('missions')}>
          <span className="relative">
            🎯
            {completedMissions > 0 && (
              <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-pm-green rounded-full text-[8px] font-bold text-pm-bg flex items-center justify-center">
                {completedMissions}
              </span>
            )}
          </span>
        </TabButton>
        <TabButton active={tab === 'qcd'} onClick={() => setTab('qcd')}>
          📈
        </TabButton>
        <div className="flex-1" />
        <button
          onClick={() => {
            if (confirm('タイトルに戻りますか？（進捗は失われます）')) goToTitle()
          }}
          className="px-3 text-pm-muted text-xs hover:text-pm-red transition-colors flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* タブラベル */}
      <div className="flex-shrink-0 flex border-b border-white/5 bg-pm-surface/20 text-center">
        <TabLabel active={tab === 'board'}>WBSボード</TabLabel>
        <TabLabel active={tab === 'gantt'}>ガント</TabLabel>
        <TabLabel active={tab === 'tree'}>進捗ツリー</TabLabel>
        <TabLabel active={tab === 'missions'}>
          {totalMissions > 0 ? `${completedMissions}/${totalMissions}` : 'ミッション'}
        </TabLabel>
        <TabLabel active={tab === 'qcd'}>QCDパネル</TabLabel>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            className="absolute inset-0"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'board' && <WBSBoard />}
            {tab === 'gantt' && <GanttChart />}
            {tab === 'tree' && <ProgressTree />}
            {tab === 'missions' && <MissionPanel />}
            {tab === 'qcd' && <QCDPanel />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 手札パネル */}
      <HandPanel />

      {/* ターン終了パネル */}
      <TurnPanel />

      {/* イベントモーダル */}
      <AnimatePresence>
        {activeEvent && <EventModal />}
      </AnimatePresence>

      {/* ボスヒントモーダル（ゲーム終了時） */}
      {shouldShowBossHint && (
        <BossHintModal onClose={() => {
          setShowBossHint(false)
          goToTitle()
        }} />
      )}
    </div>
  )
}

function TabButton({
  children, active, onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-12 py-2.5 text-lg transition-all border-b-2 flex-shrink-0 flex items-center justify-center',
        active
          ? 'border-pm-cyan bg-pm-cyan/5'
          : 'border-transparent hover:bg-white/5',
      )}
    >
      {children}
    </button>
  )
}

function TabLabel({
  children, active,
}: {
  children: React.ReactNode
  active: boolean
}) {
  return (
    <div
      className={cn(
        'flex-1 py-1 text-xs transition-colors',
        active ? 'text-pm-cyan' : 'text-pm-muted',
      )}
    >
      {children}
    </div>
  )
}
