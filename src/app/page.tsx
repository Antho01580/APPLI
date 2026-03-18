'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      const role = session.user.role.toLowerCase()
      router.push(`/dashboard/${role}`)
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-weform-blue"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950">
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">WE-FORM</h1>
          <p className="text-xl text-blue-200 max-w-2xl">
            Application métier pour la gestion du parcours stagiaire en alternance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full mb-12">
          <div className="card hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-3">&#x1F393;</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Stagiaire / Apprenti</h3>
            <p className="text-gray-600 text-sm">
              Accédez à votre parcours, planning, documents et messagerie.
            </p>
          </div>
          <div className="card hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-3">&#x1F4DA;</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Formateur</h3>
            <p className="text-gray-600 text-sm">
              Gérez vos stagiaires, cours, corrections et facturation.
            </p>
          </div>
          <div className="card hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-3">&#x1F3E2;</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tuteur Entreprise</h3>
            <p className="text-gray-600 text-sm">
              Suivez le parcours du jeune et les rendez-vous tuteur.
            </p>
          </div>
          <div className="card hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-3">&#x2699;&#xFE0F;</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin / Péda</h3>
            <p className="text-gray-600 text-sm">
              Gestion complète : formations, comptes, séminaires, supervision.
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="btn-primary text-lg px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          Se connecter
        </Link>
      </div>
    </main>
  )
}
