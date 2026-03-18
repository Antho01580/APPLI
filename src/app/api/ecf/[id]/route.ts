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

    const ecf = await prisma.eCF.findUnique({
      where: { id: params.id },
      include: {
        formation: { select: { id: true, nom: true } },
        rendus: {
          include: {
            stagiaire: { include: { user: { select: { nom: true, prenom: true, email: true } } } },
          },
        },
      },
    })

    if (!ecf) {
      return NextResponse.json({ error: 'ECF non trouvé' }, { status: 404 })
    }

    return NextResponse.json(ecf)
  } catch (error) {
    console.error('Erreur GET /api/ecf/[id]:', error)
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
      case 'soumettre': {
        const { stagiaireId, fichierRendu } = body

        if (!stagiaireId) {
          return NextResponse.json({ error: 'stagiaireId requis' }, { status: 400 })
        }

        const rendu = await prisma.eCFRendu.update({
          where: { ecfId_stagiaireId: { ecfId: params.id, stagiaireId } },
          data: {
            fichierRendu,
            dateRendu: new Date(),
            statut: 'RENDU',
          },
        })

        return NextResponse.json(rendu)
      }

      case 'corriger': {
        const { stagiaireId: stagId, correctionFormateur } = body

        if (!stagId) {
          return NextResponse.json({ error: 'stagiaireId requis' }, { status: 400 })
        }

        const rendu = await prisma.eCFRendu.update({
          where: { ecfId_stagiaireId: { ecfId: params.id, stagiaireId: stagId } },
          data: {
            correctionFormateur,
            dateCorrection: new Date(),
            statut: 'CORRIGE',
          },
        })

        return NextResponse.json(rendu)
      }

      case 'date_jury': {
        const { stagiaireId: sId, dateJury } = body

        if (!sId || !dateJury) {
          return NextResponse.json({ error: 'stagiaireId et dateJury requis' }, { status: 400 })
        }

        const rendu = await prisma.eCFRendu.update({
          where: { ecfId_stagiaireId: { ecfId: params.id, stagiaireId: sId } },
          data: {
            dateJury: new Date(dateJury),
            statut: 'JURY_PLANIFIE',
          },
        })

        return NextResponse.json(rendu)
      }

      case 'ouvrir': {
        const { stagiaireId: openStagId, dateOuverture, dateLimite } = body

        if (!openStagId) {
          return NextResponse.json({ error: 'stagiaireId requis' }, { status: 400 })
        }

        const ecf = await prisma.eCF.findUnique({ where: { id: params.id } })
        if (!ecf) {
          return NextResponse.json({ error: 'ECF non trouvé' }, { status: 404 })
        }

        const ouverture = dateOuverture ? new Date(dateOuverture) : new Date()
        const limite = dateLimite
          ? new Date(dateLimite)
          : new Date(ouverture.getTime() + ecf.delaiSemaines * 7 * 24 * 60 * 60 * 1000)

        const rendu = await prisma.eCFRendu.upsert({
          where: { ecfId_stagiaireId: { ecfId: params.id, stagiaireId: openStagId } },
          create: {
            ecfId: params.id,
            stagiaireId: openStagId,
            dateOuverture: ouverture,
            dateLimite: limite,
            statut: 'OUVERT',
          },
          update: {
            dateOuverture: ouverture,
            dateLimite: limite,
            statut: 'OUVERT',
          },
        })

        return NextResponse.json(rendu)
      }

      default: {
        const { titre, sujet, delaiSemaines } = body

        const updated = await prisma.eCF.update({
          where: { id: params.id },
          data: {
            ...(titre !== undefined && { titre }),
            ...(sujet !== undefined && { sujet }),
            ...(delaiSemaines !== undefined && { delaiSemaines }),
          },
        })

        return NextResponse.json(updated)
      }
    }
  } catch (error) {
    console.error('Erreur PUT /api/ecf/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
