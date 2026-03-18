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

    const currentUser = session.user as any
    const { searchParams } = new URL(request.url)
    const formateurId = searchParams.get('formateurId')
    const mois = searchParams.get('mois')
    const annee = searchParams.get('annee')
    const statut = searchParams.get('statut')

    const where: any = {}

    // If formateur, only show their own factures
    if (currentUser.role === 'FORMATEUR') {
      const formateur = await prisma.formateur.findUnique({ where: { userId: currentUser.id } })
      if (formateur) where.formateurId = formateur.id
    } else if (formateurId) {
      where.formateurId = formateurId
    }

    if (mois) where.mois = parseInt(mois)
    if (annee) where.annee = parseInt(annee)
    if (statut) where.statut = statut

    const factures = await prisma.facture.findMany({
      where,
      include: {
        formateur: { include: { user: { select: { nom: true, prenom: true, email: true } } } },
      },
      orderBy: [{ annee: 'desc' }, { mois: 'desc' }],
    })

    return NextResponse.json(factures)
  } catch (error) {
    console.error('Erreur GET /api/factures:', error)
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
    const { formateurId, mois, annee, nbHeures, fichierFacture, statut } = body

    if (!formateurId || !mois || !annee) {
      return NextResponse.json({ error: 'formateurId, mois et annee requis' }, { status: 400 })
    }

    const facture = await prisma.facture.create({
      data: {
        formateurId,
        mois,
        annee,
        nbHeures: nbHeures || 0,
        fichierFacture,
        statut: statut || 'BROUILLON',
      },
      include: {
        formateur: { include: { user: { select: { nom: true, prenom: true } } } },
      },
    })

    return NextResponse.json(facture, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/factures:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
