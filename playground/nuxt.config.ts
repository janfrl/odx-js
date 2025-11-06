export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  odata: {
    services: [
      {
        name: 'DummyService',
        edmx: 'edmx/dummy.edmx',
        route: 'dummy',
      },
    ],
  },
})
