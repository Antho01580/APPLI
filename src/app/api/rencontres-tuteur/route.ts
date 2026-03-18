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
    const formateurId = searchParams.get('formateurId')
    const statut = searchParams.get('statut')

    const where: any = {}
    if (stagiaireId) where.stagiaireId = stagiaireId
    if (formateurId) where.formateurId = formateurId
    if (statut) where.statut = statut

    const rencontres = await prisma.rencontreTuteur.findMany({
      where,
      include: {
        stagiaire: { include: { user: { select: { nom: true, prenom: true } } } },
        formateur: { include: { user: { select: { nom: true, prenom: true } } } },
        tuteur: { include: { user: { select: { nom: true, prenom: true } } } },
      },
      orderBy: { numero: 'asc' },
    })

    return NextResponse.json(rencontres)
  } catch (error) {
    console.error('Erreur GET /api/rencontres-tuteur:', error)
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
    const { stagiaireId, formateurId, tuteurId, numero, datePrevisionnelle, dateRealisee, compteRendu, statut } = body

    if (!stagiaireId || !formateurId || !numero) {
      return NextResponse.json({ error: 'stagiaireId, formateurId et numero requis' }, { status: 400 })
    }

    const rencontre = await prisma.rencontreTuteur.create({
      data: {
        stagiaireId,
        formateurId,
        tuteurId,
        numero,
        datePrevisionnelle: datePrevisionnelle ? new Date(datePrevisionnelle) : undefined,
        dateRealisee: dateRealisee ? new Date(dateRealisee) : undefined,
        compteRendu,
        statut: statut || 'A_PROGRAMMER',
      },
      include: {
        stagiaire: { include: { user: { select: { nom: true, prenom: true } } } },
        formateur: { include: { user: { select: { nom: true, prenom: true } } } },
        tuteur: { include: { user: { select: { nom: true, prenom: true } } } },
      },
    })

    return NextResponse.json(rencontre, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/rencontres-tuteur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
