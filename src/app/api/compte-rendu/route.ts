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

    const compteRendu = await prisma.compteRenduEntretien.findUnique({
      where: { stagiaireId },
      include: {
        stagiaire: { include: { user: { select: { nom: true, prenom: true } } } },
      },
    })

    if (!compteRendu) {
      return NextResponse.json({ error: 'Compte-rendu non trouvé' }, { status: 404 })
    }

    return NextResponse.json(compteRendu)
  } catch (error) {
    console.error('Erreur GET /api/compte-rendu:', error)
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
    const { stagiaireId, commercial, contenu, prerequisValides, dateEntretien } = body

    if (!stagiaireId || !commercial || !contenu || !dateEntretien) {
      return NextResponse.json({ error: 'stagiaireId, commercial, contenu et dateEntretien requis' }, { status: 400 })
    }

    const compteRendu = await prisma.compteRenduEntretien.upsert({
      where: { stagiaireId },
      create: {
        stagiaireId,
        commercial,
        contenu,
        prerequisValides: prerequisValides || false,
        dateEntretien: new Date(dateEntretien),
      },
      update: {
        commercial,
        contenu,
        prerequisValides: prerequisValides || false,
        dateEntretien: new Date(dateEntretien),
      },
      include: {
        stagiaire: { include: { user: { select: { nom: true, prenom: true } } } },
      },
    })

    // Update prerequis flag on stagiaire if validated
    if (prerequisValides) {
      await prisma.stagiaire.update({
        where: { id: stagiaireId },
        data: { prerequisValides: true },
      })
    }

    return NextResponse.json(compteRendu, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/compte-rendu:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
