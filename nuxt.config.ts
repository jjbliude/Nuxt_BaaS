// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint", "@nuxt/ui", "@nuxtjs/supabase"],
  css: ["~/assets/css/chat.css"],
  // 暂时禁用重定向，方便我们前期开发调试
  supabase: {
    redirect: false,
  },
});
