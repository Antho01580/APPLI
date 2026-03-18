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
    const stagiaireId = searchParams.get('stagiaireId')

    const where: any = {}
    if (formationId) where.formationId = formationId

    const casPratiques = await prisma.casPratique.findMany({
      where,
      include: {
        formation: { select: { id: true, nom: true } },
        cours: { select: { id: true, titre: true, serie: true, numero: true } },
        rendus: stagiaireId
          ? { where: { stagiaireId }, include: { stagiaire: { include: { user: { select: { nom: true, prenom: true } } } } } }
          : { include: { stagiaire: { include: { user: { select: { nom: true, prenom: true } } } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(casPratiques)
  } catch (error) {
    console.error('Erreur GET /api/cas-pratiques:', error)
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
    const { formationId, coursId, titre, description, sujet, renduAttendu, heures, type } = body

    if (!formationId || !coursId || !titre) {
      return NextResponse.json({ error: 'formationId, coursId et titre requis' }, { status: 400 })
    }

    const casPratique = await prisma.casPratique.create({
      data: {
        formationId,
        coursId,
        titre,
        description,
        sujet,
        renduAttendu,
        heures: heures || 10,
        type: type || 'FICTIF',
      },
      include: {
        formation: { select: { id: true, nom: true } },
        cours: { select: { id: true, titre: true } },
      },
    })

    return NextResponse.json(casPratique, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/cas-pratiques:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
