import { defineNuxtConfig } from 'nuxt/config'
import ODataModule from '../../src/module'

export default defineNuxtConfig({
  compatibilityDate: '2026-03-17',

  modules: [
    [ODataModule, {
      devtools: {
        enabled: false,
      },
      services: [
        {
          name: 'MinimalLocal',
          url: 'edmx/minimal.edmx',
          route: 'minimal',
        },
      ],
    }],
  ],
})
