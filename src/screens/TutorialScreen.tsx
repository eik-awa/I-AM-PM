import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

// ──────────────────────────────────────
// チュートリアルの全ステップ定義
// ──────────────────────────────────────
const STEP = {
  INTRO_DARK:      0,
  INTRO_BOSS1:     1,
  INTRO_PLAYER:    2,
  INTRO_LOGO:      3,
  INTRO_BOSS2:     4,
  WBS_OPEN:        5,
  WBS_HIGHLIGHT:   6,
  WBS_DEP:         7,
  CARDS_DRAW:      8,
  CARDS_ENG_HINT:  9,
  CARDS_ENG_PICK:  10, // engineerSelected=true でここを抜ける
  CARDS_ENG_DONE:  11,
  CARDS_NEWB_HINT: 12,
  CARDS_NEWB_PICK: 13, // newbieSelected=true でここを抜ける
  CARDS_NEWB_DONE: 14,
  EXEC_READY:      15,
  EXEC_RUNNING:    16, // auto-advance
  EXEC_BOSS:       17,
  FIRE_ENTER:      18, // auto-advance
  FIRE_RESET:      19,
  FIRE_REVIEW:     20,
  FIRE_RESOLVED:   21,
  FIRE_BOSS:       22,
  RESULT_SCREEN:   23,
  RESULT_BOSS:     24,
  FINAL:           25,
} as const

type Step = typeof STEP[keyof typeof STEP]

// ──────────────────────────────────────
// サブコンポーネント
// ──────────────────────────────────────

/** Slackスタイルのメッセージ */
function SlackMsg({
  name,
  emoji,
  text,
  time,
  nameColor = 'text-pm-text',
  avatarBg = 'bg-pm-surface',
  fromBottom = false,
}: {
  name: string
  emoji: string
  text: string
  time?: string
  nameColor?: string
  avatarBg?: string
  fromBottom?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: fromBottom ? 6 : -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-2.5 px-4 py-1.5 hover:bg-white/[0.03] transition-colors"
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${avatarBg} flex items-center justify-center text-sm`}>
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className={`text-xs font-bold ${nameColor}`}>{name}</span>
          {time && <span className="text-pm-muted text-[10px] opacity-60">{time}</span>}
        </div>
        <p className="text-pm-text text-sm leading-relaxed">{text}</p>
      </div>
    </motion.div>
  )
}

/** SlackのDMヘッダー */
function SlackDMHeader() {
  return (
    <div className="flex-shrink-0 px-4 py-3 border-b border-white/10 bg-black/20 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-pm-blue/30 border border-pm-cyan/20 flex items-center justify-center text-base">
        👔
      </div>
      <div>
        <p className="text-pm-text font-bold text-sm">田村部長</p>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-pm-green" />
          <p className="text-pm-muted text-xs">オンライン</p>
        </div>
      </div>
    </div>
  )
}

/** Slackの日付区切り */
function SlackDateDivider() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-pm-muted text-xs border border-white/10 rounded-full px-2.5 py-0.5 opacity-60">今日</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  )
}

/** 上司のSlackメッセージ */
function BossBubble({ text, key: _key }: { text: string; key?: string }) {
  return (
    <SlackMsg
      name="田村部長"
      emoji="👔"
      text={text}
      nameColor="text-pm-cyan"
      avatarBg="bg-pm-blue/30 border border-pm-cyan/20"
    />
  )
}

/** プレイヤーのSlackメッセージ */
function PlayerBubble({ text }: { text: string }) {
  return (
    <SlackMsg
      name="あなた"
      emoji="🧑"
      text={text}
      nameColor="text-pm-yellow"
      avatarBg="bg-pm-accent/50"
      fromBottom={true}
    />
  )
}

/** タップして進むボタン */
function TapNext({ label = 'タップして続ける', onClick }: { label?: string; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      onClick={onClick}
      className="w-full mt-auto py-4 text-pm-cyan/70 text-xs text-center tracking-widest border-t border-white/5 active:bg-white/5"
    >
      {label} ›
    </motion.button>
  )
}

/** WBSタスク行 */
function WBSRow({
  name,
  progress,
  status,
  highlight,
  assigned,
  onDrop,
  isDropTarget,
}: {
  name: string
  progress: number
  status: 'locked' | 'ready' | 'in_progress' | 'done'
  highlight?: boolean
  assigned?: string
  onDrop?: () => void
  isDropTarget?: boolean
}) {
  const statusColor = {
    locked: 'text-pm-muted',
    ready: 'text-pm-yellow',
    in_progress: 'text-pm-cyan',
    done: 'text-pm-green',
  }[status]

  const statusLabel = {
    locked: '🔒 ロック',
    ready: '待機中',
    in_progress: '進行中',
    done: '✓ 完了',
  }[status]

  return (
    <motion.div
      animate={highlight ? { boxShadow: ['0 0 0px rgba(0,180,216,0)', '0 0 16px rgba(0,180,216,0.5)', '0 0 0px rgba(0,180,216,0)'] } : {}}
      transition={{ duration: 1.2, repeat: Infinity }}
      onClick={onDrop}
      className={[
        'px-3 py-2.5 rounded-lg border transition-all',
        highlight && status === 'locked'
          ? 'border-pm-red/60 bg-pm-red/5'
          : highlight
          ? 'border-pm-cyan/50 bg-pm-cyan/5 cursor-pointer'
          : isDropTarget
          ? 'border-pm-cyan/60 bg-pm-cyan/8 border-dashed cursor-pointer'
          : 'border-white/5 bg-pm-surface/50',
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-pm-text text-sm font-medium">{name}</span>
        <span className={`text-xs ${statusColor}`}>{statusLabel}</span>
      </div>
      {status !== 'locked' && (
        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-pm-cyan rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      )}
      {assigned && (
        <div className="mt-1.5 flex gap-1">
          <span className="text-xs px-2 py-0.5 rounded bg-pm-blue/30 text-pm-cyan border border-pm-cyan/20">
            {assigned}
          </span>
        </div>
      )}
    </motion.div>
  )
}

/** 人員カード */
function PersonnelCard({
  name,
  role,
  productivity,
  highlight,
  selected,
  dimmed,
  onTap,
}: {
  name: string
  role: string
  productivity: number
  highlight?: boolean
  selected?: boolean
  dimmed?: boolean
  onTap?: () => void
}) {
  return (
    <motion.div
      animate={
        selected
          ? { y: -12, scale: 1.05, boxShadow: '0 8px 24px rgba(0,180,216,0.5)' }
          : highlight
          ? { scale: [1, 1.03, 1] }
          : {}
      }
      transition={
        highlight && !selected
          ? { duration: 1, repeat: Infinity }
          : { duration: 0.2 }
      }
      onClick={onTap}
      className={[
        'rounded-xl border p-3 w-28 flex-shrink-0 transition-opacity',
        selected
          ? 'border-pm-cyan bg-pm-card glow-cyan cursor-pointer'
          : highlight
          ? 'border-pm-cyan/70 bg-pm-card cursor-pointer'
          : dimmed
          ? 'border-white/5 bg-pm-surface/50 opacity-40'
          : 'border-white/10 bg-pm-card',
      ].join(' ')}
    >
      <p className="text-pm-cyan text-xs mb-0.5">{role}</p>
      <p className="text-pm-text text-sm font-bold leading-tight">{name}</p>
      <div className="mt-2 flex items-center gap-1">
        <span className="text-pm-muted text-xs">⚡</span>
        <span className="text-pm-yellow text-xs font-bold">{productivity}</span>
      </div>
    </motion.div>
  )
}

// ──────────────────────────────────────
// メイン チュートリアル画面
// ──────────────────────────────────────

export function TutorialScreen() {
  const { goToTitle } = useGameStore()

  const [step, setStep] = useState<Step>(STEP.INTRO_DARK)
  const [engineerSelected, setEngineerSelected] = useState(false)
  const [newbieSelected, setNewbieSelected] = useState(false)
  const [engineerAssigned, setEngineerAssigned] = useState(false)
  const [newbieAssigned, setNewbieAssigned] = useState(false)
  const [apiProgress, setApiProgress] = useState(0)
  const [screenProgress, setScreenProgress] = useState(0)
  const [hasFire, setHasFire] = useState(false)
  const [fireChoice, setFireChoice] = useState<'A' | 'B' | null>(null)

  const next = useCallback(() => setStep(s => (s + 1) as Step), [])

  // 自動進行ステップ
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    if (step === STEP.INTRO_DARK) {
      t = setTimeout(next, 700)
    } else if (step === STEP.EXEC_RUNNING) {
      t = setTimeout(() => {
        setApiProgress(30)
        setScreenProgress(10)
        setTimeout(next, 1200)
      }, 400)
    } else if (step === STEP.FIRE_ENTER) {
      t = setTimeout(() => {
        setHasFire(true)
        setTimeout(() => {
          setApiProgress(15)
          next()
        }, 1000)
      }, 300)
    }
    return () => clearTimeout(t)
  }, [step, next])

  // ──────────────────────────────────
  // レンダー
  // ──────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-pm-bg overflow-hidden relative">
      <AnimatePresence mode="wait">

        {/* ===== 0: 暗転 ===== */}
        {step === STEP.INTRO_DARK && (
          <motion.div
            key="intro-dark"
            className="absolute inset-0 bg-black"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}

        {/* ===== 1: ボス台詞① ===== */}
        {step === STEP.INTRO_BOSS1 && (
          <motion.div
            key="intro-b1"
            className="absolute inset-0 bg-black flex flex-col items-center justify-center px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={next}
          >
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-pm-text text-xl text-center leading-relaxed"
            >
              「君、次のプロジェクトの
              <br />
              PMやってみて」
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-8 text-pm-muted text-xs tracking-widest"
            >
              タップして続ける
            </motion.p>
          </motion.div>
        )}

        {/* ===== 2: プレイヤー台詞 ===== */}
        {step === STEP.INTRO_PLAYER && (
          <motion.div
            key="intro-p"
            className="absolute inset-0 bg-black flex flex-col items-center justify-center px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={next}
          >
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-pm-muted text-xl text-center leading-relaxed italic"
            >
              「え、まだ4年目
              <br />
              なんですけど…」
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="mt-8 text-pm-muted text-xs tracking-widest"
            >
              タップして続ける
            </motion.p>
          </motion.div>
        )}

        {/* ===== 3: タイトルロゴ ===== */}
        {step === STEP.INTRO_LOGO && (
          <motion.div
            key="intro-logo"
            className="absolute inset-0 bg-pm-bg flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={next}
          >
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-pm-muted text-xs tracking-[0.4em] mb-3"
            >
              — SIMULATION GAME —
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 180 }}
              className="text-6xl font-bold text-pm-cyan title-glow"
              style={{ fontFamily: 'monospace' }}
            >
              AM I PM
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="mt-10 text-pm-muted text-xs tracking-widest"
            >
              タップして続ける
            </motion.p>
          </motion.div>
        )}

        {/* ===== 4: ボス台詞② ===== */}
        {step === STEP.INTRO_BOSS2 && (
          <motion.div
            key="intro-b2"
            className="absolute inset-0 bg-pm-bg flex flex-col items-center justify-center px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={next}
          >
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-pm-text text-xl text-center leading-relaxed"
            >
              「安心しろ。
              <br />
              最初は簡単な案件だ」
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="mt-8 text-pm-muted text-xs tracking-widest"
            >
              タップして続ける
            </motion.p>
          </motion.div>
        )}

        {/* ===== 5–7: STEP 1 WBS ===== */}
        {(step === STEP.WBS_OPEN || step === STEP.WBS_HIGHLIGHT || step === STEP.WBS_DEP) && (
          <motion.div
            key="step1-wbs"
            className="absolute inset-0 flex flex-col bg-pm-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* ヘッダー */}
            <div className="flex-shrink-0 px-4 pt-4 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-pm-cyan text-xs font-bold tracking-widest">STEP 1</span>
                <span className="text-pm-muted text-xs">WBSを確認する</span>
              </div>
            </div>

            {/* ボス台詞 */}
            <div className="flex-shrink-0 pt-3">
              <AnimatePresence mode="wait">
                {step === STEP.WBS_OPEN && (
                  <BossBubble key="wbs-b1" text="まずプロジェクト全体を確認しろ" />
                )}
                {step === STEP.WBS_HIGHLIGHT && (
                  <BossBubble key="wbs-b2" text="「テスト」がロックされているのが見えるか？" />
                )}
                {step === STEP.WBS_DEP && (
                  <div>
                    <BossBubble key="wbs-b3a" text="テストは開発が終わらないと始められない" />
                    <BossBubble key="wbs-b3b" text="これが「依存関係」だ" />
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* WBSボード（簡略版） */}
            <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-2">
              <WBSRow name="要件定義" progress={100} status="done" />
              <WBSRow name="基本設計" progress={100} status="done" />
              <div className="ml-4 flex flex-col gap-2">
                <WBSRow name="API開発" progress={0} status="ready" />
                <WBSRow name="画面実装" progress={0} status="ready" />
              </div>
              {/* テスト：ハイライト */}
              <motion.div
                animate={step >= STEP.WBS_HIGHLIGHT ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <WBSRow
                  name="結合テスト"
                  progress={0}
                  status="locked"
                  highlight={step >= STEP.WBS_HIGHLIGHT}
                />
              </motion.div>
              <WBSRow name="リリース" progress={0} status="locked" />
            </div>

            {/* アクションボタン */}
            <div className="flex-shrink-0 p-4">
              {step === STEP.WBS_OPEN && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  onClick={next}
                  className="w-full py-3 bg-pm-surface border border-white/10 rounded-xl text-pm-text text-sm active:scale-95 transition-transform"
                >
                  WBSを見る
                </motion.button>
              )}
              {step === STEP.WBS_HIGHLIGHT && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={next}
                  className="w-full py-3 bg-pm-surface border border-white/10 rounded-xl text-pm-text text-sm active:scale-95 transition-transform"
                >
                  ロックされているのを確認した
                </motion.button>
              )}
              {step === STEP.WBS_DEP && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={next}
                  className="w-full py-3 bg-pm-cyan/10 border border-pm-cyan/40 rounded-xl text-pm-cyan text-sm font-bold active:scale-95 transition-transform glow-cyan"
                >
                  タップして確認 ✓
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* ===== 8–14: STEP 2 カードアサイン ===== */}
        {(step >= STEP.CARDS_DRAW && step <= STEP.CARDS_NEWB_DONE) && (
          <motion.div
            key="step2-cards"
            className="absolute inset-0 flex flex-col bg-pm-bg"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            {/* ヘッダー */}
            <div className="flex-shrink-0 px-4 pt-4 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-pm-cyan text-xs font-bold tracking-widest">STEP 2</span>
                <span className="text-pm-muted text-xs">カードをアサインする</span>
              </div>
            </div>

            {/* ボス台詞 */}
            <div className="flex-shrink-0 pt-3">
              <AnimatePresence mode="wait">
                {step === STEP.CARDS_DRAW && (
                  <BossBubble key="cd-b1" text="毎週、使える人員が手に入る" />
                )}
                {(step === STEP.CARDS_ENG_HINT || step === STEP.CARDS_ENG_PICK) && (
                  <BossBubble key="cd-b2" text="エンジニアをAPI開発にアサインしてみろ" />
                )}
                {step === STEP.CARDS_ENG_DONE && (
                  <div>
                    <BossBubble key="cd-b3a" text="新人は画面実装に入れておけ" />
                    <BossBubble key="cd-b3b" text="効率は悪いが、いずれ育つ" />
                  </div>
                )}
                {(step === STEP.CARDS_NEWB_HINT || step === STEP.CARDS_NEWB_PICK) && (
                  <BossBubble key="cd-b4" text="新人を画面実装にアサインしよう" />
                )}
                {step === STEP.CARDS_NEWB_DONE && (
                  <BossBubble key="cd-b5" text="よし。全員配置完了だ" />
                )}
              </AnimatePresence>
            </div>

            {/* アサイン状態のWBS（上部） */}
            <div className="flex-shrink-0 px-4 py-2 flex flex-col gap-2">
              <WBSRow
                name="API開発"
                progress={0}
                status="ready"
                highlight={step >= STEP.CARDS_ENG_HINT && step <= STEP.CARDS_ENG_PICK && engineerSelected}
                assigned={engineerAssigned ? '田中' : undefined}
                isDropTarget={step <= STEP.CARDS_ENG_PICK && engineerSelected}
                onDrop={
                  engineerSelected && !engineerAssigned
                    ? () => {
                        setEngineerAssigned(true)
                        setEngineerSelected(false)
                        setTimeout(() => setStep(STEP.CARDS_ENG_DONE), 400)
                      }
                    : undefined
                }
              />
              <WBSRow
                name="画面実装"
                progress={0}
                status="ready"
                highlight={step >= STEP.CARDS_NEWB_HINT && newbieSelected}
                assigned={newbieAssigned ? '山田（新人）' : undefined}
                isDropTarget={step >= STEP.CARDS_NEWB_HINT && newbieSelected}
                onDrop={
                  newbieSelected && !newbieAssigned
                    ? () => {
                        setNewbieAssigned(true)
                        setNewbieSelected(false)
                        setTimeout(() => setStep(STEP.CARDS_NEWB_DONE), 400)
                      }
                    : undefined
                }
              />
            </div>

            {/* ドラッグヒントアニメーション */}
            {(step === STEP.CARDS_ENG_HINT || step === STEP.CARDS_NEWB_HINT) && !engineerSelected && !newbieSelected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 py-1"
              >
                <motion.p
                  animate={{ x: [0, 6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-pm-cyan text-xs text-center"
                >
                  カードをタップ → タスクをタップでアサイン 👆
                </motion.p>
              </motion.div>
            )}

            {/* 選択中メッセージ */}
            {(engineerSelected || newbieSelected) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 py-1"
              >
                <motion.p
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="text-pm-cyan text-xs text-center"
                >
                  ↑ タスクをタップしてアサイン
                </motion.p>
              </motion.div>
            )}

            {/* アサイン完了メッセージ */}
            {step === STEP.CARDS_ENG_DONE && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-4 px-3 py-2 bg-pm-green/10 border border-pm-green/30 rounded-lg"
              >
                <p className="text-pm-green text-sm text-center font-bold">✓ アサイン完了</p>
              </motion.div>
            )}
            {step === STEP.CARDS_NEWB_DONE && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-4 px-3 py-2 bg-pm-green/10 border border-pm-green/30 rounded-lg"
              >
                <p className="text-pm-green text-sm text-center font-bold">✓ 全員アサイン完了</p>
              </motion.div>
            )}

            {/* 手札 */}
            <div className="flex-1 flex flex-col justify-end">
              <div className="px-4 pb-2">
                <p className="text-pm-muted text-xs mb-2 tracking-wider">── 手札 ──</p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {/* エンジニアカード */}
                  <PersonnelCard
                    name="田中"
                    role="バックエンド"
                    productivity={20}
                    highlight={
                      (step === STEP.CARDS_ENG_HINT || step === STEP.CARDS_ENG_PICK) && !engineerAssigned
                    }
                    selected={engineerSelected}
                    dimmed={engineerAssigned}
                    onTap={
                      !engineerAssigned && step <= STEP.CARDS_ENG_PICK
                        ? () => {
                            setEngineerSelected(s => !s)
                            setStep(STEP.CARDS_ENG_PICK)
                          }
                        : undefined
                    }
                  />
                  {/* 新人カード */}
                  <PersonnelCard
                    name="山田（新人）"
                    role="全般"
                    productivity={8}
                    highlight={
                      (step === STEP.CARDS_NEWB_HINT || step === STEP.CARDS_NEWB_PICK) && !newbieAssigned
                    }
                    selected={newbieSelected}
                    dimmed={newbieAssigned || step < STEP.CARDS_ENG_DONE}
                    onTap={
                      !newbieAssigned && step >= STEP.CARDS_ENG_DONE
                        ? () => {
                            setNewbieSelected(s => !s)
                            setStep(STEP.CARDS_NEWB_PICK)
                          }
                        : undefined
                    }
                  />
                </div>
              </div>
            </div>

            {/* 次へボタン（完了後） */}
            {step === STEP.CARDS_NEWB_DONE && (
              <div className="flex-shrink-0 p-4 pt-0">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={next}
                  className="w-full py-3 bg-pm-cyan/10 border border-pm-cyan/40 rounded-xl text-pm-cyan text-sm font-bold active:scale-95 transition-transform"
                >
                  次のステップへ →
                </motion.button>
              </div>
            )}
          </motion.div>
        )}

        {/* ===== 15–17: STEP 3 実行フェーズ ===== */}
        {(step >= STEP.EXEC_READY && step <= STEP.EXEC_BOSS) && (
          <motion.div
            key="step3-exec"
            className="absolute inset-0 flex flex-col bg-pm-bg"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            {/* ヘッダー */}
            <div className="flex-shrink-0 px-4 pt-4 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-pm-cyan text-xs font-bold tracking-widest">STEP 3</span>
                <span className="text-pm-muted text-xs">実行フェーズ</span>
              </div>
            </div>

            {/* ボス台詞 */}
            <div className="flex-shrink-0 pt-3">
              <AnimatePresence mode="wait">
                {step === STEP.EXEC_READY && (
                  <BossBubble key="ex-b1" text="では「実行」ボタンを押してみろ" />
                )}
                {step === STEP.EXEC_RUNNING && (
                  <BossBubble key="ex-b2" text="進捗が動いているぞ…" />
                )}
                {step === STEP.EXEC_BOSS && (
                  <div>
                    <BossBubble key="ex-b3a" text="エンジニアの方が早いだろ？" />
                    <BossBubble key="ex-b3b" text="スキルと適性が大事なんだ" />
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* タスク進捗 */}
            <div className="flex-1 px-4 py-4 flex flex-col gap-3">
              <div className="p-4 bg-pm-surface rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-pm-text text-sm font-bold">API開発</p>
                    <p className="text-pm-cyan text-xs mt-0.5">担当：田中（バックエンド）</p>
                  </div>
                  <motion.span
                    key={apiProgress}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="text-pm-yellow font-bold text-lg"
                  >
                    {apiProgress}%
                  </motion.span>
                </div>
                <div className="h-3 bg-black/40 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-pm-cyan rounded-full"
                    animate={{ width: `${apiProgress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>

              <div className="p-4 bg-pm-surface rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-pm-text text-sm font-bold">画面実装</p>
                    <p className="text-pm-muted text-xs mt-0.5">担当：山田（新人・全般）</p>
                  </div>
                  <motion.span
                    key={screenProgress}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="text-pm-yellow font-bold text-lg"
                  >
                    {screenProgress}%
                  </motion.span>
                </div>
                <div className="h-3 bg-black/40 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-pm-muted rounded-full"
                    animate={{ width: `${screenProgress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* 出力差分の説明（EXEC_BOSS時） */}
              {step === STEP.EXEC_BOSS && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-pm-blue/10 border border-pm-blue/20 rounded-lg"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-pm-muted text-xs">田中（バックエンド適性）</span>
                    <span className="text-pm-cyan text-sm font-bold">+30%</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-pm-muted text-xs">山田（スキルミスマッチ）</span>
                    <span className="text-pm-muted text-sm font-bold">+10%</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* アクション */}
            <div className="flex-shrink-0 p-4">
              {step === STEP.EXEC_READY && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    boxShadow: ['0 0 0px rgba(0,180,216,0)', '0 0 20px rgba(0,180,216,0.5)', '0 0 0px rgba(0,180,216,0)'],
                  }}
                  transition={{ boxShadow: { duration: 1.5, repeat: Infinity }, opacity: { delay: 0.3 } }}
                  onClick={next}
                  className="w-full py-4 bg-pm-cyan/15 border-2 border-pm-cyan/60 rounded-xl text-pm-cyan font-bold text-base active:scale-95 transition-transform"
                >
                  ▶ 実行
                </motion.button>
              )}
              {step === STEP.EXEC_RUNNING && (
                <div className="w-full py-4 text-center text-pm-muted text-sm">
                  実行中…
                </div>
              )}
              {step === STEP.EXEC_BOSS && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={next}
                  className="w-full py-3 bg-pm-surface border border-white/10 rounded-xl text-pm-text text-sm active:scale-95 transition-transform"
                >
                  次のステップへ →
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* ===== 18–22: STEP 4 炎上イベント ===== */}
        {(step >= STEP.FIRE_ENTER && step <= STEP.FIRE_BOSS) && (
          <motion.div
            key="step4-fire"
            className="absolute inset-0 flex flex-col bg-pm-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* ヘッダー */}
            <div className="flex-shrink-0 px-4 pt-4 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-pm-red text-xs font-bold tracking-widest">STEP 4</span>
                <span className="text-pm-muted text-xs">イベント発生</span>
              </div>
            </div>

            {/* 炎上エフェクト */}
            {hasFire && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-shrink-0 mx-4 mt-3 p-3 bg-pm-red/10 border border-pm-red/40 rounded-xl fire-pulse"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔥</span>
                  <div>
                    <p className="text-pm-red text-sm font-bold">炎上発生！</p>
                    <p className="text-pm-muted text-xs">軽微な仕様変更</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ボス台詞 */}
            <div className="flex-shrink-0 pt-3">
              <AnimatePresence mode="wait">
                {step === STEP.FIRE_ENTER && (
                  <div className="h-12" />
                )}
                {step === STEP.FIRE_RESET && (
                  <div>
                    <PlayerBubble key="fr-p1" text="…え" />
                    <BossBubble key="fr-b1" text="よくあることだ" />
                    <BossBubble key="fr-b2" text="どう対処するか、選べ" />
                  </div>
                )}
                {step === STEP.FIRE_REVIEW && (
                  <div>
                    <BossBubble key="frv-b1" text="PMとして判断を下せ" />
                  </div>
                )}
                {step === STEP.FIRE_RESOLVED && (
                  <div>
                    {fireChoice === 'A' && (
                      <BossBubble key="frv-A" text="残業で乗り切ったか。ただ、品質には注意しろ" />
                    )}
                    {fireChoice === 'B' && (
                      <BossBubble key="frv-B" text="スコープ削減は正しい判断だ。PMの仕事は優先順位をつけることだ" />
                    )}
                  </div>
                )}
                {step === STEP.FIRE_BOSS && (
                  <div>
                    <BossBubble key="fb-b1" text="問題は必ず起きる" />
                    <BossBubble key="fb-b2" text="早めに気づいて、早めに手を打つ。それだけだ" />
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* タスク状態 */}
            <div className="flex-1 px-4 py-3 flex flex-col gap-2">
              {/* API開発 — 炎上中 */}
              <div className={`p-4 rounded-xl border transition-all ${hasFire ? 'border-pm-red/60 bg-pm-red/5' : 'border-white/5 bg-pm-surface'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className="text-pm-text text-sm font-bold">API開発</p>
                    {hasFire && (
                      <span className="text-xs text-pm-red fire-pulse">🔥 炎上中</span>
                    )}
                    {fireChoice !== null && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-pm-green"
                      >
                        ✓ 解除済み
                      </motion.span>
                    )}
                  </div>
                  <span className="text-pm-yellow font-bold text-lg">{apiProgress}%</span>
                </div>
                <div className="h-3 bg-black/40 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${hasFire ? 'bg-pm-red/70' : 'bg-pm-cyan'}`}
                    animate={{ width: `${apiProgress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                {step === STEP.FIRE_RESET && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-pm-red text-xs mt-2"
                  >
                    ↓ 仕様変更で 30% → 15% に後退
                  </motion.p>
                )}
              </div>

              <div className="p-4 bg-pm-surface rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-pm-text text-sm font-bold">画面実装</p>
                  <span className="text-pm-yellow font-bold text-lg">{screenProgress}%</span>
                </div>
                <div className="h-3 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-pm-muted rounded-full" style={{ width: `${screenProgress}%` }} />
                </div>
              </div>

              {/* 選択肢 */}
              {step === STEP.FIRE_REVIEW && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex flex-col gap-3"
                >
                  <p className="text-pm-muted text-xs tracking-wider">── 対処方法を選ぶ ──</p>
                  <motion.button
                    animate={{ boxShadow: ['0 0 0px rgba(0,180,216,0)', '0 0 16px rgba(0,180,216,0.4)', '0 0 0px rgba(0,180,216,0)'] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    onClick={() => {
                      setFireChoice('A')
                      setHasFire(false)
                      setTimeout(() => setStep(STEP.FIRE_RESOLVED), 400)
                    }}
                    className="w-full p-4 rounded-xl border border-pm-cyan/40 bg-pm-cyan/5 text-left active:scale-95 transition-transform"
                  >
                    <p className="text-pm-cyan text-xs font-bold mb-1">A：残業で対応する</p>
                    <p className="text-pm-muted text-xs">チームに残業を依頼し、仕様変更を吸収する</p>
                    <p className="text-pm-red text-xs mt-1">リスク：品質低下の可能性</p>
                  </motion.button>
                  <motion.button
                    animate={{ boxShadow: ['0 0 0px rgba(6,214,160,0)', '0 0 16px rgba(6,214,160,0.4)', '0 0 0px rgba(6,214,160,0)'] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                    onClick={() => {
                      setFireChoice('B')
                      setHasFire(false)
                      setTimeout(() => setStep(STEP.FIRE_RESOLVED), 400)
                    }}
                    className="w-full p-4 rounded-xl border border-pm-green/40 bg-pm-green/5 text-left active:scale-95 transition-transform"
                  >
                    <p className="text-pm-green text-xs font-bold mb-1">B：スコープを調整する</p>
                    <p className="text-pm-muted text-xs">一部機能を削減し、期日と品質を守る</p>
                    <p className="text-pm-yellow text-xs mt-1">リスク：機能の一部を削減</p>
                  </motion.button>
                </motion.div>
              )}

              {/* 対処完了 */}
              {step === STEP.FIRE_RESOLVED && fireChoice !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-3 py-2 bg-pm-green/10 border border-pm-green/30 rounded-lg"
                >
                  <p className="text-pm-green text-sm text-center font-bold">
                    {fireChoice === 'A' ? '✓ 残業対応で炎上解除' : '✓ スコープ調整で炎上解除'}
                  </p>
                </motion.div>
              )}
            </div>

            {/* ボタン */}
            <div className="flex-shrink-0 p-4">
              {step === STEP.FIRE_RESET && (
                <TapNext label="対処方法を選ぶ" onClick={next} />
              )}
              {step === STEP.FIRE_RESOLVED && fireChoice !== null && (
                <TapNext label="次へ" onClick={next} />
              )}
              {step === STEP.FIRE_BOSS && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  onClick={next}
                  className="w-full py-3 bg-pm-cyan/10 border border-pm-cyan/40 rounded-xl text-pm-cyan text-sm font-bold active:scale-95 transition-transform"
                >
                  結果を見る →
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* ===== 23–24: STEP 5 結果 ===== */}
        {(step === STEP.RESULT_SCREEN || step === STEP.RESULT_BOSS) && (
          <motion.div
            key="step5-result"
            className="absolute inset-0 flex flex-col bg-pm-bg"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* ヘッダー */}
            <div className="flex-shrink-0 px-4 pt-4 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-pm-yellow text-xs font-bold tracking-widest">STEP 5</span>
                <span className="text-pm-muted text-xs">チュートリアル完了</span>
              </div>
            </div>

            {/* ボス台詞 */}
            <div className="flex-shrink-0 pt-3">
              <AnimatePresence mode="wait">
                {step === STEP.RESULT_SCREEN && (
                  <BossBubble key="rs-b1" text="残り2ターンでなんとかクリアしたな" />
                )}
                {step === STEP.RESULT_BOSS && (
                  <div>
                    <BossBubble key="rs-b2" text="…まあ、最初にしてはな" />
                    <BossBubble key="rs-b3" text="次は品質も意識してみろ" />
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* 評価カード */}
            <div className="flex-1 px-4 py-3 flex flex-col gap-3">
              <div className="p-4 bg-pm-surface rounded-xl border border-white/10">
                <p className="text-pm-muted text-xs tracking-widest mb-3 text-center">── 評価結果 ──</p>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-pm-muted text-sm">納期</span>
                    <span className="text-pm-green text-sm font-bold">達成（ギリギリ）</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-pm-muted text-sm">品質</span>
                    <span className="text-pm-yellow text-sm font-bold">C（バグあり）</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-pm-muted text-sm">コスト</span>
                    <span className="text-pm-orange text-sm font-bold">やや高め</span>
                  </div>
                </div>
              </div>

              {/* 総合評価 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center p-6 bg-pm-card rounded-xl border border-white/10"
              >
                <div className="text-center">
                  <p className="text-pm-muted text-xs mb-1">総合評価</p>
                  <p className="text-5xl font-bold text-pm-yellow" style={{ fontFamily: 'monospace' }}>可</p>
                </div>
              </motion.div>
            </div>

            {/* ボタン */}
            <div className="flex-shrink-0 p-4">
              {step === STEP.RESULT_SCREEN && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={next}
                  className="w-full py-3 bg-pm-surface border border-white/10 rounded-xl text-pm-text text-sm active:scale-95 transition-transform"
                >
                  上司の言葉を聞く →
                </motion.button>
              )}
              {step === STEP.RESULT_BOSS && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  onClick={next}
                  className="w-full py-3 bg-pm-cyan/10 border border-pm-cyan/40 rounded-xl text-pm-cyan text-sm font-bold active:scale-95 transition-transform"
                >
                  さあ、本番だ →
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* ===== 25: エンド ===== */}
        {step === STEP.FINAL && (
          <motion.div
            key="final"
            className="absolute inset-0 flex flex-col items-center justify-center bg-pm-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-pm-cyan mb-8"
              style={{ fontFamily: 'monospace' }}
            >
              さあ、本番だ
            </motion.h2>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={goToTitle}
              className="px-10 py-4 bg-pm-cyan/15 border border-pm-cyan/50 rounded-xl text-pm-cyan font-bold text-lg active:scale-95 transition-transform glow-cyan"
            >
              メインメニューへ
            </motion.button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
