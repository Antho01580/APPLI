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
    const stagiaireId = searchParams.get('stagiaireId')

    if (!stagiaireId) {
      return NextResponse.json({ error: 'stagiaireId requis' }, { status: 400 })
    }

    const missions = await prisma.missionUpdate.findMany({
      where: { stagiaireId },
      include: {
        stagiaire: { include: { user: { select: { nom: true, prenom: true } } } },
      },
      orderBy: { periode: 'asc' },
    })

    return NextResponse.json(missions)
  } catch (error) {
    console.error('Erreur GET /api/missions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { stagiaireId, contenu, periode } = body

    if (!stagiaireId || !contenu || periode === undefined) {
      return NextResponse.json({ error: 'stagiaireId, contenu et periode requis' }, { status: 400 })
    }

    const mission = await prisma.missionUpdate.create({
      data: {
        stagiaireId,
        contenu,
        periode,
      },
    })

    return NextResponse.json(mission, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/missions:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
