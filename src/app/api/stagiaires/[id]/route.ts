import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const stagiaire = await prisma.stagiaire.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, nom: true, prenom: true, email: true, telephone: true, photo: true, isActive: true, createdAt: true } },
        formation: { include: { unitesCompetences: true } },
        formateur: { include: { user: { select: { nom: true, prenom: true, email: true } } } },
        tuteur: { include: { user: { select: { nom: true, prenom: true, email: true } } } },
        club: true,
        plannings: { orderBy: { dateDebut: 'asc' } },
        coursStag: {
          include: { cours: { include: { formateur: { include: { user: { select: { nom: true, prenom: true } } } } } } },
          orderBy: { createdAt: 'desc' },
        },
        casPratiques: { include: { casPratique: true }, orderBy: { createdAt: 'desc' } },
        questionnaires: { orderBy: { createdAt: 'desc' } },
        ecfs: { include: { ecf: true }, orderBy: { createdAt: 'desc' } },
        satisfactions: { orderBy: { createdAt: 'desc' } },
        dossierPro: true,
        missionsUpdates: { orderBy: { periode: 'asc' } },
        demandesImmersion: { orderBy: { createdAt: 'desc' } },
        rencontresTuteur: { orderBy: { numero: 'asc' } },
        documentsAccueil: true,
        compteRenduEntretien: true,
        questionnaireInitial: true,
        questionnaireAdaptation: { include: { question: true } },
      },
    })

    if (!stagiaire) {
      return NextResponse.json({ error: 'Stagiaire non trouvé' }, { status: 404 })
    }

    return NextResponse.json(stagiaire)
  } catch (error) {
    console.error('Erreur GET /api/stagiaires/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const {
      nom, prenom, telephone, photo,
      dateNaissance, adresse, codePostal, ville,
      formationId, formateurId, tuteurId, clubId,
      dateDebutContrat, dateFinContrat, dateDebutFormation, dateFinFormation,
      format: formatType, missionClub,
      carteIdentite, diplome, carteVitale, cv, lettreMotivation, fichePoste,
      attestationEntreprise, besoinPC, pcEnvoye,
    } = body

    const stagiaire = await prisma.stagiaire.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })

    if (!stagiaire) {
      return NextResponse.json({ error: 'Stagiaire non trouvé' }, { status: 404 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (nom || prenom || telephone || photo) {
        await tx.user.update({
          where: { id: stagiaire.userId },
          data: {
            ...(nom && { nom }),
            ...(prenom && { prenom }),
            ...(telephone !== undefined && { telephone }),
            ...(photo !== undefined && { photo }),
          },
        })
      }

      return tx.stagiaire.update({
        where: { id: params.id },
        data: {
          ...(dateNaissance !== undefined && { dateNaissance: dateNaissance ? new Date(dateNaissance) : null }),
          ...(adresse !== undefined && { adresse }),
          ...(codePostal !== undefined && { codePostal }),
          ...(ville !== undefined && { ville }),
          ...(formationId !== undefined && { formationId }),
          ...(formateurId !== undefined && { formateurId }),
          ...(tuteurId !== undefined && { tuteurId }),
          ...(clubId !== undefined && { clubId }),
          ...(dateDebutContrat !== undefined && { dateDebutContrat: dateDebutContrat ? new Date(dateDebutContrat) : null }),
          ...(dateFinContrat !== undefined && { dateFinContrat: dateFinContrat ? new Date(dateFinContrat) : null }),
          ...(dateDebutFormation !== undefined && { dateDebutFormation: dateDebutFormation ? new Date(dateDebutFormation) : null }),
          ...(dateFinFormation !== undefined && { dateFinFormation: dateFinFormation ? new Date(dateFinFormation) : null }),
          ...(formatType !== undefined && { format: formatType }),
          ...(missionClub !== undefined && { missionClub }),
          ...(carteIdentite !== undefined && { carteIdentite }),
          ...(diplome !== undefined && { diplome }),
          ...(carteVitale !== undefined && { carteVitale }),
          ...(cv !== undefined && { cv }),
          ...(lettreMotivation !== undefined && { lettreMotivation }),
          ...(fichePoste !== undefined && { fichePoste }),
          ...(attestationEntreprise !== undefined && { attestationEntreprise }),
          ...(besoinPC !== undefined && { besoinPC }),
          ...(pcEnvoye !== undefined && { pcEnvoye }),
        },
        include: {
          user: { select: { id: true, nom: true, prenom: true, email: true, telephone: true, photo: true } },
          formation: { select: { id: true, nom: true } },
        },
      })
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erreur PUT /api/stagiaires/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const currentUser = session.user as any
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    const stagiaire = await prisma.stagiaire.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })

    if (!stagiaire) {
      return NextResponse.json({ error: 'Stagiaire non trouvé' }, { status: 404 })
    }

    switch (action) {
      case 'valider_compte': {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: stagiaire.userId },
            data: { isActive: true },
          }),
          prisma.stagiaire.update({
            where: { id: params.id },
            data: { compteValide: true },
          }),
        ])
        return NextResponse.json({ message: 'Compte validé' })
      }

      case 'valider_prerequis': {
        await prisma.stagiaire.update({
          where: { id: params.id },
          data: { prerequisValides: true },
        })
        return NextResponse.json({ message: 'Prérequis validés' })
      }

      case 'envoyer_convocation': {
        await prisma.stagiaire.update({
          where: { id: params.id },
          data: { convocationEnvoyee: true },
        })
        return NextResponse.json({ message: 'Convocation envoyée' })
      }

      case 'envoyer_pc': {
        await prisma.stagiaire.update({
          where: { id: params.id },
          data: { pcEnvoye: true },
        })
        return NextResponse.json({ message: 'PC envoyé marqué' })
      }

      case 'generer_carte_etudiante': {
        const carteId = `WF-${Date.now()}`
        await prisma.stagiaire.update({
          where: { id: params.id },
          data: { carteEtudiante: carteId },
        })
        return NextResponse.json({ message: 'Carte étudiante générée', carteId })
      }

      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erreur PATCH /api/stagiaires/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
