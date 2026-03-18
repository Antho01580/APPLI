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

    const plannings = await prisma.planning.findMany({
      where: { stagiaireId },
      orderBy: { dateDebut: 'asc' },
    })

    return NextResponse.json(plannings)
  } catch (error) {
    console.error('Erreur GET /api/planning:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
