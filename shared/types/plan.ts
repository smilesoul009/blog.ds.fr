export type PlanStatus = 'TODO' | 'DONE' | 'PARTIAL'

export interface PlanTaskItem {
    id: string
    scope: 'TWO_YEARS' | 'THREE_YEARS' | 'YEAR' | 'MONTH' | 'WEEK' | 'DAY'
    periodStart: string
    position: number
    title: string
    description: string | null
    comment: string | null
    moveCount: number
    status: PlanStatus
    day: string | null
    startMin: number | null
    endMin: number | null
    movedAt: string | null
    movedTo: { scope: 'TWO_YEARS' | 'THREE_YEARS' | 'YEAR' | 'MONTH' | 'WEEK' | 'DAY'; periodStart: string; day: string | null } | null
    movedToId: string | null
}

export type PlanAction =
    | { kind: 'copy'; to: 'next' | 'date' }   // перенос убран (2.0) — только копия
    | { kind: 'status'; status: PlanStatus }  // меню задачи плана недели: «Выполнено», «Частично» (повторно — снять)
    | { kind: 'delete' }