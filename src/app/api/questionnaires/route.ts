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
    const type = searchParams.get('type') // 'initial', 'adaptation', 'reponse'

    if (!stagiaireId) {
      return NextResponse.json({ error: 'stagiaireId requis' }, { status: 400 })
    }

    const result: any = {}

    if (!type || type === 'initial') {
      result.initial = await prisma.questionnaireInitial.findUnique({
        where: { stagiaireId },
      })
    }

    if (!type || type === 'adaptation') {
      result.adaptation = await prisma.questionnaireAdaptation.findMany({
        where: { stagiaireId },
        include: { question: { include: { uc: { select: { code: true, titre: true } } } } },
        orderBy: { createdAt: 'desc' },
      })
    }

    if (!type || type === 'reponse') {
      result.reponses = await prisma.questionnaireReponse.findMany({
        where: { stagiaireId },
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur GET /api/questionnaires:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { type } = body

    switch (type) {
      case 'initial': {
        const { stagiaireId, nom, prenom, club, prerequis, besoinsClub, besoinPC, autresInfos } = body

        if (!stagiaireId || !nom || !prenom) {
          return NextResponse.json({ error: 'stagiaireId, nom et prenom requis' }, { status: 400 })
        }

        const questionnaire = await prisma.questionnaireInitial.upsert({
          where: { stagiaireId },
          create: {
            stagiaireId,
            nom,
            prenom,
            club: club || '',
            prerequis,
            besoinsClub,
            besoinPC: besoinPC || false,
            autresInfos,
          },
          update: {
            nom,
            prenom,
            club: club || '',
            prerequis,
            besoinsClub,
            besoinPC: besoinPC || false,
            autresInfos,
          },
        })

        // Update stagiaire besoinPC flag
        if (besoinPC !== undefined) {
          await prisma.stagiaire.update({
            where: { id: stagiaireId },
            data: { besoinPC },
          })
        }

        return NextResponse.json(questionnaire, { status: 201 })
      }

      case 'adaptation': {
        const { stagiaireId, questionId, reponse } = body

        if (!stagiaireId || !questionId || !reponse) {
          return NextResponse.json({ error: 'stagiaireId, questionId et reponse requis' }, { status: 400 })
        }

        const question = await prisma.questionAdaptation.findUnique({
          where: { id: questionId },
        })

        if (!question) {
          return NextResponse.json({ error: 'Question non trouvée' }, { status: 404 })
        }

        const estCorrect = reponse === question.bonneReponse

        const adaptationReponse = await prisma.questionnaireAdaptation.create({
          data: {
            stagiaireId,
            questionId,
            reponse,
            estCorrect,
          },
        })

        return NextResponse.json(adaptationReponse, { status: 201 })
      }

      case 'reponse': {
        const { stagiaireId, typeQuestionnaire, contenu, score } = body

        if (!stagiaireId || !typeQuestionnaire || !contenu) {
          return NextResponse.json({ error: 'stagiaireId, typeQuestionnaire et contenu requis' }, { status: 400 })
        }

        const reponse = await prisma.questionnaireReponse.create({
          data: {
            stagiaireId,
            type: typeQuestionnaire,
            contenu,
            score,
          },
        })

        return NextResponse.json(reponse, { status: 201 })
      }

      default:
        return NextResponse.json({ error: 'Type de questionnaire non reconnu' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erreur POST /api/questionnaires:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
