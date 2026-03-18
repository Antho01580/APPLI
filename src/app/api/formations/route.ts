import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formations = await prisma.formation.findMany({
      include: {
        unitesCompetences: true,
        _count: {
          select: { stagiaires: true, cours: true, seminaires: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(formations)
  } catch (error) {
    console.error('Erreur GET /api/formations:', error)
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
    const { nom, codeRNCP, volumeHoraire, description, referentielActivites, referentielEvaluation, unitesCompetences } = body

    if (!nom || !volumeHoraire) {
      return NextResponse.json({ error: 'Nom et volume horaire requis' }, { status: 400 })
    }

    const formation = await prisma.formation.create({
      data: {
        nom,
        codeRNCP,
        volumeHoraire,
        description,
        referentielActivites,
        referentielEvaluation,
        unitesCompetences: unitesCompetences?.length
          ? {
              create: unitesCompetences.map((uc: any) => ({
                code: uc.code,
                titre: uc.titre,
                description: uc.description,
              })),
            }
          : undefined,
      },
      include: { unitesCompetences: true },
    })

    return NextResponse.json(formation, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/formations:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
