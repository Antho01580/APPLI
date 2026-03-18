import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const formationId = searchParams.get('formationId')
    const search = searchParams.get('search')
    const formateurId = searchParams.get('formateurId')

    const where: any = {}

    if (formationId) {
      where.formationId = formationId
    }

    if (formateurId) {
      where.formateurId = formateurId
    }

    if (search) {
      where.user = {
        OR: [
          { nom: { contains: search } },
          { prenom: { contains: search } },
          { email: { contains: search } },
        ],
      }
    }

    const stagiaires = await prisma.stagiaire.findMany({
      where,
      include: {
        user: { select: { id: true, nom: true, prenom: true, email: true, telephone: true, photo: true, isActive: true } },
        formation: { select: { id: true, nom: true } },
        formateur: { include: { user: { select: { nom: true, prenom: true } } } },
        tuteur: { include: { user: { select: { nom: true, prenom: true } } } },
        club: { select: { id: true, nom: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(stagiaires)
  } catch (error) {
    console.error('Erreur GET /api/stagiaires:', error)
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
    const { nom, prenom, email, telephone, dateNaissance, adresse, codePostal, ville, formationId, formateurId, tuteurId, clubId, dateDebutContrat, dateFinContrat, dateDebutFormation, dateFinFormation, format: formatType } = body

    if (!nom || !prenom || !email) {
      return NextResponse.json({ error: 'Nom, prénom et email requis' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Un utilisateur avec cet email existe déjà' }, { status: 409 })
    }

    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    const stagiaire = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          nom,
          prenom,
          telephone,
          role: 'STAGIAIRE',
          isActive: false,
        },
      })

      const newStagiaire = await tx.stagiaire.create({
        data: {
          userId: newUser.id,
          dateNaissance: dateNaissance ? new Date(dateNaissance) : undefined,
          adresse,
          codePostal,
          ville,
          formationId,
          formateurId,
          tuteurId,
          clubId,
          dateDebutContrat: dateDebutContrat ? new Date(dateDebutContrat) : undefined,
          dateFinContrat: dateFinContrat ? new Date(dateFinContrat) : undefined,
          dateDebutFormation: dateDebutFormation ? new Date(dateDebutFormation) : undefined,
          dateFinFormation: dateFinFormation ? new Date(dateFinFormation) : undefined,
          format: formatType,
        },
        include: {
          user: { select: { id: true, nom: true, prenom: true, email: true } },
          formation: { select: { id: true, nom: true } },
        },
      })

      return newStagiaire
    })

    return NextResponse.json({ ...stagiaire, tempPassword }, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/stagiaires:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
