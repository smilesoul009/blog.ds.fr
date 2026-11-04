import type { NavItem } from '~~/shared/constants/navigation'
import { PLAN_NAVIGATION, PLAN_SECTION, STAFF_NAVIGATION, SETTINGS_NAVIGATION } from '~~/shared/constants/navigation'
import {usePermissions} from "~~/composables/usePermissions.ts";

export function useNavigation() {
    const { can } = usePermissions()
    const route = useRoute()

    function filter(items: NavItem[]) {
        return items.filter(item => !item.permission || can(item.permission))
    }

    const mainItems = computed(() => filter(STAFF_NAVIGATION))
    const settingsItems = computed(() => filter(SETTINGS_NAVIGATION))

    const inSettings = computed(() =>
        settingsItems.value.some(
            item => route.path === item.to || route.path.startsWith(`${item.to}/`),
        ),
    )

    const settingsEntry = computed(() => settingsItems.value[0]?.to ?? null)

    // Раздел «План»: боковое меню «Планы / Цели»
    const planItems = computed(() => filter(PLAN_NAVIGATION))
    const inPlan = computed(() => planItems.value.length > 0
        && PLAN_SECTION.some(p => route.path === p || route.path.startsWith(`${p}/`)))

    return { mainItems, settingsItems, inSettings, settingsEntry, planItems, inPlan }
}