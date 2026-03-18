import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const stagiaireId = formData.get('stagiaireId') as string

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type || 'documents')

    await mkdir(uploadDir, { recursive: true })
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    const publicPath = `/uploads/${type || 'documents'}/${filename}`

    // If stagiaireId and type are provided, create a DocumentAccueil record
    if (stagiaireId && type) {
      const document = await prisma.documentAccueil.create({
        data: {
          stagiaireId,
          type,
          fichier: publicPath,
          genere: false,
        },
      })

      return NextResponse.json({ document, path: publicPath }, { status: 201 })
    }

    return NextResponse.json({ path: publicPath }, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/documents:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
