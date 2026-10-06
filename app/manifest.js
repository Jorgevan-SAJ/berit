export default function manifest() {
  return {
    name: 'Berit — Gestão Eclesiástica',
    short_name: 'Berit',
    description: 'Simples e Eficiente',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF6EF',
    theme_color: '#1F3A5F',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
