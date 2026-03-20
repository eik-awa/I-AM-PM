import type { ProjectScenario } from '../types/game'
import type { TaskCard, WBSPhase } from '../types'

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
      } as TaskCard,
      {
        id: 't_design', type: 'task',
        name: '基本設計', description: 'システムの骨格を設計する',
        requiredSkill: 'backend', effortTotal: 40, effortDone: 0,
        difficulty: 2, qualityImpact: 8, blockedBy: ['t_requirements'], status: 'ready',
        phaseId: 'phase_planning', bugs: 0, statusEffects: [],
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
      } as TaskCard,
      {
        id: 't_ui', type: 'task',
        name: '画面実装', description: 'フロントエンドの実装',
        requiredSkill: 'frontend', effortTotal: 70, effortDone: 0,
        difficulty: 2, qualityImpact: 12, blockedBy: ['t_design'], status: 'locked',
        phaseId: 'phase_dev', bugs: 0, statusEffects: [],
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
        phaseId: 'ph1', bugs: 0, statusEffects: [],
      } as TaskCard,
      {
        id: 's_design', type: 'task', name: '基本設計', description: '',
        requiredSkill: 'backend', effortTotal: 40, effortDone: 0,
        difficulty: 2, qualityImpact: 8, blockedBy: ['s_req'], status: 'locked',
        phaseId: 'ph1', bugs: 0, statusEffects: [],
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
        phaseId: 'ph2', bugs: 0, statusEffects: [],
      } as TaskCard,
      {
        id: 's_ui', type: 'task', name: '画面実装', description: '',
        requiredSkill: 'frontend', effortTotal: 70, effortDone: 0,
        difficulty: 2, qualityImpact: 12, blockedBy: ['s_design'], status: 'locked',
        phaseId: 'ph2', bugs: 0, statusEffects: [],
      } as TaskCard,
      {
        id: 's_db', type: 'task', name: 'DB構築', description: '',
        requiredSkill: 'infra', effortTotal: 50, effortDone: 0,
        difficulty: 2, qualityImpact: 10, blockedBy: ['s_design'], status: 'locked',
        phaseId: 'ph2', bugs: 0, statusEffects: [],
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
        phaseId: 'ph3', bugs: 0, statusEffects: [],
      } as TaskCard,
      {
        id: 's_release', type: 'task', name: 'リリース', description: '',
        requiredSkill: 'infra', effortTotal: 30, effortDone: 0,
        difficulty: 1, qualityImpact: 10, blockedBy: ['s_test'], status: 'locked',
        phaseId: 'ph3', bugs: 0, statusEffects: [],
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
      } as TaskCard,
      {
        id: 'h_bug2', type: 'task', name: '重大バグ修正#2', description: 'データが消えている',
        requiredSkill: 'backend', effortTotal: 80, effortDone: 0,
        difficulty: 3, qualityImpact: 10, blockedBy: [], status: 'ready',
        phaseId: 'hp1', bugs: 5, statusEffects: [{ type: 'fire', remainingTurns: -1 }],
      } as TaskCard,
      {
        id: 'h_infra', type: 'task', name: 'インフラ緊急対応', description: 'サーバーが限界',
        requiredSkill: 'infra', effortTotal: 40, effortDone: 0,
        difficulty: 2, qualityImpact: 5, blockedBy: [], status: 'ready',
        phaseId: 'hp1', bugs: 1, statusEffects: [],
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
        phaseId: 'hp2', bugs: 0, statusEffects: [],
      } as TaskCard,
      {
        id: 'h_test', type: 'task', name: 'テスト整備', description: 'テストを書いていなかった',
        requiredSkill: 'qa', effortTotal: 80, effortDone: 0,
        difficulty: 2, qualityImpact: 20, blockedBy: ['h_bug1', 'h_bug2'], status: 'locked',
        phaseId: 'hp2', bugs: 0, statusEffects: [],
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
    totalTurns: 8,
    budget: 800,
    qualityMin: 30,
  },
  {
    id: 'small',
    name: '小規模Webシステム',
    description: '3ヶ月の小規模開発。標準的な構成。',
    difficulty: 'normal',
    phases: SMALL_PROJECT_PHASES,
    totalTurns: 10,
    budget: 1000,
    qualityMin: 50,
  },
  {
    id: 'hell',
    name: '炎上プロジェクト救済',
    description: '既に炎上中のプロジェクトを引き継いだ。4ターン以内に安定化せよ。',
    difficulty: 'hell',
    phases: HELL_PROJECT_PHASES,
    totalTurns: 6,
    budget: 600,
    qualityMin: 40,
  },
]
