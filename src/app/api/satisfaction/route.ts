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
    const type = searchParams.get('type')
    const periode = searchParams.get('periode')

    const where: any = {}
    if (stagiaireId) where.stagiaireId = stagiaireId
    if (type) where.type = type
    if (periode) where.periode = parseInt(periode)

    const reponses = await prisma.satisfactionReponse.findMany({
      where,
      include: {
        stagiaire: { include: { user: { select: { nom: true, prenom: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reponses)
  } catch (error) {
    console.error('Erreur GET /api/satisfaction:', error)
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
    const { stagiaireId, type, periode, reponses } = body

    if (!stagiaireId || !type || periode === undefined || !reponses) {
      return NextResponse.json({ error: 'stagiaireId, type, periode et reponses requis' }, { status: 400 })
    }

    const satisfaction = await prisma.satisfactionReponse.create({
      data: {
        stagiaireId,
        type,
        periode,
        reponses: typeof reponses === 'string' ? reponses : JSON.stringify(reponses),
      },
    })

    return NextResponse.json(satisfaction, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/satisfaction:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
