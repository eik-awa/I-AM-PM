import type { GameModeConfig, GameMode } from '../types/game'

export const GAME_MODES: GameModeConfig[] = [
  {
    id: 'tutorial' as GameMode,
    name: 'チュートリアル',
    description: '27ステップのガイドでゲームの流れを学ぶ。操作方法・WBS・カードの使い方を体験。',
    requiredSkills: [],
    maxProjects: 1,
    teamSizeMin: 1,
    isUnlocked: () => true,
    missionIds: [],
    unlocksCharacters: [],
  },
  {
    id: 'beginner' as GameMode,
    name: '入門モード',
    description: 'はじめての案件管理。3タスク・15ターン・ゆとりの予算でPMの基本を体感しよう。',
    requiredSkills: [],
    maxProjects: 1,
    teamSizeMin: 1,
    isUnlocked: () => true,
    missionIds: ['complete_game', 'quality_guardian', 'budget_saver'],
    unlocksCharacters: ['p_suzuki'],
  },
  {
    id: 'standard' as GameMode,
    name: '標準モード',
    description: '小規模Webシステムの開発をリードせよ。スキル・予算・品質のバランスが問われる定番モード。',
    requiredSkills: [],
    maxProjects: 1,
    teamSizeMin: 2,
    isUnlocked: () => true,
    missionIds: ['complete_game', 'high_quality', 'speed_runner'],
    unlocksCharacters: ['p_kimura'],
  },
  {
    id: 'crisis' as GameMode,
    name: '炎上救済モード',
    description: '既に炎上中のプロジェクトを引き継いだ。コードレビューのスキルが必須。火を消せるか？',
    requiredSkills: ['code_review'],
    maxProjects: 1,
    teamSizeMin: 3,
    isUnlocked: (skills: string[]) => skills.includes('code_review'),
    missionIds: ['complete_game', 'bug_free', 'quality_guardian'],
    unlocksCharacters: ['p_takahashi'],
  },
  {
    id: 'large_scale' as GameMode,
    name: '大規模開発モード',
    description: '15タスク・18ターンの大型ECサイト開発。リスク管理とレビューが生死を分ける。',
    requiredSkills: ['code_review', 'risk_identification'],
    maxProjects: 1,
    teamSizeMin: 4,
    isUnlocked: (skills: string[]) =>
      skills.includes('code_review') && skills.includes('risk_identification'),
    missionIds: ['complete_game', 'budget_master', 'full_team'],
    unlocksCharacters: ['p_matsumoto'],
  },
  {
    id: 'multi_project' as GameMode,
    name: '複数案件モード',
    description: '2〜3案件を同時進行する修羅場。リソース配分の妙が問われる上級者向けモード。',
    requiredSkills: ['task_management', 'code_review', 'one_on_one', 'risk_identification'],
    maxProjects: 3,
    teamSizeMin: 5,
    isUnlocked: (skills: string[]) =>
      ['task_management', 'code_review', 'one_on_one', 'risk_identification'].every(s =>
        skills.includes(s)
      ),
    missionIds: ['complete_game', 'productive_week', 'budget_master'],
    unlocksCharacters: ['p_fl_fujiwara'],
  },
  {
    id: 'expert' as GameMode,
    name: 'エキスパートモード',
    description: '3プロジェクト大規模同時進行。Tier2スキル必須。真のPMとしての実力が試される最高難度。',
    requiredSkills: ['resource_optimization', 'cicd', 'contingency', 'team_building'],
    maxProjects: 3,
    teamSizeMin: 6,
    isUnlocked: (skills: string[]) =>
      ['resource_optimization', 'cicd', 'contingency', 'team_building'].every(s =>
        skills.includes(s)
      ),
    missionIds: ['complete_game', 'speed_runner', 'bug_free'],
    unlocksCharacters: ['p_god_engineer'],
  },
]

export const DIFFICULTY_STARS: Record<string, number> = {
  tutorial: 1,
  beginner: 1,
  standard: 2,
  crisis: 3,
  large_scale: 4,
  multi_project: 4,
  expert: 5,
}
