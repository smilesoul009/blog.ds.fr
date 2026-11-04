import { useUserStore } from '~~/stores/user'
import {type Permission, permissionsFor} from "~~/shared/constants/permissions";

export function usePermissions() {
  const { user } = storeToRefs(useUserStore())

  const permissions = computed(() => permissionsFor(user.value?.roles ?? []))

  function can(permission: Permission) {
    return permissions.value.has(permission)
  }

  return { can, permissions }
}
