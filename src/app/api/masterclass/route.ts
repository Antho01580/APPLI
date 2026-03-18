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

    const masterclasses = await prisma.masterclass.findMany({
      where,
      include: {
        formation: { select: { id: true, nom: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(masterclasses)
  } catch (error) {
    console.error('Erreur GET /api/masterclass:', error)
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
    const { formationId, titre, description, date, duree, intervenant, lien, obligatoire } = body

    if (!titre || !date || !duree) {
      return NextResponse.json({ error: 'titre, date et duree requis' }, { status: 400 })
    }

    const masterclass = await prisma.masterclass.create({
      data: {
        formationId,
        titre,
        description,
        date: new Date(date),
        duree,
        intervenant,
        lien,
        obligatoire: obligatoire || false,
      },
      include: {
        formation: { select: { id: true, nom: true } },
      },
    })

    return NextResponse.json(masterclass, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/masterclass:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
