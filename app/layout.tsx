import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Karagani Farming Management',
  description: 'Software created to help manage Karagani farming operations.'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
