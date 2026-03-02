export default defineAppConfig({
  docus: {
    title: 'ODX',
    description: 'OData Developer Experience: The modern ecosystem for SAP OData integration.',
    image: 'https://odx-js.io/cover.png',
    socials: {
      github: 'janfrl/odx-js'
    },
    aside: {
      level: 0,
      collapsed: false,
      exclude: []
    },
    header: {
      logo: false,
      showLinkIcon: true,
      // Exclude content folders from top nav
      exclude: ['/getting-started', '/nuxt', '/proxy', '/explorer', '/core', '/guides', '/community'],
      fluid: true
    },
    footer: {
      credits: {
        icon: 'i-lucide-box',
        text: 'ODX Ecosystem',
        href: 'https://github.com/janfrl/odx-js'
      }
    }
  }
})
