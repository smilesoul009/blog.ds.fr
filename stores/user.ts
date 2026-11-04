export const useUserStore = defineStore('user', () => {
  const user = ref<AuthUser | null>(null)
  const checked = ref(false)
  const isAuthenticated = computed(() => !!user.value)

  function setUser(data: AuthUser | null) {
    user.value = data
    checked.value = true
  }

  async function fetchUser() {
    if (checked.value) return

    try {
      const data = await useApi()<AuthUser>('/api/auth/me')
      setUser(data)
    } catch {
      setUser(null)
    }
  }

  async function login(username: string, password: string) {
    const data = await useApi()<AuthUser>('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    })
    setUser(data)
    return data
  }

  async function logout() {
    await useApi()('/api/auth/logout', { method: 'POST' })
    setUser(null)
    await navigateTo('/login')
  }

  /** Войти в режим просмотра; returnTo — куда вернуться после выхода */
  async function startViewAs(userId: string, returnTo: string) {
    const res = await useApi()<{ isClient: boolean }>(`/api/admin/view-as/${userId}`, { method: 'POST' })
    try { localStorage.setItem('viewAsReturnTo', returnTo) } catch {}
    // Полная перезагрузка — чтобы на экране не осталось данных администратора
    window.location.href = res.isClient ? '/cabinet' : '/dashboard'
  }

  async function stopViewAs() {
    await useApi()('/api/auth/view-as/stop', { method: 'POST' })
    let back = '/users'
    try {
      back = localStorage.getItem('viewAsReturnTo') || back
      localStorage.removeItem('viewAsReturnTo')
    } catch {}
    window.location.href = back
  }

  return { user, isAuthenticated, setUser, fetchUser, login, logout, startViewAs, stopViewAs }
})