export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  // 如果用户未登录，且访问的不是登录或注册页面，则重定向到登录页
  if (!user.value && to.path !== '/login' && to.path !== '/register') {
    return navigateTo('/login')
  }

  // 如果用户已登录，且访问的是登录或注册页面，则重定向到主页
  if (user.value && (to.path === '/login' || to.path === '/register')) {
    return navigateTo('/')
  }
})
