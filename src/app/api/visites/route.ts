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
    const clubId = searchParams.get('clubId')
    const type = searchParams.get('type')

    const where: any = {}
    if (clubId) where.clubId = clubId
    if (type) where.type = type

    const visites = await prisma.visite.findMany({
      where,
      include: {
        club: { select: { id: true, nom: true, ville: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(visites)
  } catch (error) {
    console.error('Erreur GET /api/visites:', error)
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
    const { clubId, type, date, compteRendu, organisePar } = body

    if (!clubId || !type || !date || !organisePar) {
      return NextResponse.json({ error: 'clubId, type, date et organisePar requis' }, { status: 400 })
    }

    const visite = await prisma.visite.create({
      data: {
        clubId,
        type,
        date: new Date(date),
        compteRendu,
        organisePar,
      },
      include: {
        club: { select: { id: true, nom: true, ville: true } },
      },
    })

    return NextResponse.json(visite, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/visites:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
