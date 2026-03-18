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

    let dossier = await prisma.dossierProfessionnel.findUnique({
      where: { stagiaireId },
      include: {
        elements: { orderBy: { createdAt: 'asc' } },
        stagiaire: { include: { user: { select: { nom: true, prenom: true } } } },
      },
    })

    if (!dossier) {
      // Auto-create if not exists
      dossier = await prisma.dossierProfessionnel.create({
        data: { stagiaireId },
        include: {
          elements: { orderBy: { createdAt: 'asc' } },
          stagiaire: { include: { user: { select: { nom: true, prenom: true } } } },
        },
      })
    }

    return NextResponse.json(dossier)
  } catch (error) {
    console.error('Erreur GET /api/dossier-professionnel:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const currentUser = session.user as any
    const body = await request.json()
    const { stagiaireId, contenu, journeeDedieeDate, journeeDedieeFaite, element } = body

    if (!stagiaireId) {
      return NextResponse.json({ error: 'stagiaireId requis' }, { status: 400 })
    }

    // Ensure dossier exists
    let dossier = await prisma.dossierProfessionnel.findUnique({
      where: { stagiaireId },
    })

    if (!dossier) {
      dossier = await prisma.dossierProfessionnel.create({
        data: { stagiaireId },
      })
    }

    // Add element if provided
    if (element) {
      await prisma.dossierProElement.create({
        data: {
          dossierId: dossier.id,
          titre: element.titre,
          contenu: element.contenu,
          ajoutePar: currentUser.name || currentUser.id,
        },
      })
    }

    // Update dossier fields
    const updated = await prisma.dossierProfessionnel.update({
      where: { id: dossier.id },
      data: {
        ...(contenu !== undefined && { contenu }),
        ...(journeeDedieeDate !== undefined && { journeeDedieeDate: journeeDedieeDate ? new Date(journeeDedieeDate) : null }),
        ...(journeeDedieeFaite !== undefined && { journeeDedieeFaite }),
        derniereMaj: new Date(),
      },
      include: {
        elements: { orderBy: { createdAt: 'asc' } },
        stagiaire: { include: { user: { select: { nom: true, prenom: true } } } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erreur PUT /api/dossier-professionnel:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
