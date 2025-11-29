import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Report Builder - AI Customer Reports',
  description: 'Generate fun, engaging customer reports automatically',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
