import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const currentUser = session.user as any

    const count = await prisma.notification.count({
      where: { userId: currentUser.id, lu: false },
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Erreur GET /api/notifications/count:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
