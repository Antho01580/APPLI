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

    const casPratique = await prisma.casPratique.findUnique({
      where: { id: params.id },
      include: {
        formation: { select: { id: true, nom: true } },
        cours: { select: { id: true, titre: true, serie: true, numero: true } },
        rendus: {
          include: {
            stagiaire: { include: { user: { select: { nom: true, prenom: true, email: true } } } },
          },
        },
      },
    })

    if (!casPratique) {
      return NextResponse.json({ error: 'Cas pratique non trouvé' }, { status: 404 })
    }

    return NextResponse.json(casPratique)
  } catch (error) {
    console.error('Erreur GET /api/cas-pratiques/[id]:', error)
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
      case 'soumettre_rendu': {
        const { stagiaireId, fichierRendu } = body

        if (!stagiaireId) {
          return NextResponse.json({ error: 'stagiaireId requis' }, { status: 400 })
        }

        const rendu = await prisma.casPratiqueRendu.upsert({
          where: { casPratiqueId_stagiaireId: { casPratiqueId: params.id, stagiaireId } },
          create: {
            casPratiqueId: params.id,
            stagiaireId,
            fichierRendu,
            dateRendu: new Date(),
            statut: 'RENDU',
          },
          update: {
            fichierRendu,
            dateRendu: new Date(),
            statut: 'RENDU',
          },
        })

        return NextResponse.json(rendu)
      }

      case 'corriger': {
        const { stagiaireId: stagId, commentaireFormateur, correctionFichier } = body

        if (!stagId) {
          return NextResponse.json({ error: 'stagiaireId requis' }, { status: 400 })
        }

        const rendu = await prisma.casPratiqueRendu.update({
          where: { casPratiqueId_stagiaireId: { casPratiqueId: params.id, stagiaireId: stagId } },
          data: {
            commentaireFormateur,
            correctionFichier,
            dateCorrection: new Date(),
            statut: 'CORRIGE',
          },
        })

        return NextResponse.json(rendu)
      }

      default: {
        // Update the cas pratique itself
        const { titre, description, sujet, renduAttendu, heures, type } = body

        const updated = await prisma.casPratique.update({
          where: { id: params.id },
          data: {
            ...(titre !== undefined && { titre }),
            ...(description !== undefined && { description }),
            ...(sujet !== undefined && { sujet }),
            ...(renduAttendu !== undefined && { renduAttendu }),
            ...(heures !== undefined && { heures }),
            ...(type !== undefined && { type }),
          },
        })

        return NextResponse.json(updated)
      }
    }
  } catch (error) {
    console.error('Erreur PUT /api/cas-pratiques/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
