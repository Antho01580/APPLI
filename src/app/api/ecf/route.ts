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

    const ecfs = await prisma.eCF.findMany({
      where,
      include: {
        formation: { select: { id: true, nom: true } },
        rendus: stagiaireId
          ? { where: { stagiaireId }, include: { stagiaire: { include: { user: { select: { nom: true, prenom: true } } } } } }
          : { include: { stagiaire: { include: { user: { select: { nom: true, prenom: true } } } } } },
      },
      orderBy: { numero: 'asc' },
    })

    return NextResponse.json(ecfs)
  } catch (error) {
    console.error('Erreur GET /api/ecf:', error)
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
    const { formationId, numero, titre, sujet, delaiSemaines } = body

    if (!formationId || !numero || !titre) {
      return NextResponse.json({ error: 'formationId, numero et titre requis' }, { status: 400 })
    }

    const ecf = await prisma.eCF.create({
      data: {
        formationId,
        numero,
        titre,
        sujet,
        delaiSemaines: delaiSemaines || 3,
      },
      include: {
        formation: { select: { id: true, nom: true } },
      },
    })

    return NextResponse.json(ecf, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/ecf:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
