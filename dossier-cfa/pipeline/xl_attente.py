# -*- coding: utf-8 -*-
"""Compte d'attente 4710000 — feuille de collecte des pièces."""
import json, sys, datetime, collections, re
sys.path.insert(0, '.')
import openpyxl, xl, plan_cfa, match as _match, cascade
from xl import title, header, row, total, note, finish, BRIQUE, TEAL_P
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

E = json.load(open('gl_cfa.json'))
ATT = [e for e in E if e['compte'] == '4710000']
V = _match.charger_modele(cascade.XLSX); _match.apparier(ATT, V)
REL = json.load(open('releves.json'))['ops']
def d(s): return datetime.datetime.strptime(s, '%d/%m/%Y').date()
# ce que le relevé bancaire dit, quand il couvre la ligne
relidx = collections.defaultdict(list)
for o in REL: relidx[round(abs(o['montant']), 2)].append(o)
def releve_de(e):
    m = round(abs((e['debit'] or 0) - (e['credit'] or 0)), 2)
    for o in relidx.get(m, []):
        if abs((d(o['date_compta']) - d(e['date'])).days) <= 10:
            return f"{o['libelle']} — {o['motif']}" if o['motif'] else o['libelle']
    return ''

wb = openpyxl.Workbook(); ws = wb.active; ws.title = "À justifier"
r = title(ws, 1, "Compte d'attente 4710000 — les pièces à retrouver",
          "93 opérations, 18 227,40 €. Complétez les trois dernières colonnes : je repasse les écritures ensuite.")
r = header(ws, r, ['#', 'Date', 'Libellé du grand livre', 'Montant', 'Ce que dit le relevé bancaire',
                   'Nature que nous proposons', 'PIÈCE FOURNIE ?', 'NATURE RÉELLE', 'COMPTE À RETENIR'],
           [5, 11, 50, 12, 54, 44, 18, 34, 20],
           ['center', 'center', 'left', 'right', 'left', 'left', 'center', 'left', 'center'])
tot = 0.0
for i, e in enumerate(sorted(ATT, key=lambda e: -abs((e['debit'] or 0) - (e['credit'] or 0))), 1):
    m = round((e['debit'] or 0) - (e['credit'] or 0), 2); tot += m
    mt = e.get('match'); cfa = mt['cfa'] if mt else ''
    nat = f"{cfa} — {plan_cfa.PLAN.get(cfa,'')}" if cfa in plan_cfa.PLAN else (
        'lot carte — à éclater' if 'CARTE FACTURETTES' in e['libelle'].upper() else 'à identifier')
    r = row(ws, r, [i, e['date'], e['libelle'], m, releve_de(e), nat, '', '', ''],
            ['c', 'c', '', 'n', 'w', 'w', 'c', '', 'c'], color=(BRIQUE if m < 0 else None))
r = total(ws, r, ['', '', f'TOTAL — {len(ATT)} opérations', round(tot, 2), '', '', '', '', ''],
          ['', '', '', 'n', '', '', '', '', ''])
r = note(ws, r, "La colonne « relevé bancaire » n'est remplie que pour la période couverte par les cinq relevés "
                "que vous m'avez transmis (24/04 → 29/08/2025). Pour le reste de l'exercice, il me faut les "
                "relevés de septembre 2025 à juillet 2026.", 9)
r = note(ws, r, "Les lignes « CARTE FACTURETTES CB » sont des lots mensuels d'achats par carte. Le relevé bancaire "
                "ne les détaille pas non plus : il faut le relevé de la carte elle-même, ou les tickets.", 9)
finish(ws, freeze='A4'); ws.auto_filter.ref = f"A3:I{r-4}"

# --- second onglet : les corrections que le relevé impose
ws2 = wb.create_sheet("Corrections du relevé")
r = title(ws2, 1, "Ce que les relevés bancaires corrigent",
          "Sur les 103 opérations de la période, le grand livre boucle au centime. Mais deux imputations sont fausses et quelques libellés méritent d'être repris.")
r = header(ws2, r, ['Date', 'Montant', 'Libellé du grand livre', 'Ce que dit vraiment le relevé',
                    'Conséquence', 'Portée'], [11, 12, 48, 62, 56, 16],
           ['center', 'right', 'left', 'left', 'left', 'center'])
COR = [
 ('04/08/2025', -1508.17, 'EVI ANTHONY GRANDCLEMENT - RBT SUPABASE (NDF 08.2025)',
  'VIR INST HEYGEN — « Virement de SARL WE FORM · API Conso »',
  "Paiement direct à HeyGen, pas un remboursement à Anthony. Sort de ses notes de frais et du compte FFRAIS ; rejoint le compte fournisseur HeyGen.", 'IMPUTATION'),
 ('20/05/2025', -439.63, 'EVI ANTHONY GRANDCLEMENT FRAIS AVRIL',
  'VIR INST BOLT NEW — « Virement de Sarl We Form · APi FPC »',
  "Paiement direct à Bolt, pas un remboursement. Le motif « FPC » désigne la formation continue : la clé analytique est à revoir.", 'IMPUTATION'),
 ('24/07/2025', -45000.00, 'VIREMENT',
  'SARL WE FORM — « Virement vers Compte Opti Pro »',
  "Placement de trésorerie sur un compte d'épargne, repris le 26/07. L'aller-retour que j'avais signalé est justifié.", 'précision'),
 ('26/07/2025', 45000.00, 'VIREMENT VERSSARL WE FORM',
  'VIR SARL WE FORM — « Virement vers Compte Courant »',
  "Retour du placement.", 'précision'),
 ('15/08/2025', -358.51, 'VIR INST POUR ONEDIRECT COMMANDE WPF019671809 - CA',
  'VIR INST ONEDIRECT — « Commande WPF019671809 - CASQUEAU »',
  "Des casques. Cela tranche la question que je vous avais posée : c'est de l'équipement pédagogique (6068), pas de la fourniture administrative (6064).", 'COMPTE'),
 ('26/08/2025', -196.68, 'EVI NURYKA',
  'NURYKA — « Cartes etudiantes »',
  "Confirme le rattachement au 6068, premier équipement des apprentis.", 'confirmation'),
 ('19/08/2025', -15.00, 'VIR INST POUR CHARLOTTE CALLAND REMB OUTIL SEO SAR',
  'VIR INST Charlotte CALLA — « Pour Charlotte CALLAND · Remb Outil SEO »',
  "Justifie une des 93 lignes du compte d'attente : outil SEO, compte 6156.9.", 'ATTENTE'),
 ('24/05/2025', -3271.60, 'FRAIS DOSSIER',
  'FRAIS LIES A VOTRE PRET — « détaillés sur le contrat de prêt »',
  "Même nature, libellé à reprendre. Confirme le rattachement au 6272.", 'libellé'),
 ('12/07/2025', 41.44, 'ANNUL.FACT.CB',
  '100725 CB****9659 — « BOLT (BY STACKBUS SAN FRANCISCO) · 50,00 USD, 1 EURO = 1,173 »',
  "Annulation d'un achat Bolt de 50 USD, avec la commission remboursée de 1,17 € le même jour.", 'précision'),
 ('08/08/2025', -630.00, 'EVI FILIZ',
  'Filiz — « PLUHKGWJEBIBZZ »',
  "Le relevé ne donne qu'une référence technique : la facture Filiz reste à joindre.", 'à justifier'),
]
for c in COR:
    r = row(ws2, r, list(c), ['c', 'n', '', 'w', 'w', 'c'],
            color=(BRIQUE if c[5] in ('IMPUTATION', 'COMPTE') else None))
r = note(ws2, r, "Les 24 autres écarts de libellé sont cosmétiques : le cabinet a reformulé le libellé bancaire "
                 "sans changer ni le montant, ni la date, ni le sens. Ils sont sans conséquence comptable.", 6)
finish(ws2, cols=[11, 12, 48, 62, 56, 16])
wb.save('Compte_attente_a_justifier.xlsx')
print("Compte_attente_a_justifier.xlsx —", len(wb.sheetnames), "onglets |", len(ATT), "lignes |", round(tot,2))
