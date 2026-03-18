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
    const formateurId = searchParams.get('formateurId')
    const serie = searchParams.get('serie')

    const where: any = {}
    if (formationId) where.formationId = formationId
    if (formateurId) where.formateurId = formateurId
    if (serie) where.serie = parseInt(serie)

    const cours = await prisma.cours.findMany({
      where,
      include: {
        formation: { select: { id: true, nom: true } },
        formateur: { include: { user: { select: { nom: true, prenom: true } } } },
        uc: { select: { id: true, code: true, titre: true } },
        _count: { select: { participations: true } },
      },
      orderBy: [{ serie: 'asc' }, { numero: 'asc' }],
    })

    return NextResponse.json(cours)
  } catch (error) {
    console.error('Erreur GET /api/cours:', error)
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
    if (user.role !== 'ADMIN' && user.role !== 'FORMATEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { formationId, formateurId, ucId, serie, numero, titre, contenuObjectif, thematiquesElearning, duree, isPedagogique, datePrevisionnelle } = body

    if (!formationId || !formateurId || !titre) {
      return NextResponse.json({ error: 'formationId, formateurId et titre requis' }, { status: 400 })
    }

    const cours = await prisma.cours.create({
      data: {
        formationId,
        formateurId,
        ucId,
        serie: serie || 1,
        numero: numero || 1,
        titre,
        contenuObjectif,
        thematiquesElearning,
        duree: duree || 60,
        isPedagogique: isPedagogique || false,
        datePrevisionnelle: datePrevisionnelle ? new Date(datePrevisionnelle) : undefined,
      },
      include: {
        formation: { select: { id: true, nom: true } },
        formateur: { include: { user: { select: { nom: true, prenom: true } } } },
      },
    })

    return NextResponse.json(cours, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/cours:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
