import { prisma } from './prisma'

type NotificationType =
  | 'RAPPEL_TUTEUR'
  | 'SATISFACTION'
  | 'CAS_PRATIQUE'
  | 'ECF'
  | 'MISSION'
  | 'DOSSIER_PRO'
  | 'SEMINAIRE'
  | 'BESOIN_PC'
  | 'CONVOCATION'
  | 'HANDICAP'
  | 'FORMATION_INTERNE'
  | 'RELATION_TRIMESTRIELLE'
  | 'ELEARNING'
  | 'QUESTIONNAIRE'

export async function createNotification(
  userId: string,
  titre: string,
  contenu: string,
  type: NotificationType,
  lien?: string
) {
  return prisma.notification.create({
    data: {
      userId,
      titre,
      contenu,
      type,
      lien,
    },
  })
}

// Notify formateur when stagiaire completes something
export async function notifyFormateurAction(
  formateurUserId: string,
  stagiaireNom: string,
  action: string,
  type: NotificationType
) {
  return createNotification(
    formateurUserId,
    `Action de ${stagiaireNom}`,
    `${stagiaireNom} a ${action}`,
    type
  )
}

// Send convocation to stagiaire
export async function sendConvocation(stagiaireUserId: string) {
  return createNotification(
    stagiaireUserId,
    'Convocation au 1er jour de formation',
    'Votre compte a été validé. Vous êtes convoqué au premier jour de formation. Consultez votre planning pour les détails.',
    'CONVOCATION',
    '/dashboard/stagiaire/planning'
  )
}

// Notify admin about PC need
export async function notifyBesoinPC(adminUserId: string, stagiaireNom: string) {
  return createNotification(
    adminUserId,
    `Besoin PC - ${stagiaireNom}`,
    `${stagiaireNom} a signalé un besoin de PC dans son questionnaire initial.`,
    'BESOIN_PC'
  )
}

// Notify formateur about seminaire
export async function notifySeminaireFormateur(formateurUserId: string, seminaireTitre: string) {
  return createNotification(
    formateurUserId,
    `Séminaire : ${seminaireTitre}`,
    'Un nouveau séminaire a été créé. Veuillez confirmer votre présence.',
    'SEMINAIRE',
    '/dashboard/formateur/calendrier'
  )
}

// Satisfaction survey notifications
export async function notifySatisfaction(userId: string, periode: number) {
  const periodeLabels: Record<number, string> = {
    1: 'Mois 2',
    2: 'Mois 5',
    3: 'Mois 7',
    4: 'Fin de parcours',
  }
  return createNotification(
    userId,
    `Questionnaire de satisfaction - ${periodeLabels[periode]}`,
    'Un nouveau questionnaire de satisfaction est disponible. Merci de le remplir.',
    'SATISFACTION'
  )
}

// Mission update reminder
export async function notifyMissionUpdate(stagiaireUserId: string, periode: number) {
  return createNotification(
    stagiaireUserId,
    'Mise à jour des missions',
    `Veuillez mettre à jour vos missions au sein de votre structure (période ${periode}/4).`,
    'MISSION',
    '/dashboard/stagiaire/missions'
  )
}

// Remind formateur about tutor meeting
export async function notifyRappelTuteur(formateurUserId: string, numero: number) {
  return createNotification(
    formateurUserId,
    `Rappel - Rencontre tuteur ${numero}`,
    `La rencontre tuteur ${numero} doit être programmée/réalisée prochainement.`,
    'RAPPEL_TUTEUR'
  )
}

// Notify formateur for trimestrial relations
export async function notifyRelationTrimestrielle(formateurUserId: string, trimestre: number) {
  return createNotification(
    formateurUserId,
    `Relations trimestrielles - T${trimestre}`,
    'Veuillez remplir le formulaire des relations trimestrielles (problèmes, difficultés, améliorations).',
    'RELATION_TRIMESTRIELLE',
    '/dashboard/formateur/relations'
  )
}
