import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'

import '@shikijs/twoslash/style-rich.css'
import 'floating-vue/dist/style.css'
import '@shikijs/vitepress-twoslash/style-core.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(TwoslashFloatingVue, {
    themes: {
      twoslash: {
        zIndex: 1000,
      },
    },
  })
})
