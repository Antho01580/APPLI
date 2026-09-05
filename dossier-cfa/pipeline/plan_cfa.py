# -*- coding: utf-8 -*-
"""Plan comptable CFA WE-FORM — codes et intitulés repris du dossier analytique."""

PLAN = {
 # --- classe 1
 '101':     'Capital social',
 '106':     'Réserves',
 '164':     'Emprunts auprès des établissements de crédit',
 # --- classe 2
 '205':     'Concessions, brevets, licences et logiciels',
 '2183':    'Matériel de bureau et matériel informatique',
 # --- classe 4
 '401':     'Fournisseurs',
 '411':     'Clients — OPCO et financeurs',
 '411.2':   'Clients — entreprises (reste à charge)',
 '418':     'Clients — produits acquis non encore facturés',
 '421':     'Personnel — rémunérations dues',
 '428':     'Personnel — charges à payer',
 '431':     'Sécurité sociale',
 '437':     'Autres organismes sociaux',
 '438':     'Organismes sociaux — charges à payer',
 '442':     'État — prélèvement à la source',
 '448':     'État — charges à payer',
 '4551':    "Comptes courants d'associés",
 '471':     "Compte d'attente",
 '487':     "Produits constatés d'avance",
 # --- classe 5
 '512':     'Banque',
 '530':     'Caisse',
 '580':     'Virements internes',
 # --- classe 6 : coûts pédagogiques
 '6022.1':  "Achats stockés de matière d'œuvre de formation — Apprentissage",
 '6022.2':  "Achats stockés de matière d'œuvre de formation — Formation continue",
 '604.1':   'Achats de prestations de formation — Apprentissage',
 '604.11':  '…dont cotraitance — Apprentissage',
 '604.12':  '…dont sous-traitance — Apprentissage',
 '604.2':   'Achats de prestations de formation — Formation continue',
 '6064':    'Fournitures administratives et petit équipement',
 '6068':    'Premier équipement pédagogique des apprentis',
 '611':     'Achats en sous-traitance (non pédagogique)',
 # --- classe 6 : moyens
 '6132.1':  'Locations immobilières liées à la formation — Apprentissage',
 '6132.9':  'Locations immobilières — communes',
 '615':     'Entretien et réparations',
 '6156.2':  'Abonnements et développements informatiques — ventilés par clé',
 '6156.9':  'Maintenance, abonnements et licences informatiques — communs',
 '616':     "Primes d'assurance",
 '622':     "Rémunérations d'intermédiaires — courtage sur financement",
 '6226.1':  'Honoraires de formation — Apprentissage',
 '6226.2':  'Honoraires de formation — Formation continue',
 '6226.3':  'Honoraires de formation — sous-traitance Ligue AURA',
 '6226.9':  'Autres honoraires (expert-comptable, avocat, certification)',
 '623':     'Publicité, communication et promotion',
 '6238':    'Dons, mécénat et relations publiques',
 '6251':    'Déplacements des apprentis — mobilité et ultramarins',
 '6256.9':  'Déplacements, missions et réceptions — administration et direction',
 '6257':    'Restauration et hébergement des apprentis',
 '626':     'Frais postaux et de télécommunications',
 '627':     'Services bancaires et assimilés',
 '6272':    'Commissions et frais sur emprunt',
 '635':     'Autres impôts, taxes et versements assimilés',
 # --- classe 6 : personnel
 '6411.11': 'Salaires — formateurs permanents Apprentissage',
 '6411.12': 'Salaires — autres formateurs Apprentissage',
 '6411.21': 'Salaires — formateurs permanents Formation continue',
 '6411.9':  'Autres salaires — administration et direction',
 '644':     'Rémunération des gérants',
 '645.1':   'Charges sociales — personnel Apprentissage',
 '645.2':   'Charges sociales — personnel Formation continue',
 '645.9':   'Charges sociales — administration et direction',
 '646':     'Cotisations sociales personnelles des gérants (TNS)',
 '658':     'Charges diverses de gestion courante',
 '661':     "Charges d'intérêts",
 # --- classe 7
 '706.11':  'Prestations de formation — Apprentissage, NPEC facturé aux OPCO',
 '706.21':  'Prestations de formation — Formation continue, entreprises et OPCO',
 '706.4':   'Prestations de formation en sous-traitance',
 '708':     'Produits des activités annexes',
 '74.9':    "Aide unique à l'employeur d'apprentis (ASP) — hors périmètre CFA",
}

# Ordre de présentation au grand-livre et à la balance
ORDRE = ['101','106','164','205','2183','401','411','411.2','418','421','428','431','437','438',
         '442','448','4551','471','487','512','530','580',
         '6022.1','6022.2','604.1','604.11','604.12','604.2','6064','6068','611',
         '6132.1','6132.9','615','6156.2','6156.9','616','622','6226.1','6226.2','6226.3','6226.9',
         '623','6238','6251','6256.9','6257','626','627','6272','635',
         '6411.11','6411.12','6411.21','6411.9','644','645.1','645.2','645.9','646','658','661',
         '706.11','706.21','706.4','708','74.9']

def classe(code):
    c = code[0]
    return {'1':'1','2':'2','4':'4','5':'5','6':'6','7':'7'}.get(c,'6')
