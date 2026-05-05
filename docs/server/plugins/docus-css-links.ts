const WINDOWS_DOCUS_CSS_LINK_RE = /<link rel="stylesheet" href="\/_nuxt\/[A-Za-z]:\/[^"]+\/\.nuxt\/docus\.css" crossorigin>\n?/g

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    html.head = html.head.map(entry => entry.replace(WINDOWS_DOCUS_CSS_LINK_RE, ''))
  })
})
