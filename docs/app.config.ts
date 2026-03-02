export default defineAppConfig({
  docus: {
    title: 'ODX',
    description: 'OData Developer Experience: The modern ecosystem for SAP OData integration.',
    image: 'https://odx-js.com/cover.png',
    socials: {
      github: 'janfrl/odx-js'
    },
    aside: {
      level: 1,
      collapsed: false,
      exclude: []
    },
    header: {
      logo: false,
      showLinkIcon: true,
      exclude: [],
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
