export type MissionConditionType =
  | 'complete_game'              // ゲームをクリアする
  | 'quality_above_on_win'       // クリア時に品質N以上
  | 'finish_within_turn_percent' // 規定ターン数のN%以内でクリア
  | 'budget_under_percent'       // 予算のN%以内でクリア
  | 'max_bugs_on_win'            // クリア時にバグN個以下
  | 'tasks_in_one_turn'          // 1ターンでN個以上タスク完了
  | 'simultaneous_personnel'     // N人以上同時稼働

export interface MissionDef {
  id: string
  name: string
  description: string
  reward: number // PM Points
  conditionType: MissionConditionType
  conditionValue?: number
  displayTarget: string // 表示用目標テキスト
}

export interface Mission extends MissionDef {
  status: 'active' | 'completed' | 'failed'
  progress: number  // 0-100 (%)
}
