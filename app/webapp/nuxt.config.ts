// https://nuxt.com/docs/api/configuration/nuxt-config

import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  app: {
    head: {
      title: 'Golf Course Application',
      templateParams: {
        separator: '-',
      },
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
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
    '@nuxt/test-utils/module',
  ],
  runtimeConfig: {
    golfCourseApiKey: process.env.GOLF_COURSE_API_KEY ?? '',
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
