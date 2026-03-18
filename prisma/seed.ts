import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@weform.fr' },
    update: {},
    create: {
      email: 'admin@weform.fr',
      password: adminPassword,
      nom: 'WE-FORM',
      prenom: 'Admin',
      role: 'ADMIN',
      isActive: true,
    },
  })
  console.log('Admin created:', admin.email)

  const formateurPassword = await bcrypt.hash('formateur123', 10)

  const xavier = await prisma.user.upsert({
    where: { email: 'xavier.gaussens@weform.fr' },
    update: {},
    create: {
      email: 'xavier.gaussens@weform.fr',
      password: formateurPassword,
      nom: 'Gaussens',
      prenom: 'Xavier',
      role: 'FORMATEUR',
      isActive: true,
      formateur: {
        create: { specialite: 'RPMS' },
      },
    },
  })
  console.log('Formateur created:', xavier.email)

  const anthony = await prisma.user.upsert({
    where: { email: 'anthony.grand@weform.fr' },
    update: {},
    create: {
      email: 'anthony.grand@weform.fr',
      password: formateurPassword,
      nom: 'Grand',
      prenom: 'Anthony',
      role: 'FORMATEUR',
      isActive: true,
      formateur: {
        create: { specialite: 'RPMS' },
      },
    },
  })
  console.log('Formateur created:', anthony.email)

  const rpms = await prisma.formation.upsert({
    where: { id: 'rpms-default' },
    update: {},
    create: {
      id: 'rpms-default',
      nom: 'Responsable de Petites et Moyennes Structures (RPMS)',
      codeRNCP: '38575',
      volumeHoraire: 405,
      description:
        'Le Responsable de petite et moyenne structure anime une structure économique dans ses dimensions humaine, commerciale, production et financière.',
      referentielActivites: JSON.stringify({
        activites: [
          'Animer une équipe',
          'Piloter les opérations commerciales et la production',
          'Gérer les ressources financières',
        ],
      }),
      referentielEvaluation: JSON.stringify({
        modalites: [
          'Mise en situation professionnelle',
          'Dossier professionnel',
          'Entretien avec le jury',
        ],
      }),
    },
  })

  const ucs = [
    { code: 'UC1', titre: 'Animer une équipe', description: 'Encadrer et animer une équipe' },
    { code: 'UC2', titre: 'Piloter les opérations commerciales et la production', description: 'Mettre en oeuvre le plan marketing et l\'action commerciale' },
    { code: 'UC3', titre: 'Gérer les ressources financières', description: 'Contrôler l\'activité comptable et la gestion financière' },
  ]

  for (const uc of ucs) {
    await prisma.unitCompetence.upsert({
      where: { id: `rpms-${uc.code.toLowerCase()}` },
      update: {},
      create: {
        id: `rpms-${uc.code.toLowerCase()}`,
        formationId: rpms.id,
        code: uc.code,
        titre: uc.titre,
        description: uc.description,
      },
    })
  }
  console.log('Formation RPMS created with 3 UCs')

  for (let i = 1; i <= 3; i++) {
    await prisma.eCF.upsert({
      where: { id: `rpms-ecf-${i}` },
      update: {},
      create: {
        id: `rpms-ecf-${i}`,
        formationId: rpms.id,
        numero: i,
        titre: `ECF ${i} - RPMS`,
        sujet: `Sujet de l'ECF ${i} pour la formation RPMS`,
        delaiSemaines: 3,
      },
    })
  }
  console.log('3 ECFs created')

  const club = await prisma.club.upsert({
    where: { id: 'club-demo' },
    update: {},
    create: {
      id: 'club-demo',
      nom: 'Club Sportif Demo',
      adresse: '10 rue du Sport',
      codePostal: '75001',
      ville: 'Paris',
      telephone: '01 23 45 67 89',
      email: 'contact@clubdemo.fr',
      siret: '12345678901234',
    },
  })
  console.log('Club created:', club.nom)

  const tuteurPassword = await bcrypt.hash('tuteur123', 10)
  const tuteur = await prisma.user.upsert({
    where: { email: 'tuteur@clubdemo.fr' },
    update: {},
    create: {
      email: 'tuteur@clubdemo.fr',
      password: tuteurPassword,
      nom: 'Dupont',
      prenom: 'Jean',
      role: 'TUTEUR',
      isActive: true,
      tuteur: {
        create: { clubId: club.id, fonction: 'Directeur sportif' },
      },
    },
  })
  console.log('Tuteur created:', tuteur.email)

  const stagiairePassword = await bcrypt.hash('stagiaire123', 10)
  const stagiaireUser = await prisma.user.upsert({
    where: { email: 'stagiaire@demo.fr' },
    update: {},
    create: {
      email: 'stagiaire@demo.fr',
      password: stagiairePassword,
      nom: 'Martin',
      prenom: 'Lucas',
      role: 'STAGIAIRE',
      isActive: true,
    },
  })

  const formateurRecord = await prisma.formateur.findFirst({ where: { userId: xavier.id } })
  const tuteurRecord = await prisma.tuteur.findFirst({ where: { userId: tuteur.id } })

  if (formateurRecord && tuteurRecord) {
    await prisma.stagiaire.upsert({
      where: { userId: stagiaireUser.id },
      update: {},
      create: {
        userId: stagiaireUser.id,
        formationId: rpms.id,
        formateurId: formateurRecord.id,
        tuteurId: tuteurRecord.id,
        clubId: club.id,
        dateDebutFormation: new Date('2026-01-15'),
        dateFinFormation: new Date('2026-10-15'),
        dateDebutContrat: new Date('2026-01-01'),
        dateFinContrat: new Date('2026-12-31'),
        format: 'HYBRIDE',
        missionClub: 'Responsable communication et événementiel',
        prerequisValides: true,
        compteValide: true,
        convocationEnvoyee: true,
      },
    })
  }
  console.log('Stagiaire created:', stagiaireUser.email)

  console.log('\n--- Seed complete ---')
  console.log('Comptes de démonstration:')
  console.log('Admin: admin@weform.fr / admin123')
  console.log('Formateur Xavier: xavier.gaussens@weform.fr / formateur123')
  console.log('Formateur Anthony: anthony.grand@weform.fr / formateur123')
  console.log('Tuteur: tuteur@clubdemo.fr / tuteur123')
  console.log('Stagiaire: stagiaire@demo.fr / stagiaire123')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
