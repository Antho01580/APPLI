import { addWeeks, addDays, isAfter, isBefore, differenceInWeeks, format, setMonth, setDate, getYear } from 'date-fns'

interface PlanningConfig {
  dateDebutFormation: Date
  dateFinFormation: Date
  volumeHoraire: number // 405
  nbSeries: number // 4
  nbCoursParSerie: number // 10
  dureeCours: number // 60 min (45+15)
  heuresCasPratique: number // 10h per cas
  nbCasPratiques: number // 10
}

interface PlanningItem {
  titre: string
  type: string
  dateDebut: Date
  dateFin: Date
  description?: string
}

export function generatePlanning(config: PlanningConfig): PlanningItem[] {
  const items: PlanningItem[] = []
  const { dateDebutFormation, dateFinFormation } = config

  const totalWeeks = differenceInWeeks(dateFinFormation, dateDebutFormation)
  const totalCours = config.nbSeries * config.nbCoursParSerie // 40

  // Seminaire dates: always 2nd week of November and March
  const year = getYear(dateDebutFormation)
  const seminaire1Start = getSeminaireDate(year, 10) // November (0-indexed)
  const seminaire2Start = getSeminaireDate(year + 1, 2) // March

  // Add seminaires
  if (isAfter(seminaire1Start, dateDebutFormation) && isBefore(seminaire1Start, dateFinFormation)) {
    items.push({
      titre: 'Séminaire 1',
      type: 'SEMINAIRE',
      dateDebut: seminaire1Start,
      dateFin: addDays(seminaire1Start, 4),
      description: 'Séminaire en présentiel - 4.5 jours × 10h = 45h',
    })
  }

  if (isAfter(seminaire2Start, dateDebutFormation) && isBefore(seminaire2Start, dateFinFormation)) {
    items.push({
      titre: 'Séminaire 2',
      type: 'SEMINAIRE',
      dateDebut: seminaire2Start,
      dateFin: addDays(seminaire2Start, 4),
      description: 'Séminaire en présentiel - 4.5 jours × 10h = 45h',
    })
  }

  // Calculate spacing for cours (1 per week principle)
  const coursSpacing = Math.max(1, Math.floor(totalWeeks / totalCours))

  let currentDate = addWeeks(dateDebutFormation, 1) // Start 1 week after debut

  // First course is pedagogique (pré-rentrée)
  items.push({
    titre: 'Cours de pré-rentrée (Pédagogique)',
    type: 'COURS',
    dateDebut: currentDate,
    dateFin: currentDate,
    description: 'Premier cours pédagogique - temps commun',
  })
  currentDate = addWeeks(currentDate, 1)

  // Generate 4 series of 10 courses
  for (let serie = 1; serie <= config.nbSeries; serie++) {
    for (let num = 1; num <= config.nbCoursParSerie; num++) {
      // Skip if we're in a seminaire week
      const isSeminaireWeek = items.some(
        (item) =>
          item.type === 'SEMINAIRE' &&
          !isBefore(currentDate, item.dateDebut) &&
          !isAfter(currentDate, item.dateFin)
      )

      if (isSeminaireWeek) {
        currentDate = addWeeks(currentDate, 1)
      }

      if (isAfter(currentDate, dateFinFormation)) break

      items.push({
        titre: `Série ${serie} - Cours ${num}`,
        type: 'COURS',
        dateDebut: currentDate,
        dateFin: currentDate,
        description: `Cours de suivi (45min + 15min)`,
      })

      // E-learning between courses
      items.push({
        titre: `E-learning - Série ${serie} Cours ${num}`,
        type: 'ELEARNING',
        dateDebut: currentDate,
        dateFin: addWeeks(currentDate, coursSpacing),
        description: 'Travail e-learning sur Nellapp',
      })

      currentDate = addWeeks(currentDate, coursSpacing)
    }
  }

  // ECF scheduling (months -4, -3, -2 before end)
  const ecfDates = [
    { num: 1, date: addWeeks(dateFinFormation, -16) },
    { num: 2, date: addWeeks(dateFinFormation, -12) },
    { num: 3, date: addWeeks(dateFinFormation, -8) },
  ]

  ecfDates.forEach(({ num, date }) => {
    if (isAfter(date, dateDebutFormation)) {
      items.push({
        titre: `ECF ${num}`,
        type: 'ECF',
        dateDebut: date,
        dateFin: addWeeks(date, 3),
        description: `Évaluation en Cours de Formation ${num} - 3 semaines pour le rendu`,
      })
    }
  })

  // Tutor meetings: 1/3, 1/2, 2/3 of contract
  const thirdWeek = Math.floor(totalWeeks / 3)
  items.push(
    {
      titre: 'Rencontre Tuteur 1',
      type: 'RENCONTRE_TUTEUR',
      dateDebut: addWeeks(dateDebutFormation, thirdWeek),
      dateFin: addWeeks(dateDebutFormation, thirdWeek),
      description: '1ère rencontre tuteur (1/3 du contrat)',
    },
    {
      titre: 'Rencontre Tuteur 2',
      type: 'RENCONTRE_TUTEUR',
      dateDebut: addWeeks(dateDebutFormation, thirdWeek * 2 - 1),
      dateFin: addWeeks(dateDebutFormation, thirdWeek * 2 - 1),
      description: '2ème rencontre tuteur (1/2 du contrat)',
    },
    {
      titre: 'Rencontre Tuteur 3',
      type: 'RENCONTRE_TUTEUR',
      dateDebut: addWeeks(dateDebutFormation, thirdWeek * 2 + Math.floor(thirdWeek / 2)),
      dateFin: addWeeks(dateDebutFormation, thirdWeek * 2 + Math.floor(thirdWeek / 2)),
      description: '3ème rencontre tuteur (2/3 du contrat)',
    }
  )

  // Jury preparation (month -1)
  items.push({
    titre: 'Préparation Jury',
    type: 'JURY',
    dateDebut: addWeeks(dateFinFormation, -4),
    dateFin: addWeeks(dateFinFormation, -4),
    description: 'Préparation au jury - demi-journée',
  })

  // Jury
  items.push({
    titre: 'Passage Jury',
    type: 'JURY',
    dateDebut: dateFinFormation,
    dateFin: dateFinFormation,
    description: 'Date de passage devant le jury',
  })

  // Sort by date
  items.sort((a, b) => a.dateDebut.getTime() - b.dateDebut.getTime())

  return items
}

function getSeminaireDate(year: number, month: number): Date {
  // 2nd week of the month = day 8
  let date = new Date(year, month, 8)
  // Find the Monday of that week
  const day = date.getDay()
  const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day
  date = addDays(date, diff)
  return date
}
