import { DM_Sans, Newsreader } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const newsreader = Newsreader({ subsets: ['latin'], variable: '--font-newsreader' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://campusscope.vercel.app'),
  title: 'CampusScope — Make a better college shortlist',
  description: 'Research Indian engineering colleges with clear fees, programs, placements, reviews, comparison, and an explainable shortlist predictor.',
  openGraph: {
    type: 'website',
    siteName: 'CampusScope',
    locale: 'en_IN',
    title: 'CampusScope — Make a better college shortlist',
    description:
      'Sourced cutoffs, explainable predictions, and a shortlist you can defend for Maharashtra engineering admissions.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CampusScope — Make a better college shortlist',
    description:
      'Sourced cutoffs, explainable predictions, and a shortlist you can defend.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
      <html lang="en" className="bg-background">
        <body className={`${dmSans.variable} ${newsreader.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
