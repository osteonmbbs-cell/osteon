import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Osteon Medical Portal',
    short_name: 'Osteon',
    description: 'Secure, high-performance medical test portal',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0e1a',
    theme_color: '#0a0e1a',
    icons: [
      {
        src: '/logo.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'maskable'
      },
      {
        src: '/logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'maskable'
      },
      {
        src: '/logo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any'
      }
    ],
  }
}
