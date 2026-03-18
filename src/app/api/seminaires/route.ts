import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const formationId = searchParams.get('formationId')

    const where: any = {}
    if (formationId) where.formationId = formationId

    const seminaires = await prisma.seminaire.findMany({
      where,
      include: {
        formation: { select: { id: true, nom: true } },
        presences: {
          include: {
            formateur: { include: { user: { select: { nom: true, prenom: true } } } },
          },
        },
        _count: { select: { emargements: true } },
      },
      orderBy: { dateDebut: 'desc' },
    })

    return NextResponse.json(seminaires)
  } catch (error) {
    console.error('Erreur GET /api/seminaires:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = session.user as any
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { formationId, titre, dateDebut, dateFin, dureeJours, heuresParJour, lieu, description } = body

    if (!formationId || !titre || !dateDebut || !dateFin) {
      return NextResponse.json({ error: 'formationId, titre, dateDebut et dateFin requis' }, { status: 400 })
    }

    const seminaire = await prisma.$transaction(async (tx) => {
      const newSeminaire = await tx.seminaire.create({
        data: {
          formationId,
          titre,
          dateDebut: new Date(dateDebut),
          dateFin: new Date(dateFin),
          dureeJours: dureeJours || 4.5,
          heuresParJour: heuresParJour || 10,
          lieu,
          description,
        },
      })

      // Auto-notify all formateurs by creating presence records
      const formateurs = await tx.formateur.findMany({
        select: { id: true, userId: true },
      })

      for (const formateur of formateurs) {
        await tx.seminairePresence.create({
          data: {
            seminaireId: newSeminaire.id,
            formateurId: formateur.id,
            present: null, // Awaiting response
          },
        })

        // Create notification for each formateur
        await tx.notification.create({
          data: {
            userId: formateur.userId,
            titre: 'Nouveau séminaire',
            contenu: `Un nouveau séminaire "${titre}" a été planifié. Merci de confirmer votre présence.`,
            type: 'SEMINAIRE',
            lien: `/seminaires/${newSeminaire.id}`,
          },
        })
      }

      return newSeminaire
    })

    const result = await prisma.seminaire.findUnique({
      where: { id: seminaire.id },
      include: {
        formation: { select: { id: true, nom: true } },
        presences: {
          include: {
            formateur: { include: { user: { select: { nom: true, prenom: true } } } },
          },
        },
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/seminaires:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
