import type {PlanStatus} from '~~/shared/types/plan'
import type {DaySlot} from '~~/shared/constants/notifications'

// Своё напоминание о сроке цели или этапа. null — по общим настройкам.
// «Просрочено» всегда по общим настройкам — одно правило для всех целей
export interface GoalRemind {
    daysBefore: number   // «скоро срок» — за сколько дней
    soonSlot: DaySlot    // в какое время дня «скоро срок»
    daySlot: DaySlot     // в какое время дня в день срока
}

export interface GoalStepItem {
    id: string
    goalId: string
    title: string
    description: string | null
    comment: string | null
    status: PlanStatus
    dueDate: string | null      // 'YYYY-MM-DD'
    remind: GoalRemind | null
    position: number
}

export interface GoalProgress {
    total: number
    done: number
    partial: number
}

export interface GoalListItem extends GoalProgress {
    id: string
    title: string
    description: string | null
    dueDate: string | null
    remind: GoalRemind | null
    position: number
}

export interface GoalItem extends GoalListItem {
    steps: GoalStepItem[]
}
