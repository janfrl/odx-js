import '@nuxt/content'

// Docus 5.12 still imports this pre-3.14 convenience name. Keep the alias
// local until Docus consumes the generated locale-specific collection type.
declare module '@nuxt/content' {
  interface DocsCollectionItem extends DocsEnCollectionItem {}
}
