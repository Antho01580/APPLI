'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useState, FormEvent } from 'react'

export default function TuteurContact() {
  const [sujet, setSujet] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('CONTACT')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contenu: `[${type === 'CONTACT' ? 'Demande de contact' : 'Demande d\'information'}] ${sujet}\n\n${message}`,
          type: 'DEMANDE_AIDE',
          toAdmin: true,
        }),
      })
      if (res.ok) {
        setSuccess(true)
        setSujet('')
        setMessage('')
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <DashboardLayout requiredRole={['TUTEUR']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact</h1>
          <p className="text-gray-500">
            Envoyez une demande de contact ou d&apos;information à WE-FORM
          </p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            Votre demande a été envoyée avec succès.
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Type de demande</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="input-field"
              >
                <option value="CONTACT">Demande de contact</option>
                <option value="INFORMATION">Demande d&apos;information</option>
              </select>
            </div>

            <div>
              <label className="label-field">Sujet</label>
              <input
                type="text"
                value={sujet}
                onChange={(e) => setSujet(e.target.value)}
                className="input-field"
                placeholder="Objet de votre demande"
                required
              />
            </div>

            <div>
              <label className="label-field">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input-field"
                rows={6}
                placeholder="Décrivez votre demande..."
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </form>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Informations de contact WE-FORM :</strong>
            <br />
            Pour toute urgence, vous pouvez également contacter directement le formateur
            ou l&apos;administration WE-FORM via les coordonnées habituelles.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
