'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Modal from '@/components/ui/Modal'

interface CalendarEvent {
  id: string
  titre: string
  date: string
  heureDebut: string
  heureFin: string
  type: 'COURS' | 'RENCONTRE_TUTEUR' | 'SUIVI_RENFORCE' | 'SEMINAIRE'
  description?: string
  stagiaires?: string[]
}

interface Disponibilite {
  id: string
  date: string
  heureDebut: string
  heureFin: string
}

const EVENT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  COURS: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Cours' },
  RENCONTRE_TUTEUR: { bg: 'bg-green-100', text: 'text-green-700', label: 'Rencontre tuteur' },
  SUIVI_RENFORCE: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Suivi renforc\u00e9' },
  SEMINAIRE: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'S\u00e9minaire' },
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = [
  'Janvier', 'F\u00e9vrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Ao\u00fbt', 'Septembre', 'Octobre', 'Novembre', 'D\u00e9cembre',
]

export default function CalendrierPage() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>('month')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showDispoModal, setShowDispoModal] = useState(false)
  const [dispoForm, setDispoForm] = useState({ date: '', heureDebut: '09:00', heureFin: '17:00' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return
    fetchData()
  }, [session, currentDate])

  const fetchData = async () => {
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const [eventsRes, dispoRes] = await Promise.all([
        fetch(`/api/formateur/calendrier?year=${year}&month=${month}`),
        fetch(`/api/formateur/disponibilites?year=${year}&month=${month}`),
      ])
      if (eventsRes.ok) {
        const data = await eventsRes.json()
        setEvents(data.events || [])
      }
      if (dispoRes.ok) {
        const data = await dispoRes.json()
        setDisponibilites(data.disponibilites || [])
      }
    } catch (error) {
      console.error('Erreur chargement calendrier:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDispo = async () => {
    if (!dispoForm.date) return
    setSaving(true)
    try {
      const res = await fetch('/api/formateur/disponibilites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dispoForm),
      })
      if (res.ok) {
        const data = await res.json()
        setDisponibilites((prev) => [...prev, data.disponibilite])
        setShowDispoModal(false)
        setDispoForm({ date: '', heureDebut: '09:00', heureFin: '17:00' })
      }
    } catch (error) {
      console.error('Erreur ajout disponibilit\u00e9:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDispo = async (id: string) => {
    try {
      const res = await fetch(`/api/formateur/disponibilites/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setDisponibilites((prev) => prev.filter((d) => d.id !== id))
      }
    } catch (error) {
      console.error('Erreur suppression disponibilit\u00e9:', error)
    }
  }

  const navigateMonth = (delta: number) => {
    setCurrentDate((prev) => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + delta)
      return d
    })
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (number | null)[] = []

    // Offset for Monday start (0=Mon ... 6=Sun)
    let startDay = firstDay.getDay() - 1
    if (startDay < 0) startDay = 6

    for (let i = 0; i < startDay; i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(i)

    return days
  }

  const getWeekDays = () => {
    const start = new Date(currentDate)
    const day = start.getDay()
    const diff = day === 0 ? -6 : 1 - day
    start.setDate(start.getDate() + diff)

    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push(d)
    }
    return days
  }

  const getEventsForDate = (dateStr: string) => {
    return events.filter((e) => e.date.startsWith(dateStr))
  }

  const formatDateStr = (day: number) => {
    const m = String(currentDate.getMonth() + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${currentDate.getFullYear()}-${m}-${d}`
  }

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : []
  const selectedDispos = selectedDate
    ? disponibilites.filter((d) => d.date.startsWith(selectedDate))
    : []

  return (
    <DashboardLayout requiredRole={['FORMATEUR']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
            <p className="text-gray-500 mt-1">Cours, rencontres et disponibilit\u00e9s</p>
          </div>
          <button
            onClick={() => {
              setDispoForm({ ...dispoForm, date: '' })
              setShowDispoModal(true)
            }}
            className="btn-primary"
          >
            D\u00e9finir une disponibilit\u00e9
          </button>
        </div>

        {/* View toggle and navigation */}
        <div className="card flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-sm rounded-lg ${view === 'month' ? 'bg-weform-blue text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Mois
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-sm rounded-lg ${view === 'week' ? 'bg-weform-blue text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Semaine
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          {Object.entries(EVENT_COLORS).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${val.bg}`} />
              <span className="text-sm text-gray-600">{val.label}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-weform-blue"></div>
          </div>
        ) : view === 'month' ? (
          /* Monthly View */
          <div className="card p-0 overflow-hidden">
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-500 py-3">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {getDaysInMonth().map((day, idx) => {
                const dateStr = day ? formatDateStr(day) : ''
                const dayEvents = day ? getEventsForDate(dateStr) : []
                const today = new Date()
                const isToday =
                  day === today.getDate() &&
                  currentDate.getMonth() === today.getMonth() &&
                  currentDate.getFullYear() === today.getFullYear()

                return (
                  <div
                    key={idx}
                    className={`min-h-[100px] border-b border-r p-1.5 ${
                      day ? 'cursor-pointer hover:bg-gray-50' : 'bg-gray-50/50'
                    }`}
                    onClick={() => {
                      if (day) {
                        setSelectedDate(dateStr)
                        setShowEventModal(true)
                      }
                    }}
                  >
                    {day && (
                      <>
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full ${
                            isToday ? 'bg-weform-blue text-white font-bold' : 'text-gray-700'
                          }`}
                        >
                          {day}
                        </span>
                        <div className="space-y-0.5 mt-1">
                          {dayEvents.slice(0, 3).map((e) => {
                            const color = EVENT_COLORS[e.type] || EVENT_COLORS.COURS
                            return (
                              <div
                                key={e.id}
                                className={`text-xs px-1.5 py-0.5 rounded truncate ${color.bg} ${color.text}`}
                              >
                                {e.titre}
                              </div>
                            )
                          })}
                          {dayEvents.length > 3 && (
                            <p className="text-xs text-gray-400 pl-1">+{dayEvents.length - 3} autres</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Weekly View */
          <div className="card p-0 overflow-hidden">
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {getWeekDays().map((d) => {
                const today = new Date()
                const isToday = d.toDateString() === today.toDateString()
                return (
                  <div key={d.toISOString()} className="text-center py-3">
                    <p className="text-xs text-gray-500">{DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]}</p>
                    <p className={`text-lg font-semibold ${isToday ? 'text-weform-blue' : 'text-gray-900'}`}>
                      {d.getDate()}
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-7 min-h-[400px]">
              {getWeekDays().map((d) => {
                const dateStr = d.toISOString().split('T')[0]
                const dayEvents = getEventsForDate(dateStr)
                return (
                  <div
                    key={d.toISOString()}
                    className="border-r p-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSelectedDate(dateStr)
                      setShowEventModal(true)
                    }}
                  >
                    <div className="space-y-1">
                      {dayEvents.map((e) => {
                        const color = EVENT_COLORS[e.type] || EVENT_COLORS.COURS
                        return (
                          <div key={e.id} className={`text-xs p-2 rounded ${color.bg} ${color.text}`}>
                            <p className="font-medium truncate">{e.titre}</p>
                            <p className="opacity-75">{e.heureDebut} - {e.heureFin}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Day Detail Modal */}
        <Modal
          isOpen={showEventModal}
          onClose={() => setShowEventModal(false)}
          title={selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          }) : ''}
          size="lg"
        >
          <div className="space-y-4">
            {selectedEvents.length === 0 && selectedDispos.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Aucun \u00e9v\u00e9nement ce jour</p>
            ) : (
              <>
                {selectedEvents.map((e) => {
                  const color = EVENT_COLORS[e.type] || EVENT_COLORS.COURS
                  return (
                    <div key={e.id} className={`p-4 rounded-lg ${color.bg}`}>
                      <div className="flex items-center justify-between">
                        <h4 className={`font-semibold ${color.text}`}>{e.titre}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${color.bg} ${color.text} border`}>
                          {color.label}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${color.text} opacity-75`}>
                        {e.heureDebut} - {e.heureFin}
                      </p>
                      {e.description && (
                        <p className="text-sm text-gray-600 mt-2">{e.description}</p>
                      )}
                      {e.stagiaires && e.stagiaires.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Stagiaires : {e.stagiaires.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
                {selectedDispos.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Disponibilit\u00e9s</h4>
                    {selectedDispos.map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                        <span className="text-sm text-gray-700">{d.heureDebut} - {d.heureFin}</span>
                        <button
                          onClick={() => handleDeleteDispo(d.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>

        {/* Disponibilit\u00e9 Modal */}
        <Modal
          isOpen={showDispoModal}
          onClose={() => setShowDispoModal(false)}
          title="D\u00e9finir une disponibilit\u00e9"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={dispoForm.date}
                onChange={(e) => setDispoForm({ ...dispoForm, date: e.target.value })}
                className="input w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure d\u00e9but</label>
                <input
                  type="time"
                  value={dispoForm.heureDebut}
                  onChange={(e) => setDispoForm({ ...dispoForm, heureDebut: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure fin</label>
                <input
                  type="time"
                  value={dispoForm.heureFin}
                  onChange={(e) => setDispoForm({ ...dispoForm, heureFin: e.target.value })}
                  className="input w-full"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowDispoModal(false)} className="btn-secondary">
                Annuler
              </button>
              <button
                onClick={handleAddDispo}
                disabled={saving || !dispoForm.date}
                className="btn-primary"
              >
                {saving ? 'Sauvegarde...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
