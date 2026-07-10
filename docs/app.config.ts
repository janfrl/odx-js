export default defineAppConfig({
  navigation: {
    sub: 'aside',
  },
  ui: {
    colors: {
      primary: 'green',
      neutral: 'zinc',
    },
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
    contentToc: {
      defaultVariants: {
        highlightVariant: 'circuit',
      },
    },
  },
  docus: {
    locale: 'en',
  },
  seo: {
    title: 'ODX',
    titleTemplate: '%s ? ODX',
    description: 'OData Developer Experience: The modern ecosystem for OData integration.',
  },
  header: {
    title: 'ODX',
  },
  socials: {
    github: 'janfrl/odx-js',
  },
})
