'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface PlanningItem {
  id: string
  title: string
  type: string
  date: string
  endDate?: string
  location?: string
  teamsLink?: string
}

const typeColors: Record<string, string> = {
  COURS: 'bg-blue-100 text-blue-800 border-blue-200',
  ELEARNING: 'bg-purple-100 text-purple-800 border-purple-200',
  SEMINAIRE: 'bg-pink-100 text-pink-800 border-pink-200',
  ECF: 'bg-orange-100 text-orange-800 border-orange-200',
  CAS_PRATIQUE: 'bg-green-100 text-green-800 border-green-200',
  MASTERCLASS: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  IMMERSION: 'bg-teal-100 text-teal-800 border-teal-200',
  DOSSIER_PRO: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

const typeLabels: Record<string, string> = {
  COURS: 'Cours',
  ELEARNING: 'E-learning',
  SEMINAIRE: 'Seminaire',
  ECF: 'ECF',
  CAS_PRATIQUE: 'Cas pratique',
  MASTERCLASS: 'Masterclass',
  IMMERSION: 'Immersion',
  DOSSIER_PRO: 'Dossier pro',
}

const allTypes = Object.keys(typeLabels)

export default function PlanningPage() {
  const [items, setItems] = useState<PlanningItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  useEffect(() => {
    fetch('/api/stagiaire/planning')
      .then((res) => res.json())
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filteredItems = filterType === 'ALL' ? items : items.filter((i) => i.type === filterType)

  const groupedByMonth = filteredItems.reduce<Record<string, PlanningItem[]>>((acc, item) => {
    const month = new Date(item.date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
    })
    if (!acc[month]) acc[month] = []
    acc[month].push(item)
    return acc
  }, {})

  return (
    <DashboardLayout requiredRole={['STAGIAIRE']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Planning</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-weform-blue text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Liste
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-weform-blue text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Calendrier
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              filterType === 'ALL'
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            Tous
          </button>
          {allTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                filterType === type
                  ? typeColors[type]
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {typeLabels[type]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-weform-blue"></div>
          </div>
        ) : viewMode === 'list' ? (
          /* List view */
          <div className="space-y-6">
            {Object.keys(groupedByMonth).length > 0 ? (
              Object.entries(groupedByMonth).map(([month, monthItems]) => (
                <div key={month}>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {month}
                  </h2>
                  <div className="space-y-2">
                    {monthItems.map((item) => (
                      <div
                        key={item.id}
                        className={`card flex items-center justify-between border-l-4 ${
                          typeColors[item.type]?.replace('bg-', 'border-l-').split(' ')[0] ||
                          'border-l-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[50px]">
                            <p className="text-lg font-bold text-gray-900">
                              {new Date(item.date).getDate()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(item.date).toLocaleDateString('fr-FR', {
                                weekday: 'short',
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{item.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  typeColors[item.type] || 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {typeLabels[item.type] || item.type}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(item.date).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {item.endDate &&
                                  ` - ${new Date(item.endDate).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.location && (
                            <span className="text-xs text-gray-500">{item.location}</span>
                          )}
                          {item.teamsLink && (
                            <a
                              href={item.teamsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Teams
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="card text-center py-12">
                <p className="text-gray-400">Aucun element dans le planning</p>
              </div>
            )}
          </div>
        ) : (
          /* Calendar view */
          <CalendarView items={filteredItems} />
        )}
      </div>
    </DashboardLayout>
  )
}

function CalendarView({ items }: { items: PlanningItem[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: adjustedFirstDay }, (_, i) => i)

  const getItemsForDay = (day: number) => {
    return items.filter((item) => {
      const d = new Date(item.date)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
          &larr;
        </button>
        <h2 className="text-lg font-semibold text-gray-900 capitalize">
          {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
          &rarr;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
          <div key={d} className="bg-gray-50 text-center text-xs font-medium text-gray-500 py-2">
            {d}
          </div>
        ))}
        {blanks.map((b) => (
          <div key={`blank-${b}`} className="bg-white p-2 min-h-[80px]" />
        ))}
        {days.map((day) => {
          const dayItems = getItemsForDay(day)
          const isToday =
            new Date().getDate() === day &&
            new Date().getMonth() === month &&
            new Date().getFullYear() === year
          return (
            <div
              key={day}
              className={`bg-white p-2 min-h-[80px] ${isToday ? 'ring-2 ring-weform-blue ring-inset' : ''}`}
            >
              <span className={`text-sm ${isToday ? 'font-bold text-weform-blue' : 'text-gray-700'}`}>
                {day}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className={`text-xs px-1 py-0.5 rounded truncate ${
                      typeColors[item.type] || 'bg-gray-100 text-gray-600'
                    }`}
                    title={item.title}
                  >
                    {item.title}
                  </div>
                ))}
                {dayItems.length > 3 && (
                  <p className="text-xs text-gray-400">+{dayItems.length - 3} autres</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
