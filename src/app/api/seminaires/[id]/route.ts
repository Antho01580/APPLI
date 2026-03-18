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

    const seminaire = await prisma.seminaire.findUnique({
      where: { id: params.id },
      include: {
        formation: { select: { id: true, nom: true } },
        presences: {
          include: {
            formateur: { include: { user: { select: { nom: true, prenom: true, email: true } } } },
          },
        },
        emargements: {
          include: {
            stagiaire: { include: { user: { select: { nom: true, prenom: true } } } },
            formateur: { include: { user: { select: { nom: true, prenom: true } } } },
          },
          orderBy: { date: 'asc' },
        },
      },
    })

    if (!seminaire) {
      return NextResponse.json({ error: 'Séminaire non trouvé' }, { status: 404 })
    }

    return NextResponse.json(seminaire)
  } catch (error) {
    console.error('Erreur GET /api/seminaires/[id]:', error)
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
      case 'reponse_presence': {
        const { formateurId, present } = body

        if (!formateurId || present === undefined) {
          return NextResponse.json({ error: 'formateurId et present requis' }, { status: 400 })
        }

        const presence = await prisma.seminairePresence.update({
          where: { seminaireId_formateurId: { seminaireId: params.id, formateurId } },
          data: { present },
        })

        return NextResponse.json(presence)
      }

      case 'emargement': {
        const { stagiaireId, formateurId: fId, date, matin, apresMidi, signature } = body

        if (!stagiaireId || !date) {
          return NextResponse.json({ error: 'stagiaireId et date requis' }, { status: 400 })
        }

        const emargement = await prisma.emargement.upsert({
          where: {
            seminaireId_stagiaireId_date: {
              seminaireId: params.id,
              stagiaireId,
              date: new Date(date),
            },
          },
          create: {
            seminaireId: params.id,
            stagiaireId,
            formateurId: fId,
            date: new Date(date),
            matin: matin || false,
            apresMidi: apresMidi || false,
            signature,
          },
          update: {
            matin: matin || false,
            apresMidi: apresMidi || false,
            signature,
            formateurId: fId,
          },
        })

        return NextResponse.json(emargement)
      }

      default: {
        // Update seminaire details
        const { titre, dateDebut, dateFin, dureeJours, heuresParJour, lieu, description } = body

        const updated = await prisma.seminaire.update({
          where: { id: params.id },
          data: {
            ...(titre !== undefined && { titre }),
            ...(dateDebut !== undefined && { dateDebut: new Date(dateDebut) }),
            ...(dateFin !== undefined && { dateFin: new Date(dateFin) }),
            ...(dureeJours !== undefined && { dureeJours }),
            ...(heuresParJour !== undefined && { heuresParJour }),
            ...(lieu !== undefined && { lieu }),
            ...(description !== undefined && { description }),
          },
        })

        return NextResponse.json(updated)
      }
    }
  } catch (error) {
    console.error('Erreur PUT /api/seminaires/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
