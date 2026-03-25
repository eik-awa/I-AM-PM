import type { ProjectScenario } from '../types/game'
import type { TaskCard } from '../types/card'
import type { WBSPhase } from '../types/game'

// ── チュートリアルシナリオ ──────────────────────────────────
const TUTORIAL_PHASES: WBSPhase[] = [
  {
    id: 'phase_planning',
    name: '設計フェーズ',
    tasks: [
      {
        id: 't_requirements', type: 'task',
        name: '要件定義', description: '何を作るかを決める',
        requiredSkill: 'general', effortTotal: 30, effortDone: 30,
        difficulty: 1, qualityImpact: 5, blockedBy: [], status: 'done',
        phaseId: 'phase_planning', bugs: 0, statusEffects: [],
        skillPointReward: 5,
      } as TaskCard,
      {
        id: 't_design', type: 'task',
        name: '基本設計', description: 'システムの骨格を設計する',
        requiredSkill: 'backend', effortTotal: 40, effortDone: 0,
        difficulty: 2, qualityImpact: 8, blockedBy: ['t_requirements'], status: 'ready',
        phaseId: 'phase_planning', bugs: 0, statusEffects: [],
        skillPointReward: 10,
      } as TaskCard,
    ],
  },
  {
    id: 'phase_dev',
    name: '開発フェーズ',
    tasks: [
      {
        id: 't_api', type: 'task',
        name: 'API開発', description: 'バックエンドAPIの実装',
        requiredSkill: 'backend', effortTotal: 80, effortDone: 0,
        difficulty: 2, qualityImpact: 15, blockedBy: ['t_design'], status: 'locked',
        phaseId: 'phase_dev', bugs: 0, statusEffects: [],
        skillPointReward: 10,
      } as TaskCard,
      {
        id: 't_ui', type: 'task',
        name: '画面実装', description: 'フロントエンドの実装',
        requiredSkill: 'frontend', effortTotal: 70, effortDone: 0,
        difficulty: 2, qualityImpact: 12, blockedBy: ['t_design'], status: 'locked',
        phaseId: 'phase_dev', bugs: 0, statusEffects: [],
        skillPointReward: 10,
      } as TaskCard,
    ],
  },
  {
    id: 'phase_test',
    name: 'テストフェーズ',
    tasks: [
      {
        id: 't_test', type: 'task',
        name: '結合テスト', description: '全体の動作確認',
        requiredSkill: 'qa', effortTotal: 50, effortDone: 0,
        difficulty: 1, qualityImpact: 20, blockedBy: ['t_api', 't_ui'], status: 'locked',
        phaseId: 'phase_test', bugs: 0, statusEffects: [],
        skillPointReward: 5,
      } as TaskCard,
    ],
  },
]

// ── 入門シナリオ：はじめてのプロジェクト ──────────────────
const BEGINNER_PHASES: WBSPhase[] = [
  {
    id: 'bg_ph1',
    name: '計画',
    tasks: [
      {
        id: 'bg_req', type: 'task',
        name: '要件定義', description: 'プロジェクトの目標と範囲を定める',
        requiredSkill: 'general', effortTotal: 20, effortDone: 0,
        difficulty: 1, qualityImpact: 8, blockedBy: [], status: 'ready',
        phaseId: 'bg_ph1', bugs: 0, statusEffects: [],
        skillPointReward: 5,
      } as TaskCard,
    ],
  },
  {
    id: 'bg_ph2',
    name: '開発',
    tasks: [
      {
        id: 'bg_dev', type: 'task',
        name: 'システム開発', description: 'メイン機能の実装',
        requiredSkill: 'backend', effortTotal: 50, effortDone: 0,
        difficulty: 1, qualityImpact: 15, blockedBy: ['bg_req'], status: 'locked',
        phaseId: 'bg_ph2', bugs: 0, statusEffects: [],
        skillPointReward: 8,
      } as TaskCard,
    ],
  },
  {
    id: 'bg_ph3',
    name: 'テスト・リリース',
    tasks: [
      {
        id: 'bg_test', type: 'task',
        name: 'テスト・リリース', description: '品質確認と本番公開',
        requiredSkill: 'qa', effortTotal: 30, effortDone: 0,
        difficulty: 1, qualityImpact: 20, blockedBy: ['bg_dev'], status: 'locked',
        phaseId: 'bg_ph3', bugs: 0, statusEffects: [],
        skillPointReward: 5,
      } as TaskCard,
    ],
  },
]

// ── 標準シナリオ：小規模案件 ───────────────────────────────
const SMALL_PROJECT_PHASES: WBSPhase[] = [
  {
    id: 'ph1',
    name: '設計',
    tasks: [
      {
        id: 's_req', type: 'task', name: '要件定義', description: '',
        requiredSkill: 'general', effortTotal: 20, effortDone: 0,
        difficulty: 1, qualityImpact: 5, blockedBy: [], status: 'ready',
        phaseId: 'ph1', bugs: 0, statusEffects: [], skillPointReward: 5,
      } as TaskCard,
      {
        id: 's_design', type: 'task', name: '基本設計', description: '',
        requiredSkill: 'backend', effortTotal: 40, effortDone: 0,
        difficulty: 2, qualityImpact: 8, blockedBy: ['s_req'], status: 'locked',
        phaseId: 'ph1', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
    ],
  },
  {
    id: 'ph2',
    name: '開発',
    tasks: [
      {
        id: 's_api', type: 'task', name: 'API開発', description: '',
        requiredSkill: 'backend', effortTotal: 80, effortDone: 0,
        difficulty: 2, qualityImpact: 15, blockedBy: ['s_design'], status: 'locked',
        phaseId: 'ph2', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
      {
        id: 's_ui', type: 'task', name: '画面実装', description: '',
        requiredSkill: 'frontend', effortTotal: 70, effortDone: 0,
        difficulty: 2, qualityImpact: 12, blockedBy: ['s_design'], status: 'locked',
        phaseId: 'ph2', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
      {
        id: 's_db', type: 'task', name: 'DB構築', description: '',
        requiredSkill: 'backend', effortTotal: 40, effortDone: 0,
        difficulty: 1, qualityImpact: 10, blockedBy: ['s_design'], status: 'locked',
        phaseId: 'ph2', bugs: 0, statusEffects: [], skillPointReward: 8,
      } as TaskCard,
    ],
  },
  {
    id: 'ph3',
    name: 'テスト・リリース',
    tasks: [
      {
        id: 's_test', type: 'task', name: '結合テスト', description: '',
        requiredSkill: 'qa', effortTotal: 50, effortDone: 0,
        difficulty: 1, qualityImpact: 20, blockedBy: ['s_api', 's_ui', 's_db'], status: 'locked',
        phaseId: 'ph3', bugs: 0, statusEffects: [], skillPointReward: 5,
      } as TaskCard,
      {
        id: 's_release', type: 'task', name: 'リリース', description: '',
        requiredSkill: 'infra', effortTotal: 30, effortDone: 0,
        difficulty: 1, qualityImpact: 10, blockedBy: ['s_test'], status: 'locked',
        phaseId: 'ph3', bugs: 0, statusEffects: [], skillPointReward: 5,
      } as TaskCard,
    ],
  },
]

// ── 困難シナリオ：炎上案件 ────────────────────────────────
const HELL_PROJECT_PHASES: WBSPhase[] = [
  {
    id: 'hp1',
    name: '緊急対応',
    tasks: [
      {
        id: 'h_bug1', type: 'task', name: '重大バグ修正#1', description: 'Prd環境が落ちている',
        requiredSkill: 'backend', effortTotal: 60, effortDone: 0,
        difficulty: 3, qualityImpact: 10, blockedBy: [], status: 'ready',
        phaseId: 'hp1', bugs: 3, statusEffects: [{ type: 'fire', remainingTurns: -1 }],
        skillPointReward: 15,
      } as TaskCard,
      {
        id: 'h_bug2', type: 'task', name: '重大バグ修正#2', description: 'データが消えている',
        requiredSkill: 'backend', effortTotal: 80, effortDone: 0,
        difficulty: 3, qualityImpact: 10, blockedBy: [], status: 'ready',
        phaseId: 'hp1', bugs: 5, statusEffects: [{ type: 'fire', remainingTurns: -1 }],
        skillPointReward: 15,
      } as TaskCard,
      {
        id: 'h_infra', type: 'task', name: 'インフラ緊急対応', description: 'サーバーが限界',
        requiredSkill: 'infra', effortTotal: 40, effortDone: 0,
        difficulty: 2, qualityImpact: 5, blockedBy: [], status: 'ready',
        phaseId: 'hp1', bugs: 1, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
    ],
  },
  {
    id: 'hp2',
    name: '安定化',
    tasks: [
      {
        id: 'h_refactor', type: 'task', name: 'コードリファクタリング', description: '負債を返済する',
        requiredSkill: 'backend', effortTotal: 100, effortDone: 0,
        difficulty: 3, qualityImpact: 25, blockedBy: ['h_bug1', 'h_bug2'], status: 'locked',
        phaseId: 'hp2', bugs: 0, statusEffects: [], skillPointReward: 15,
      } as TaskCard,
      {
        id: 'h_test', type: 'task', name: 'テスト整備', description: 'テストを書いていなかった',
        requiredSkill: 'qa', effortTotal: 80, effortDone: 0,
        difficulty: 2, qualityImpact: 20, blockedBy: ['h_bug1', 'h_bug2'], status: 'locked',
        phaseId: 'hp2', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
    ],
  },
]

// ── 大規模シナリオ：ECサイト開発 ──────────────────────────
const LARGE_EC_PHASES: WBSPhase[] = [
  {
    id: 'ec_ph1',
    name: '要件・設計',
    tasks: [
      {
        id: 'ec_req', type: 'task', name: '要件定義', description: 'EC全体の要件を固める',
        requiredSkill: 'general', effortTotal: 40, effortDone: 0,
        difficulty: 2, qualityImpact: 8, blockedBy: [], status: 'ready',
        phaseId: 'ec_ph1', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
      {
        id: 'ec_ui_design', type: 'task', name: 'UI設計', description: '画面設計・ワイヤーフレーム',
        requiredSkill: 'design', effortTotal: 50, effortDone: 0,
        difficulty: 2, qualityImpact: 10, blockedBy: ['ec_req'], status: 'locked',
        phaseId: 'ec_ph1', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
      {
        id: 'ec_db_design', type: 'task', name: 'DB設計', description: 'データモデル設計',
        requiredSkill: 'backend', effortTotal: 60, effortDone: 0,
        difficulty: 2, qualityImpact: 12, blockedBy: ['ec_req'], status: 'locked',
        phaseId: 'ec_ph1', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
      {
        id: 'ec_arch', type: 'task', name: 'アーキテクチャ設計', description: 'マイクロサービス設計',
        requiredSkill: 'infra', effortTotal: 70, effortDone: 0,
        difficulty: 3, qualityImpact: 15, blockedBy: ['ec_req'], status: 'locked',
        phaseId: 'ec_ph1', bugs: 0, statusEffects: [], skillPointReward: 15,
      } as TaskCard,
    ],
  },
  {
    id: 'ec_ph2',
    name: '開発（並行）',
    tasks: [
      {
        id: 'ec_auth_api', type: 'task', name: '認証API', description: 'ログイン・会員管理API',
        requiredSkill: 'backend', effortTotal: 80, effortDone: 0,
        difficulty: 2, qualityImpact: 12, blockedBy: ['ec_db_design', 'ec_arch'], status: 'locked',
        phaseId: 'ec_ph2', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
      {
        id: 'ec_product_api', type: 'task', name: '商品API', description: '商品・カテゴリ管理API',
        requiredSkill: 'backend', effortTotal: 90, effortDone: 0,
        difficulty: 2, qualityImpact: 12, blockedBy: ['ec_db_design', 'ec_arch'], status: 'locked',
        phaseId: 'ec_ph2', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
      {
        id: 'ec_order_api', type: 'task', name: '注文API', description: '注文フロー・在庫管理API',
        requiredSkill: 'backend', effortTotal: 100, effortDone: 0,
        difficulty: 3, qualityImpact: 15, blockedBy: ['ec_db_design', 'ec_arch'], status: 'locked',
        phaseId: 'ec_ph2', bugs: 0, statusEffects: [], skillPointReward: 15,
      } as TaskCard,
      {
        id: 'ec_payment_api', type: 'task', name: '決済API', description: '決済ゲートウェイ連携',
        requiredSkill: 'backend', effortTotal: 120, effortDone: 0,
        difficulty: 3, qualityImpact: 18, blockedBy: ['ec_order_api'], status: 'locked',
        phaseId: 'ec_ph2', bugs: 0, statusEffects: [], skillPointReward: 15,
      } as TaskCard,
      {
        id: 'ec_front_base', type: 'task', name: 'フロント基盤', description: 'フレームワーク・ルーティング',
        requiredSkill: 'frontend', effortTotal: 70, effortDone: 0,
        difficulty: 2, qualityImpact: 10, blockedBy: ['ec_ui_design', 'ec_arch'], status: 'locked',
        phaseId: 'ec_ph2', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
      {
        id: 'ec_product_page', type: 'task', name: '商品ページ', description: '商品一覧・詳細ページ',
        requiredSkill: 'frontend', effortTotal: 80, effortDone: 0,
        difficulty: 2, qualityImpact: 12, blockedBy: ['ec_front_base', 'ec_product_api'], status: 'locked',
        phaseId: 'ec_ph2', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
      {
        id: 'ec_cart_ui', type: 'task', name: 'カートUI', description: 'カート・チェックアウト画面',
        requiredSkill: 'frontend', effortTotal: 90, effortDone: 0,
        difficulty: 2, qualityImpact: 14, blockedBy: ['ec_front_base', 'ec_order_api'], status: 'locked',
        phaseId: 'ec_ph2', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
      {
        id: 'ec_admin', type: 'task', name: '管理画面', description: '管理者向けダッシュボード',
        requiredSkill: 'frontend', effortTotal: 100, effortDone: 0,
        difficulty: 3, qualityImpact: 10, blockedBy: ['ec_front_base', 'ec_product_api'], status: 'locked',
        phaseId: 'ec_ph2', bugs: 0, statusEffects: [], skillPointReward: 15,
      } as TaskCard,
    ],
  },
  {
    id: 'ec_ph3',
    name: '結合・負荷テスト・リリース',
    tasks: [
      {
        id: 'ec_int_test', type: 'task', name: '結合テスト', description: '全API・UIの統合テスト',
        requiredSkill: 'qa', effortTotal: 100, effortDone: 0,
        difficulty: 3, qualityImpact: 20,
        blockedBy: ['ec_auth_api', 'ec_product_api', 'ec_order_api', 'ec_payment_api', 'ec_cart_ui', 'ec_admin'],
        status: 'locked', phaseId: 'ec_ph3', bugs: 0, statusEffects: [], skillPointReward: 15,
      } as TaskCard,
      {
        id: 'ec_load_test', type: 'task', name: '負荷テスト', description: 'トラフィック耐性確認',
        requiredSkill: 'infra', effortTotal: 80, effortDone: 0,
        difficulty: 3, qualityImpact: 15, blockedBy: ['ec_int_test'], status: 'locked',
        phaseId: 'ec_ph3', bugs: 0, statusEffects: [], skillPointReward: 15,
      } as TaskCard,
      {
        id: 'ec_release', type: 'task', name: '本番リリース', description: '本番環境へのデプロイ',
        requiredSkill: 'infra', effortTotal: 50, effortDone: 0,
        difficulty: 2, qualityImpact: 10, blockedBy: ['ec_load_test'], status: 'locked',
        phaseId: 'ec_ph3', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
    ],
  },
]

// ── マルチプロジェクト用シナリオ：Webシステム ────────────
const MULTI_WEB_PHASES: WBSPhase[] = [
  {
    id: 'mw_ph1',
    name: '設計・開発',
    tasks: [
      {
        id: 'mw_req', type: 'task', name: '要件定義', description: '',
        requiredSkill: 'general', effortTotal: 20, effortDone: 0,
        difficulty: 1, qualityImpact: 5, blockedBy: [], status: 'ready',
        phaseId: 'mw_ph1', bugs: 0, statusEffects: [], skillPointReward: 5,
      } as TaskCard,
      {
        id: 'mw_api', type: 'task', name: 'API開発', description: '',
        requiredSkill: 'backend', effortTotal: 70, effortDone: 0,
        difficulty: 2, qualityImpact: 12, blockedBy: ['mw_req'], status: 'locked',
        phaseId: 'mw_ph1', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
      {
        id: 'mw_ui', type: 'task', name: 'UI実装', description: '',
        requiredSkill: 'frontend', effortTotal: 60, effortDone: 0,
        difficulty: 2, qualityImpact: 10, blockedBy: ['mw_req'], status: 'locked',
        phaseId: 'mw_ph1', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
    ],
  },
  {
    id: 'mw_ph2',
    name: 'テスト・リリース',
    tasks: [
      {
        id: 'mw_test', type: 'task', name: '結合テスト', description: '',
        requiredSkill: 'qa', effortTotal: 40, effortDone: 0,
        difficulty: 1, qualityImpact: 15, blockedBy: ['mw_api', 'mw_ui'], status: 'locked',
        phaseId: 'mw_ph2', bugs: 0, statusEffects: [], skillPointReward: 5,
      } as TaskCard,
      {
        id: 'mw_release', type: 'task', name: 'リリース', description: '',
        requiredSkill: 'infra', effortTotal: 25, effortDone: 0,
        difficulty: 1, qualityImpact: 8, blockedBy: ['mw_test'], status: 'locked',
        phaseId: 'mw_ph2', bugs: 0, statusEffects: [], skillPointReward: 5,
      } as TaskCard,
    ],
  },
]

// ── マルチプロジェクト用シナリオ：モバイルアプリ ──────────
const MULTI_MOBILE_PHASES: WBSPhase[] = [
  {
    id: 'mm_ph1',
    name: 'アプリ設計・開発',
    tasks: [
      {
        id: 'mm_req', type: 'task', name: '要件定義', description: '',
        requiredSkill: 'general', effortTotal: 20, effortDone: 0,
        difficulty: 1, qualityImpact: 5, blockedBy: [], status: 'ready',
        phaseId: 'mm_ph1', bugs: 0, statusEffects: [], skillPointReward: 5,
      } as TaskCard,
      {
        id: 'mm_ui_design', type: 'task', name: 'UIデザイン', description: '',
        requiredSkill: 'design', effortTotal: 50, effortDone: 0,
        difficulty: 2, qualityImpact: 10, blockedBy: ['mm_req'], status: 'locked',
        phaseId: 'mm_ph1', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
      {
        id: 'mm_front', type: 'task', name: 'モバイル画面実装', description: '',
        requiredSkill: 'frontend', effortTotal: 80, effortDone: 0,
        difficulty: 2, qualityImpact: 15, blockedBy: ['mm_ui_design'], status: 'locked',
        phaseId: 'mm_ph1', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
      {
        id: 'mm_api', type: 'task', name: 'バックエンドAPI', description: '',
        requiredSkill: 'backend', effortTotal: 65, effortDone: 0,
        difficulty: 2, qualityImpact: 12, blockedBy: ['mm_req'], status: 'locked',
        phaseId: 'mm_ph1', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
    ],
  },
  {
    id: 'mm_ph2',
    name: 'テスト・申請',
    tasks: [
      {
        id: 'mm_test', type: 'task', name: 'QAテスト', description: '',
        requiredSkill: 'qa', effortTotal: 50, effortDone: 0,
        difficulty: 2, qualityImpact: 18, blockedBy: ['mm_front', 'mm_api'], status: 'locked',
        phaseId: 'mm_ph2', bugs: 0, statusEffects: [], skillPointReward: 10,
      } as TaskCard,
      {
        id: 'mm_submit', type: 'task', name: 'ストア申請', description: '',
        requiredSkill: 'general', effortTotal: 20, effortDone: 0,
        difficulty: 1, qualityImpact: 5, blockedBy: ['mm_test'], status: 'locked',
        phaseId: 'mm_ph2', bugs: 0, statusEffects: [], skillPointReward: 5,
      } as TaskCard,
    ],
  },
]

export const SCENARIOS: ProjectScenario[] = [
  {
    id: 'tutorial',
    name: 'はじめての案件',
    description: '小規模なWebアプリ開発。チュートリアル。',
    difficulty: 'easy',
    phases: TUTORIAL_PHASES,
    totalTurns: 10,
    budget: 1200,
    qualityMin: 20,
    modeId: 'tutorial',
    requiredSkills: [],
  },
  {
    id: 'beginner',
    name: 'はじめてのプロジェクト',
    description: '3タスク・15ターンの入門案件。ゆとりの予算でPMの流れを体験しよう。',
    difficulty: 'easy',
    phases: BEGINNER_PHASES,
    totalTurns: 15,
    budget: 2000,
    qualityMin: 15,
    modeId: 'beginner',
    requiredSkills: [],
  },
  {
    id: 'small',
    name: '小規模Webシステム',
    description: '3ヶ月の小規模開発。標準的な構成。',
    difficulty: 'normal',
    phases: SMALL_PROJECT_PHASES,
    totalTurns: 15,
    budget: 2500,
    qualityMin: 50,
    modeId: 'standard',
    requiredSkills: [],
  },
  {
    id: 'hell',
    name: '炎上プロジェクト救済',
    description: '既に炎上中のプロジェクトを引き継いだ。安定化せよ。',
    difficulty: 'hell',
    phases: HELL_PROJECT_PHASES,
    totalTurns: 10,
    budget: 900,
    qualityMin: 40,
    modeId: 'crisis',
    requiredSkills: ['code_review'],
  },
  {
    id: 'large_ec',
    name: '大規模ECサイト開発',
    description: '15タスクの大型ECサイト。設計から負荷テストまで完遂せよ。',
    difficulty: 'hard',
    phases: LARGE_EC_PHASES,
    totalTurns: 18,
    budget: 3000,
    qualityMin: 60,
    modeId: 'large_scale',
    requiredSkills: ['code_review', 'risk_identification'],
  },
  {
    id: 'multi_web',
    name: '社内Webシステム',
    description: '並行プロジェクトのひとつ。Webシステム開発。',
    difficulty: 'normal',
    phases: MULTI_WEB_PHASES,
    totalTurns: 12,
    budget: 900,
    qualityMin: 50,
    modeId: 'multi_project',
    requiredSkills: [],
  },
  {
    id: 'multi_mobile',
    name: 'モバイルアプリ',
    description: '並行プロジェクトのひとつ。スマホアプリ開発。',
    difficulty: 'normal',
    phases: MULTI_MOBILE_PHASES,
    totalTurns: 12,
    budget: 1000,
    qualityMin: 50,
    modeId: 'multi_project',
    requiredSkills: [],
  },
]

// モードIDで対応するシナリオを取得
export function getScenariosForMode(modeId: string): ProjectScenario[] {
  if (modeId === 'tutorial') return SCENARIOS.filter(s => s.id === 'tutorial')
  if (modeId === 'beginner') return SCENARIOS.filter(s => s.id === 'beginner')
  if (modeId === 'standard') return SCENARIOS.filter(s => s.id === 'small')
  if (modeId === 'crisis') return SCENARIOS.filter(s => s.id === 'hell')
  if (modeId === 'large_scale') return SCENARIOS.filter(s => s.id === 'large_ec')
  if (modeId === 'multi_project') return SCENARIOS.filter(s => s.modeId === 'multi_project')
  if (modeId === 'expert') return SCENARIOS.filter(s => s.id === 'large_ec')
  return SCENARIOS.filter(s => s.id === 'small')
}
