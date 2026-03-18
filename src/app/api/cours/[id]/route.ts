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

    const cours = await prisma.cours.findUnique({
      where: { id: params.id },
      include: {
        formation: { select: { id: true, nom: true } },
        formateur: { include: { user: { select: { nom: true, prenom: true, email: true } } } },
        uc: true,
        participations: {
          include: {
            stagiaire: { include: { user: { select: { nom: true, prenom: true, email: true } } } },
          },
        },
        casPratiqueAssoc: true,
      },
    })

    if (!cours) {
      return NextResponse.json({ error: 'Cours non trouvé' }, { status: 404 })
    }

    return NextResponse.json(cours)
  } catch (error) {
    console.error('Erreur GET /api/cours/[id]:', error)
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
    const { action } = body

    switch (action) {
      case 'signer': {
        const { stagiaireId, role } = body
        if (!stagiaireId) {
          return NextResponse.json({ error: 'stagiaireId requis' }, { status: 400 })
        }

        const participation = await prisma.coursParticipation.findUnique({
          where: { coursId_stagiaireId: { coursId: params.id, stagiaireId } },
        })

        if (!participation) {
          return NextResponse.json({ error: 'Participation non trouvée' }, { status: 404 })
        }

        const updateData: any = { dateSignature: new Date() }
        if (role === 'FORMATEUR') {
          updateData.signatureFormateur = true
        } else {
          updateData.signatureStagiaire = true
        }

        const updated = await prisma.coursParticipation.update({
          where: { id: participation.id },
          data: updateData,
        })

        return NextResponse.json(updated)
      }

      case 'commentaire': {
        const { stagiaireId: stagId, commentaireFormateur } = body
        if (!stagId) {
          return NextResponse.json({ error: 'stagiaireId requis' }, { status: 400 })
        }

        const updated = await prisma.coursParticipation.update({
          where: { coursId_stagiaireId: { coursId: params.id, stagiaireId: stagId } },
          data: { commentaireFormateur },
        })

        return NextResponse.json(updated)
      }

      case 'compte_rendu': {
        const { stagiaireId: sId, compteRendu } = body
        if (!sId) {
          return NextResponse.json({ error: 'stagiaireId requis' }, { status: 400 })
        }

        const updated = await prisma.coursParticipation.update({
          where: { coursId_stagiaireId: { coursId: params.id, stagiaireId: sId } },
          data: { compteRendu, statut: 'REALISE' },
        })

        return NextResponse.json(updated)
      }

      default: {
        // Generic update of the cours itself
        const { titre, contenuObjectif, thematiquesElearning, duree, datePrevisionnelle, ucId } = body

        const updated = await prisma.cours.update({
          where: { id: params.id },
          data: {
            ...(titre !== undefined && { titre }),
            ...(contenuObjectif !== undefined && { contenuObjectif }),
            ...(thematiquesElearning !== undefined && { thematiquesElearning }),
            ...(duree !== undefined && { duree }),
            ...(ucId !== undefined && { ucId }),
            ...(datePrevisionnelle !== undefined && { datePrevisionnelle: datePrevisionnelle ? new Date(datePrevisionnelle) : null }),
          },
          include: {
            formation: { select: { id: true, nom: true } },
            formateur: { include: { user: { select: { nom: true, prenom: true } } } },
          },
        })

        return NextResponse.json(updated)
      }
    }
  } catch (error) {
    console.error('Erreur PUT /api/cours/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
