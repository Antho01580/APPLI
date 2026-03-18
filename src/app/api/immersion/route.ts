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
    const statut = searchParams.get('statut')

    const where: any = {}
    if (stagiaireId) where.stagiaireId = stagiaireId
    if (statut) where.statut = statut

    const demandes = await prisma.demandeImmersion.findMany({
      where,
      include: {
        stagiaire: { include: { user: { select: { nom: true, prenom: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(demandes)
  } catch (error) {
    console.error('Erreur GET /api/immersion:', error)
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
    const { stagiaireId, entreprise, nbJours, datesSouhaitees, motif } = body

    if (!stagiaireId || !entreprise || !nbJours) {
      return NextResponse.json({ error: 'stagiaireId, entreprise et nbJours requis' }, { status: 400 })
    }

    const demande = await prisma.demandeImmersion.create({
      data: {
        stagiaireId,
        entreprise,
        nbJours,
        datesSouhaitees,
        motif,
        statut: 'EN_ATTENTE',
      },
      include: {
        stagiaire: { include: { user: { select: { nom: true, prenom: true } } } },
      },
    })

    return NextResponse.json(demande, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/immersion:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
