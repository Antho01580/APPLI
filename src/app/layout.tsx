import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'WE-FORM - Application Métier',
  description: 'Gestion du parcours stagiaire en alternance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
