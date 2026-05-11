// https://nuxt.com/docs/api/configuration/nuxt-config

import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  app: {
    head: {
      title: 'Golf Course Application',
      templateParams: {
        separator: '-',
      },
    },
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  eslint: {
    config: {
      nuxt: {
        sortConfigKeys: false,
      },
      stylistic: true,
    },
  },
  modules: [
    '@nuxt/eslint',
  ],
  runtimeConfig: {
    golfCourseApiKey: process.env.GOLF_COURSE_API_KEY,
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ],
    },
  },
})
