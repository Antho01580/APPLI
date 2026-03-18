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
    const correspondantId = searchParams.get('correspondantId')

    if (correspondantId) {
      // Get conversation with a specific user
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: currentUser.id, receiverId: correspondantId },
            { senderId: correspondantId, receiverId: currentUser.id },
          ],
        },
        include: {
          sender: { select: { id: true, nom: true, prenom: true, photo: true } },
          receiver: { select: { id: true, nom: true, prenom: true, photo: true } },
        },
        orderBy: { createdAt: 'asc' },
      })

      // Mark received messages as read
      await prisma.message.updateMany({
        where: {
          senderId: correspondantId,
          receiverId: currentUser.id,
          lu: false,
        },
        data: { lu: true },
      })

      return NextResponse.json(messages)
    }

    // Get conversations list (latest message per conversation)
    const sentMessages = await prisma.message.findMany({
      where: { senderId: currentUser.id },
      select: { receiverId: true },
      distinct: ['receiverId'],
    })

    const receivedMessages = await prisma.message.findMany({
      where: { receiverId: currentUser.id },
      select: { senderId: true },
      distinct: ['senderId'],
    })

    const contactIdsArray = Array.from(new Set([
      ...sentMessages.map((m) => m.receiverId),
      ...receivedMessages.map((m) => m.senderId),
    ]))

    const conversations = []

    for (const contactId of contactIdsArray) {
      const lastMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: currentUser.id, receiverId: contactId },
            { senderId: contactId, receiverId: currentUser.id },
          ],
        },
        include: {
          sender: { select: { id: true, nom: true, prenom: true, photo: true } },
          receiver: { select: { id: true, nom: true, prenom: true, photo: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      const unreadCount = await prisma.message.count({
        where: {
          senderId: contactId,
          receiverId: currentUser.id,
          lu: false,
        },
      })

      if (lastMessage) {
        const contact = contactId === lastMessage.senderId ? lastMessage.sender : lastMessage.receiver
        conversations.push({
          contact,
          lastMessage,
          unreadCount,
        })
      }
    }

    conversations.sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime())

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Erreur GET /api/messages:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const currentUser = session.user as any
    const body = await request.json()
    const { receiverId, contenu, type } = body

    if (!receiverId || !contenu) {
      return NextResponse.json({ error: 'receiverId et contenu requis' }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        senderId: currentUser.id,
        receiverId,
        contenu,
        type: type || 'MESSAGE',
      },
      include: {
        sender: { select: { id: true, nom: true, prenom: true, photo: true } },
        receiver: { select: { id: true, nom: true, prenom: true, photo: true } },
      },
    })

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        titre: 'Nouveau message',
        contenu: `${currentUser.name} vous a envoyé un message`,
        type: 'MESSAGE',
        lien: `/messages?correspondantId=${currentUser.id}`,
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/messages:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
