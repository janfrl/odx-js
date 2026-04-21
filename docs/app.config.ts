export default defineAppConfig({
  docus: {
    title: 'ODX',
    description: 'OData Developer Experience: The modern ecosystem for OData integration.',
    image: 'https://odx-js.io/cover.png',
    socials: {
      github: 'janfrl/odx-js',
    },
    aside: {
      level: 0,
      collapsed: false,
      exclude: [],
    },
    header: {
      logo: false,
      showLinkIcon: true,
      exclude: ['/tutorials', '/how-to', '/reference', '/explanation', '/community'],
      fluid: true,
    },
    footer: {
      credits: {
        icon: 'i-lucide-box',
        text: 'ODX Ecosystem',
        href: 'https://github.com/janfrl/odx-js',
      },
    },
  },
  ui: {
    pageHero: {
      slots: {
        title: 'font-semibold sm:text-6xl',
        container: '!pb-0',
      },
    },
    pageCard: {
      slots: {
        container: 'min-w-0',
      },
    },
    pageSection: {
      slots: {
        container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16',
      },
    },
  },
})
