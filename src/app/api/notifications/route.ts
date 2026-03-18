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
    const limit = parseInt(searchParams.get('limit') || '50')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const where: any = { userId: currentUser.id }
    if (unreadOnly) where.lu = false

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Erreur GET /api/notifications:', error)
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
    const { notificationId, markAllRead } = body

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: currentUser.id, lu: false },
        data: { lu: true },
      })
      return NextResponse.json({ message: 'Toutes les notifications marquées comme lues' })
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId requis' }, { status: 400 })
    }

    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId: currentUser.id },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification non trouvée' }, { status: 404 })
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { lu: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erreur PUT /api/notifications:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
