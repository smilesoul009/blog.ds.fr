import type {PlanScopeKey} from '~~/shared/utils/planDates'

export function usePlanScope() {
    return useCookie<PlanScopeKey>('plan-scope', {
        default: () => 'day',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
    })
}