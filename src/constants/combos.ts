import type { ComboRecipe } from '../types/combo'

// ── シナジー（コンボ）定義 ────────────────────────────────────
// 図鑑に登録されるコンボレシピ。isDiscovered=false が初期値。
// ゲーム中に条件を満たすと自動発動し、図鑑に記録される。

export const COMBO_RECIPES: ComboRecipe[] = [
  // ── 種類A: カラーセット（3色×4コンボ） ────────────────────

  {
    id: 'combo_tech_set',
    name: '技術の壁',
    type: 'colorSet',
    condition: { type: 'colorSet', color: 'tech', minCount: 3 },
    effect: {
      bugRateMultiplier: 0.5,
      // コミュニケーションコストとして品質を微減（品質ペナルティはgameStore側で適用）
    },
    isDiscovered: false,
    flavorText: '「コードで語れ、会議は不要」',
    description: '⚙️技術系（BE/Infra）3名同時稼働。バグ率-50%。ただしコミュニケーションコスト微増。',
  },

  {
    id: 'combo_drive_set',
    name: '推進力全開',
    type: 'colorSet',
    condition: { type: 'colorSet', color: 'drive', minCount: 3 },
    effect: {
      productivityMultiplier: 1.3,
    },
    isDiscovered: false,
    flavorText: '「スピード感が大事！細かいことは後で！」',
    description: '🚀推進系（FE/QA/Design）3名同時稼働。全体出力+30%。',
  },

  {
    id: 'combo_adjust_set',
    name: '調整の達人',
    type: 'colorSet',
    condition: { type: 'colorSet', color: 'adjust', minCount: 3 },
    effect: {
      eventProbMultiplier: 0.6,
    },
    isDiscovered: false,
    flavorText: '「問題は起きる前に潰す。それがPMの仕事だ」',
    description: '📋管理系（リーダー/新人/汎用）3名同時稼働。イベント発生率-40%。',
  },

  {
    id: 'combo_blitz_set',
    name: '神速チーム',
    type: 'colorSet',
    condition: { type: 'colorSet', color: 'blitz', minCount: 2 },
    effect: {
      productivityMultiplier: 1.8,
      comboTurns: 3,
      triggerFireAfterTurns: 4,
    },
    isDiscovered: false,
    flavorText: '「燃え尽きるまでやろうぜ！（文字通り）」',
    description: '⭐精鋭系（スペシャリスト）2名同時稼働。3ターン出力×1.8。ただし4ターン目に炎上が発生する。',
  },

  // ── 種類B: 人員連鎖（同一人物のタスク跨ぎ） ───────────────

  {
    id: 'combo_tanaka_chain',
    name: '俺の担当は俺が直す',
    type: 'personnelChain',
    condition: {
      type: 'personnelChain',
      personnelId: 'p_tanaka',
      requiresPreviousTask: true,
      requiredTaskSkill: 'backend',
    },
    effect: {
      bugRateMultiplier: 0.05,      // バグ修正コストほぼゼロ
      productivityMultiplier: 1.3,  // 出力+30%
    },
    isDiscovered: false,
    flavorText: '「このコード、俺が書いたから何が起きてるか分かる」',
    description: '田中がバックエンドタスクを連続担当。バグ率激減・出力+30%。',
  },

  {
    id: 'combo_takahashi_chain',
    name: '品質番長',
    type: 'personnelChain',
    condition: {
      type: 'personnelChain',
      personnelId: 'p_takahashi',
      requiredTaskSkill: 'qa',
      taskHasBugs: true,
    },
    effect: {
      bugRateMultiplier: 0.3,       // バグ発見率+40%（バグ率を下げることで表現）
      productivityMultiplier: 1.5,  // 修正速度×1.5
    },
    isDiscovered: false,
    flavorText: '「バグは全部私が見つける。絶対に。」',
    description: '高橋がバグのあるQAタスクを担当。バグ発見率+40%・修正速度×1.5。',
  },

  {
    id: 'combo_kimura_chain',
    name: '全部見えてる',
    type: 'personnelChain',
    condition: {
      type: 'personnelChain',
      personnelId: 'p_kimura',
      minTurnsOnTask: 2,
    },
    effect: {
      nextEventPreview: true,
    },
    isDiscovered: false,
    flavorText: '「次に何が起きるか、もう見えてる」',
    description: '木村が同一タスクを2ターン以上連続担当。次ターンのイベント内容を事前開示。',
  },

  {
    id: 'combo_yamada_awakening',
    name: '覚醒',
    type: 'personnelChain',
    condition: {
      type: 'personnelChain',
      personnelId: 'p_yamada',
      minTurnsOnTask: 4,
    },
    effect: {
      personnelProductivityMultiplier: 2.5,  // 新人→エンジニア相当に一時昇格
    },
    isDiscovered: false,
    flavorText: '「…できる気がしてきた！いや、できる！」',
    description: '山田が同一タスクを4ターン連続担当。出力が一時的にエンジニア相当に昇格。',
  },
]
