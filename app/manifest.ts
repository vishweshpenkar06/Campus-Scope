import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CampusScope — Admissions Intelligence',
    short_name: 'CampusScope',
    description: 'Sourced Maharashtra engineering cutoff data, cited predictions, and a practice option form.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f3ec',
    theme_color: '#16213a',
    lang: 'en-IN',
    categories: ['education', 'productivity'],
    icons: [
      { src: '/icon-light-32x32.png', sizes: '32x32', type: 'image/png', purpose: 'any' },
      { src: '/icon-dark-32x32.png', sizes: '32x32', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-icon.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    ],
  }
}
