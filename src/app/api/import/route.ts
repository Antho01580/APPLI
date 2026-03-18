import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generatePlanning } from '@/lib/planning-generator'
import bcrypt from 'bcryptjs'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const currentUser = session.user as any
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows: any[] = XLSX.utils.sheet_to_json(sheet)

    if (!rows.length) {
      return NextResponse.json({ error: 'Le fichier est vide' }, { status: 400 })
    }

    const results: { success: any[]; errors: any[] } = { success: [], errors: [] }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        const { nom, prenom, email, dateNaissance, club, formation, dateDebutFormation, dateFinFormation, dateDebutContrat, dateFinContrat, format: formatType } = row

        if (!nom || !prenom || !email) {
          results.errors.push({ ligne: i + 2, error: 'Nom, prénom et email requis' })
          continue
        }

        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
          results.errors.push({ ligne: i + 2, email, error: 'Email déjà existant' })
          continue
        }

        // Find or create club
        let clubRecord = null
        if (club) {
          clubRecord = await prisma.club.findFirst({ where: { nom: club } })
          if (!clubRecord) {
            clubRecord = await prisma.club.create({ data: { nom: club } })
          }
        }

        // Find formation
        let formationRecord = null
        if (formation) {
          formationRecord = await prisma.formation.findFirst({ where: { nom: formation } })
          if (!formationRecord) {
            results.errors.push({ ligne: i + 2, email, error: `Formation "${formation}" non trouvée` })
            continue
          }
        }

        const tempPassword = Math.random().toString(36).slice(-8)
        const hashedPassword = await bcrypt.hash(tempPassword, 10)

        const parseDate = (val: any): Date | undefined => {
          if (!val) return undefined
          if (typeof val === 'number') {
            // Excel serial date
            const date = XLSX.SSF.parse_date_code(val)
            return new Date(date.y, date.m - 1, date.d)
          }
          const d = new Date(val)
          return isNaN(d.getTime()) ? undefined : d
        }

        const parsedDateDebutFormation = parseDate(dateDebutFormation)
        const parsedDateFinFormation = parseDate(dateFinFormation)
        const parsedDateDebutContrat = parseDate(dateDebutContrat)
        const parsedDateFinContrat = parseDate(dateFinContrat)
        const parsedDateNaissance = parseDate(dateNaissance)

        const result = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email,
              password: hashedPassword,
              nom,
              prenom,
              role: 'STAGIAIRE',
              isActive: false,
            },
          })

          const newStagiaire = await tx.stagiaire.create({
            data: {
              userId: newUser.id,
              dateNaissance: parsedDateNaissance,
              formationId: formationRecord?.id,
              clubId: clubRecord?.id,
              dateDebutFormation: parsedDateDebutFormation,
              dateFinFormation: parsedDateFinFormation,
              dateDebutContrat: parsedDateDebutContrat,
              dateFinContrat: parsedDateFinContrat,
              format: formatType,
            },
          })

          // Auto-generate planning if dates are available
          if (parsedDateDebutFormation && parsedDateFinFormation && formationRecord) {
            const planningItems = generatePlanning({
              dateDebutFormation: parsedDateDebutFormation,
              dateFinFormation: parsedDateFinFormation,
              volumeHoraire: formationRecord.volumeHoraire,
              nbSeries: 4,
              nbCoursParSerie: 10,
              dureeCours: 60,
              heuresCasPratique: 10,
              nbCasPratiques: 10,
            })

            for (const item of planningItems) {
              await tx.planning.create({
                data: {
                  stagiaireId: newStagiaire.id,
                  titre: item.titre,
                  type: item.type,
                  dateDebut: item.dateDebut,
                  dateFin: item.dateFin,
                  description: item.description,
                },
              })
            }
          }

          return { stagiaireId: newStagiaire.id, email, tempPassword }
        })

        results.success.push(result)
      } catch (err: any) {
        results.errors.push({ ligne: i + 2, error: err.message })
      }
    }

    return NextResponse.json({
      message: `Import terminé: ${results.success.length} succès, ${results.errors.length} erreurs`,
      ...results,
    })
  } catch (error) {
    console.error('Erreur POST /api/import:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
