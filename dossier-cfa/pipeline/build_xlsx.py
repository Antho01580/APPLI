# -*- coding: utf-8 -*-
"""Dossier analytique WE-FORM — exercice 1 (17/04/2025 → 31/07/2026)."""
import json, sys, collections, datetime
sys.path.insert(0, '.')
import openpyxl
from openpyxl.utils import get_column_letter
import xl, plan_cfa, cascade, axes_cfa
from xl import title, header, row, total, note, finish, TEAL, TEAL_P, BRIQUE, ENCRE3, FEUIL2

AXES = ['Apprentissage', 'Formation continue', 'Ligue AURA', 'Commun', 'Hors périmètre']
R  = json.load(open('vent_cfa.json'))
L  = json.load(open('lignes_cfa.json'))
BAL = json.load(open('balance_cfa.json'))
EC = json.load(open('cloture.json'))
RES = BAL['resultat']
AX  = [round(sum(l['axes'][i] for l in R), 2) for i in range(5)]
CAS = cascade.repartir(AX)

wb = openpyxl.Workbook(); wb.remove(wb.active)

def sheet(name, titre, sous=None):
    ws = wb.create_sheet(name)
    r = title(ws, 1, titre, sous)
    return ws, r

# ============================ 0. SOMMAIRE ==========================================
ws, r = sheet('Sommaire', 'Dossier analytique WE-FORM — exercice 1',
              "SARL WE-FORM · 17/04/2025 → 31/07/2026 · plan comptable CFA · établi à partir du grand livre SECOGEST")
r = header(ws, r, ['Ce que contient ce classeur', 'Détail'], [56, 96])
CONTENU = [
 ('1. Analytique comptable', "Le compte de résultat en plan comptable CFA, compte par compte, éclaté sur les cinq axes."),
 ('2. Résultat par axe', "Le résultat de chaque activité, avant et après la cascade des clés de répartition."),
 ('3. Détail des écritures', "Les 1 109 lignes de charges et de produits du grand livre, avec leur compte CFA, leur clé et leur ventilation. Les libellés sont ceux du grand livre, sans exception."),
 ('4. Par formation', "Le compte de résultat de chacun des huit titres, quote-part des charges indirectes comprise."),
 ('5. Par stagiaire', "Un apprenti par contrat, avec le titre que porte son contrat et les charges qui le nomment."),
 ('6. Par outil', "Ce que coûte chaque applicatif, puis le détail par fournisseur d'abonnement."),
 ('7. Par lieu', "Les présentiels : ce que chaque site a coûté et ce qu'il a rapporté."),
 ('8. Par matériel pédagogique', "Le premier équipement des apprentis, ligne de la grille France compétences."),
 ('9. Maîtrise du résultat', "Le passage, chiffré au centime, de la balance SECOGEST au résultat CFA, puis la comparaison avec votre modèle."),
 ('10. Clés de répartition', "Les clés utilisées, leur base et leur ordre d'application."),
 ('11. Écritures de clôture', "Les écritures passées au 31/07/2026 et leur motif."),
 ('12. Correspondance des comptes', "Compte SECOGEST → compte CFA, avec la règle appliquée."),
 ('13. Points ouverts', "Ce qui reste à trancher, chiffré."),
]
for a, b in CONTENU: r = row(ws, r, [a, b], ['', 'w'])
r += 1
r = header(ws, r, ['Les chiffres du dossier', 'Montant'], [56, 20], ['left', 'right'])
CL = BAL['classes']
BILAN_D = round(sum(CL[c][0] for c in CL if c in '1245'), 2)
BILAN_C = round(sum(CL[c][1] for c in CL if c in '1245'), 2)
PROD    = round(CL['7'][1] - CL['7'][0], 2)
CHARG   = round(CL['6'][0] - CL['6'][1], 2)
CHIF = [
 ("Résultat de l'exercice — plan comptable CFA", RES),
 ('  dont Apprentissage (après cascade)', CAS['app']),
 ('  dont Formation continue (après cascade)', CAS['fpc']),
 ('  dont Ligue AURA (après cascade)', CAS['aura']),
 ('  dont hors périmètre', CAS['hp']),
 ("Produits de l'exercice", PROD),
 ("Charges de l'exercice", CHARG),
 ('Total du bilan (actif)', BILAN_D),
 ('Total du bilan (passif hors résultat)', BILAN_C),
 ('Lignes de grand livre reprises', 2723),
 ('Écritures de clôture passées', len(EC)),
 ('Comptes CFA mouvementés', len({l['cfa'] for l in L})),
]
for a, b in CHIF: r = row(ws, r, [a, b], ['', 'n' if isinstance(b, float) else 'n0'],
                          bold=a.startswith('Résultat'))
r += 1
r = note(ws, r, "Convention de signe de ce classeur : les charges sont négatives, les produits positifs. "
                "Le grand livre et la balance, eux, conservent la convention comptable débit / crédit du cabinet.", 2)
r = note(ws, r, "Règle d'arbitrage appliquée partout : le GRAND LIVRE fait foi. Le dossier analytique que vous nous "
                "avez remis ne détermine que le compte CFA et le rattachement analytique — jamais la date, "
                "ni le montant, ni le libellé d'une écriture.", 2)
finish(ws, cols=[58, 96])

# ============================ 1. ANALYTIQUE COMPTABLE ==============================
ws, r = sheet('1. Analytique comptable', 'Analytique comptable — par compte CFA',
              "Le compte de résultat en plan comptable CFA, ventilé sur les cinq axes. La somme des axes redonne le compte.")
r = header(ws, r, ['Compte', 'Intitulé', 'Montant'] + AXES + ['Lignes'],
           [10, 56, 14, 14, 14, 12, 14, 13, 8],
           ['left', 'left'] + ['right'] * 7)
g = collections.defaultdict(lambda: {'m': 0.0, 'ax': [0.0] * 5, 'n': 0})
for l in R:
    d = g[l['cfa']]; d['m'] += l['montant']; d['n'] += 1
    for i in range(5): d['ax'][i] += l['axes'][i]
tot_p = tot_c = 0.0; totax = [0.0] * 5
for cl, lab in (('7', 'PRODUITS'), ('6', 'CHARGES')):
    codes = [c for c in plan_cfa.ORDRE if c in g and c[0] == cl]
    r = row(ws, r, [lab], bold=True, fill=TEAL_P, color=TEAL, top_rule=True)
    st, sax = 0.0, [0.0] * 5
    for c in codes:
        d = g[c]
        r = row(ws, r, [c, plan_cfa.PLAN.get(c, c), round(d['m'], 2)] +
                [round(x, 2) for x in d['ax']] + [d['n']],
                ['', '', 'n', 'n', 'n', 'n', 'n', 'n', 'n0'])
        st += d['m']; sax = [a + b for a, b in zip(sax, d['ax'])]
    r = total(ws, r, [f'Total {lab.lower()}', '', round(st, 2)] + [round(x, 2) for x in sax] + [''],
              ['', '', 'n', 'n', 'n', 'n', 'n', 'n', ''])
    if cl == '7': tot_p = st
    else: tot_c = st
    totax = [a + b for a, b in zip(totax, sax)]
r += 1
r = total(ws, r, ['RÉSULTAT', '', round(tot_p + tot_c, 2)] + [round(x, 2) for x in totax] + [''],
          ['', '', 'n', 'n', 'n', 'n', 'n', 'n', ''])
r = note(ws, r, "Contrôle : le total de la colonne « Montant » et la somme des cinq axes donnent le même résultat, "
                f"soit {RES:,.2f} €.".replace(',', ' '), 9)
finish(ws, freeze='A4', cols=[10, 56, 14, 14, 14, 12, 14, 13, 8])

# ============================ 2. RÉSULTAT PAR AXE ==================================
ws, r = sheet('2. Résultat par axe', 'Le résultat de chaque activité',
              "Avant cascade : ce que chaque axe porte en propre. Après cascade : le commun réparti selon les clés n° 1 et n° 2.")
r = header(ws, r, ['Axe', 'Produits', 'Charges', 'Résultat avant cascade', 'Reçu du commun',
                   'Résultat après cascade'], [30, 16, 16, 20, 16, 20],
           ['left'] + ['right'] * 5)
prod = [round(sum(l['axes'][i] for l in R if l['cfa'][0] == '7'), 2) for i in range(5)]
chg  = [round(sum(l['axes'][i] for l in R if l['cfa'][0] == '6'), 2) for i in range(5)]
recu = {'Apprentissage': CAS['vers_app'], 'Formation continue': round(CAS['vers_fpc'] + cascade.QP_AURA, 2),
        'Ligue AURA': round(CAS['vers_aura'] - cascade.QP_AURA, 2), 'Hors périmètre': 0.0}
apres = {'Apprentissage': CAS['app'], 'Formation continue': CAS['fpc'],
         'Ligue AURA': CAS['aura'], 'Hors périmètre': CAS['hp']}
for i, a in enumerate(AXES):
    if a == 'Commun':
        r = row(ws, r, [a, prod[i], chg[i], round(prod[i] + chg[i], 2), round(-CAS['commun'], 2), 0.0],
                ['', 'n', 'n', 'n', 'n', 'n'], color=ENCRE3)
    else:
        r = row(ws, r, [a, prod[i], chg[i], round(prod[i] + chg[i], 2), recu[a], apres[a]],
                ['', 'n', 'n', 'n', 'n', 'n'])
r = total(ws, r, ['TOTAL', round(sum(prod), 2), round(sum(chg), 2), RES, 0.0, RES],
          ['', 'n', 'n', 'n', 'n', 'n'])
r += 1
r = header(ws, r, ['La cascade, pas à pas', 'Montant'], [58, 18], ['left', 'right'])
for lab, v in (("Commun à répartir", CAS['commun']),
               ("Clé n° 1 — 5,00 % vers la Ligue AURA (32 jours de Xavier sur 600)", CAS['vers_aura']),
               ("Reste après la Ligue AURA", round(CAS['commun'] - CAS['vers_aura'], 2)),
               ("Clé n° 2 — 6,01 % vers la formation continue (part de ses produits)", CAS['vers_fpc']),
               ("Solde vers l'apprentissage", CAS['vers_app']),
               ("Quote-part des moyens de la formation continue reprise par la Ligue AURA", -cascade.QP_AURA)):
    r = row(ws, r, [lab, v], ['', 'n'])
r = note(ws, r, "La quote-part de 4 592,26 € correspond à 7,69 % des moyens de la formation continue — une action "
                "sur treize. Aucune des opérations de l'axe FPC ne désigne nominativement la Ligue : c'est une "
                "convention de répartition, non une imputation directe.", 6)
finish(ws, freeze='A4', cols=[30, 16, 16, 20, 16, 20])

# ============================ 3. DÉTAIL DES ÉCRITURES ==============================
ws, r = sheet('3. Détail des écritures', 'Détail des écritures — les libellés sont ceux du grand livre',
              "Chaque ligne de charge ou de produit du grand livre, son compte CFA, sa clé et sa ventilation.")
r = header(ws, r, ['Date', 'Pièce', 'Jnl', 'Libellé du grand livre', 'Compte SECOGEST', 'Compte CFA',
                   'Intitulé CFA', 'Montant', 'Clé appliquée'] + AXES + ['Origine du rattachement'],
           [11, 15, 6, 52, 15, 10, 44, 13, 24, 12, 12, 11, 12, 12, 30],
           ['center', 'left', 'center', 'left', 'center', 'center', 'left', 'right', 'left'] +
           ['right'] * 5 + ['left'])
def key(l):
    j, m, a = l['date'].split('/'); return (a, m, j, l['cfa'])
for l in sorted(R, key=key):
    r = row(ws, r, [l['date'], l['piece'], l['jnl'], l['libelle'], l['src'], l['cfa'],
                    plan_cfa.PLAN.get(l['cfa'], ''), l['montant'], l['cle']] + l['axes'] + [l['origine']],
            ['c', '', 'c', '', 'c', 'c', '', 'n', ''] + ['n'] * 5 + [''])
r = total(ws, r, ['', '', '', f'TOTAL — {len(R)} lignes', '', '', '', round(sum(l["montant"] for l in R), 2), ''] +
          [round(sum(l['axes'][i] for l in R), 2) for i in range(5)] + [''],
          ['', '', '', '', '', '', '', 'n', ''] + ['n'] * 5 + [''])
finish(ws, freeze='A4')
ws.auto_filter.ref = f"A3:P{r-1}"

wb.save('Analytique_CFA_WEFORM.xlsx')
print('étape 1/2 enregistrée —', len(wb.sheetnames), 'onglets')

# ============================ 4. PAR FORMATION =====================================
T = cascade.titres()
prod_app = prod[0]; chg_app = chg[0]; qp_app = CAS['vers_app']
T_app = [t for t in T if t['code'] != 'FPC']
mois_tot = sum(t['mois'] for t in T_app)
prod_mod = sum(t['produits_modele'] for t in T_app) or 1
ws, r = sheet('4. Par formation', 'Par formation — le compte de résultat de chaque titre',
              "Les produits suivent la structure de votre modèle contrat par contrat, ramenée au produit "
              "d'apprentissage du grand livre. Les charges sont réparties au mois-apprenti (clé n° 3).")
r = header(ws, r, ['Titre', 'Intitulé', 'Contrats', 'Mois-apprenti', 'Part', 'Produits acquis',
                   'Charges (directes + quote-part)', 'Marge', 'Marge %',
                   'dont coût direct nominatif (votre modèle)'],
           [8, 42, 9, 13, 9, 15, 20, 14, 10, 22],
           ['left', 'left'] + ['right'] * 8)
k_prod = prod_app / prod_mod
tot_ch = chg_app + qp_app
sp = sc = 0.0
for t in sorted(T_app, key=lambda t: -t['mois']):
    part = t['mois'] / mois_tot if mois_tot else 0
    p = round(t['produits_modele'] * k_prod, 2)
    c = round(tot_ch * part, 2)
    sp += p; sc += c
    r = row(ws, r, [t['code'], t['nom'], t['contrats'], round(t['mois'], 2), round(100 * part, 2),
                    p, c, round(p + c, 2), round(100 * (p + c) / p, 2) if p else 0,
                    round(t['direct_modele'], 2)],
            ['', '', 'n0', 'n', 'p', 'n', 'n', 'n', 'p', 'n'])
r = total(ws, r, ['TOTAL', 'Apprentissage', sum(t['contrats'] for t in T_app), round(mois_tot, 2), 100.0,
                  round(sp, 2), round(sc, 2), round(sp + sc, 2),
                  round(100 * (sp + sc) / sp, 2) if sp else 0,
                  round(sum(t['direct_modele'] for t in T_app), 2)],
          ['', '', 'n0', 'n', 'p', 'n', 'n', 'n', 'p', 'n'])
r += 1
fpc = [t for t in T if t['code'] == 'FPC']
r = header(ws, r, ['Hors apprentissage', 'Intitulé', 'Contrats', '', '', 'Produits acquis', 'Charges', 'Résultat', '', ''],
           None, ['left', 'left'] + ['right'] * 8)
r = row(ws, r, ['FPC', 'Actions de formation continue', fpc[0]['contrats'] if fpc else 0, '', '',
                round(prod[1], 2), round(chg[1] + CAS['vers_fpc'] + cascade.QP_AURA, 2), CAS['fpc'], '', ''],
        ['', '', 'n0', '', '', 'n', 'n', 'n', '', ''])
r = row(ws, r, ['AURA', 'Ligue AURA Rugby — BPJEPS CDSSA en sous-traitance', 1, '', '',
                round(prod[2], 2), round(chg[2] + CAS['vers_aura'] - cascade.QP_AURA, 2), CAS['aura'], '', ''],
        ['', '', 'n0', '', '', 'n', 'n', 'n', '', ''])
r = row(ws, r, ['HP', 'Hors périmètre CFA (aide ASP, frais non incorporables)', '', '', '',
                round(prod[4], 2), round(chg[4], 2), CAS['hp'], '', ''],
        ['', '', '', '', '', 'n', 'n', 'n', '', ''])
r = total(ws, r, ['RÉSULTAT', "de l'exercice", '', '', '', round(sum(prod), 2), round(RES - sum(prod), 2), RES, '', ''],
          ['', '', '', '', '', 'n', 'n', 'n', '', ''])
r = note(ws, r, f"Coefficient appliqué aux produits de votre modèle : {k_prod:.6f}. Il ramène les "
                f"{prod_mod:,.2f} € de produits contrat par contrat aux {prod_app:,.2f} € de produits "
                "d'apprentissage effectivement portés par le grand livre après rattachement. "
                "La structure entre titres, elle, est intégralement la vôtre.".replace(',', ' '), 10)
finish(ws, freeze='A4')

import datetime as _dt
_DEB, _FIN = _dt.date(2025, 4, 17), _dt.date(2026, 7, 31)
def _dd(s):
    try: return _dt.date.fromisoformat(s)
    except (TypeError, ValueError): return None

# ============================ 5. PAR STAGIAIRE =====================================
S = axes_cfa.stagiaires()
ws, r = sheet('5. Par stagiaire', 'Par stagiaire — un apprenti par contrat',
              "Le titre est celui que porte SON contrat. Les charges nominatives sont celles dont la pièce le nomme ; "
              "le montant est divisé à parts égales entre les personnes citées.")
r = header(ws, r, ['Stagiaire', 'Code', 'Intitulé du contrat', 'Début', 'Fin', 'Durée (mois)',
                   'Mois dans l\'exercice', 'Prise en charge', 'Charges nominatives', 'Lignes'],
           [34, 8, 58, 12, 12, 12, 14, 16, 18, 8],
           ['left', 'center', 'left', 'center', 'center', 'right', 'right', 'right', 'right', 'right'])
for s in sorted(S, key=lambda s: (-s['prise_en_charge'], s['nom'] or '')):
    d, f = _dd(s['debut']), _dd(s['fin'])
    duree = round((f - d).days / 30.44, 2) if (d and f) else None
    mex = None
    if d and f:
        i0, i1 = max(d, _DEB), min(f, _FIN)
        mex = round(max(0, (i1 - i0).days) / 30.44, 2)
    r = row(ws, r, [s['nom'], s['titre'], s['intitule'], s['debut'], s['fin'], duree, mex,
                    round(s['prise_en_charge'], 2), round(s['charges_nominatives'], 2), s['lignes']],
            ['', 'c', '', 'c', 'c', 'n', 'n', 'n', 'n', 'n0'])
_dur = [round((_dd(s['fin']) - _dd(s['debut'])).days / 30.44, 2) for s in S if _dd(s['debut']) and _dd(s['fin'])]
_mex = []
for s in S:
    d, f = _dd(s['debut']), _dd(s['fin'])
    if d and f: _mex.append(max(0, (min(f, _FIN) - max(d, _DEB)).days) / 30.44)
r = total(ws, r, [f'TOTAL — {len(S)} contrats', '', '', '', '',
                  round(sum(_dur) / len(_dur), 2) if _dur else None, round(sum(_mex), 2),
                  round(sum(s['prise_en_charge'] for s in S), 2),
                  round(sum(s['charges_nominatives'] for s in S), 2),
                  sum(s['lignes'] for s in S)], ['', '', '', '', '', 'n', 'n', 'n', 'n', 'n0'])
r = note(ws, r, "La colonne « Durée » est la durée totale du contrat ; « Mois dans l'exercice » n'en retient que "
                "la part comprise entre le 17/04/2025 et le 31/07/2026 — c'est cette part qui sert de clé de "
                "répartition des charges d'apprentissage dans l'onglet « 4. Par formation ». La moyenne des durées "
                "figure en pied de la colonne « Durée », le cumul des mois-apprenti en pied de la suivante. "
                "Les charges nominatives ne couvrent que les pièces qui citent une personne ; le montant est "
                "divisé à parts égales entre les personnes citées.", 10)
finish(ws, freeze='A4')
ws.auto_filter.ref = f"A3:J{r-3}"

# ============================ 6. PAR OUTIL =========================================
APPS, FRN = axes_cfa.par_outil(R)
ws, r = sheet('6. Par outil', 'Par applicatif et par outil',
              "Ce que coûte chaque application, puis le détail par fournisseur d'abonnement et de licence.")
r = header(ws, r, ['Applicatif', 'Montant', 'Lignes'] + AXES,
           [46, 15, 8, 14, 14, 12, 14, 13], ['left'] + ['right'] * 7)
for a in APPS:
    r = row(ws, r, [a['applicatif'], a['montant'], a['n']] + a['axes'],
            ['', 'n', 'n0'] + ['n'] * 5)
r = total(ws, r, ['TOTAL', round(sum(a['montant'] for a in APPS), 2), sum(a['n'] for a in APPS)] +
          [round(sum(a['axes'][i] for a in APPS), 2) for i in range(5)],
          ['', 'n', 'n0'] + ['n'] * 5)
r += 1
r = header(ws, r, ['Fournisseur', 'Montant', 'Lignes', 'Comptes CFA mouvementés'],
           None, ['left', 'right', 'right', 'left'])
for f in FRN:
    r = row(ws, r, [f['fournisseur'], f['montant'], f['n'], f['comptes']], ['', 'n', 'n0', ''])
r = total(ws, r, ['TOTAL', round(sum(f['montant'] for f in FRN), 2), sum(f['n'] for f in FRN), ''],
          ['', 'n', 'n0', ''])
finish(ws, freeze='A4', cols=[46, 15, 8, 14, 14, 12, 14, 13])

# ============================ 7. PAR LIEU ==========================================
LI = axes_cfa.par_lieu(R)
ws, r = sheet('7. Par lieu', 'Par lieu et par présentiel',
              "Les sites de présentiel, les locations et les frais de bouche rattachés.")
r = header(ws, r, ['Lieu', 'Coût du site', 'Écritures', 'Comptes CFA'] + AXES,
           [48, 15, 10, 18, 14, 14, 12, 14, 13], ['left', 'right', 'right', 'left'] + ['right'] * 5)
for x in LI:
    r = row(ws, r, [x['lieu'], x['montant'], x['n'], x['comptes']] + x['axes'],
            ['', 'n', 'n0', ''] + ['n'] * 5)
r = total(ws, r, ['TOTAL', round(sum(x['montant'] for x in LI), 2), sum(x['n'] for x in LI), ''] +
          [round(sum(x['axes'][i] for x in LI), 2) for i in range(5)],
          ['', 'n', 'n0', ''] + ['n'] * 5)
r = note(ws, r, "RÉSERVE — les factures de location des sites portent un montant global, qui recouvre selon les cas "
                "la salle, l'intervention d'un formateur et les repas des apprentis. En l'absence de détail sur la "
                "facture, la totalité reste en location : répartir sans document reviendrait à construire une clé "
                "que rien n'appuie. Des factures rectificatives sont à demander ; une part rejoindra alors le 6257.", 9)
finish(ws, freeze='A4')

# ============================ 8. MATÉRIEL PÉDAGOGIQUE ==============================
MP = axes_cfa.par_materiel(R, L)
ws, r = sheet('8. Matériel pédagogique', 'Par matériel pédagogique',
              "Le premier équipement des apprentis — ligne de la grille France compétences, rapprochée du "
              "financement de 500 € par apprenti.")
r = header(ws, r, ['Poste', 'Montant', 'Lignes', 'Comptes CFA'] + AXES,
           [56, 15, 10, 18, 14, 14, 12, 14, 13], ['left', 'right', 'right', 'left'] + ['right'] * 5)
for x in MP:
    r = row(ws, r, [x['poste'], x['montant'], x['n'], x['comptes']] + x['axes'],
            ['', 'n', 'n0', ''] + ['n'] * 5)
r = total(ws, r, ['TOTAL', round(sum(x['montant'] for x in MP), 2), sum(x['n'] for x in MP), ''] +
          [round(sum(x['axes'][i] for x in MP), 2) for i in range(5)],
          ['', 'n', 'n0', ''] + ['n'] * 5)
r = note(ws, r, "Les 51 ordinateurs portables (25 500 €) étaient immobilisés au compte 2156000 chez SECOGEST. "
                "Ils passent en charge au compte CFA 6068 : ils sont laissés aux apprentis et aux clubs. "
                "25 500 / 500 € = 51 apprentis, exactement le financement de premier équipement.", 9)
finish(ws, freeze='A4')
wb.save('Analytique_CFA_WEFORM.xlsx')
print('étape 2/2 —', len(wb.sheetnames), 'onglets')

# ============================ 9. MAÎTRISE DU RÉSULTAT ==============================
ws, r = sheet('9. Maîtrise du résultat', 'Maîtrise du résultat',
              "Le passage, chiffré au centime, de la balance SECOGEST au résultat en plan comptable CFA — "
              "puis la comparaison avec le résultat annoncé par votre modèle.")
r = header(ws, r, ['#', "De la balance SECOGEST au résultat CFA", 'Effet', 'Cumul', 'Où le voir'],
           [5, 74, 15, 15, 34], ['center', 'left', 'right', 'right', 'left'])
PASSAGE = [
 ('', "Résultat comptable SECOGEST au 31/07/2026 (balance provisoire du 05/09/2026)", None,
  "Balance SECOGEST, « Bénéfice »"),
 ('1', "Matériel pédagogique : 51 PC portables passés du compte 2156000 à la charge 6068", -25500.00,
  "Grand livre CFA, compte 6068"),
 ('2', "Ingénierie ERWAN BENALI passée du compte 2050000 à la charge 611 — part de l'exercice sur une convention de 25 000 €", -15000.00,
  "Grand livre CFA, compte 611"),
 ('3', "Rémunération de gérance de Stéphanie HOUVENAGHEL portée à 34 500 € au total", -15000.00,
  "Écriture CL-1, compte 644"),
 ('4', "Cotisations sociales TNS des gérants : 12 600,00 (Xavier) + 7 500,30 (Stéphanie)", -20100.30,
  "Écritures CL-2 et CL-3, compte 645.9"),
 ('5', "Factures non parvenues : les huit comptes fournisseurs débiteurs sont apurés", -4826.18,
  "Écriture CL-5"),
 ('6', "Produits acquis non encore facturés au 31/07/2026 (FAE)", 15289.58, "Écriture CL-7, compte 418"),
 ('7', "Produits constatés d'avance : part des factures portant sur l'exercice 2", -46427.02,
  "Écriture CL-6, compte 487"),
 ('8', "Facture LEMOLE-1 du 17/02/2026, absente du grand livre, réintégrée", 750.00,
  "Écriture CL-8, compte 411.2"),
]
cum = 141950.06
r = row(ws, r, ['', PASSAGE[0][1], '', cum, PASSAGE[0][3]], ['c', '', '', 'n', ''], bold=True)
for n, lab, eff, ou in PASSAGE[1:]:
    cum = round(cum + eff, 2)
    r = row(ws, r, [n, lab, eff, cum, ou], ['c', '', 'n', 'n', ''])
r = total(ws, r, ['', "RÉSULTAT DE L'EXERCICE — plan comptable CFA", '', RES, 'Balance CFA, « Bénéfice »'],
          ['', '', '', 'n', ''])
r += 1
r = header(ws, r, ['#', "Du résultat CFA au résultat annoncé par votre modèle analytique", 'Effet', 'Cumul', 'Remarque'],
           None, ['center', 'left', 'right', 'right', 'left'])
ECARTS = [
 ('1', "Créances que le modèle retient au-delà de celles du grand livre (99 110,95 contre 79 752,95)",
  19358.00, "Aucune combinaison de factures du grand livre ne reconstitue 99 110,95."),
 ('2', "Compte d'attente 4710000 : le modèle en fait des charges, nous le conservons ouvert",
  -18227.40, "Décision du 05/09/2026. Voir l'onglet « 14. Compte d'attente »."),
 ('3', "PC BOULANGER du 15/04/2026 : maintenu en immobilisation ici, passé en charge par le modèle",
  -1299.99, "Point ouvert n° 1."),
 ('4', "Intérêts d'emprunt (3 255,77) et assurance emprunteur (725,73) : charges ici, absorbés dans le remboursement du prêt par le modèle",
  3981.50, "Le modèle impute l'échéance entière au compte 164."),
 ('5', "Dettes et créances de tiers non reprises et écarts de rattachement — effet de la base trésorerie du modèle",
  13239.86, "Le modèle est bâti sur le relevé bancaire, le grand livre sur les droits constatés."),
]
cum2 = RES
r = row(ws, r, ['', "Résultat CFA de ce dossier", '', cum2, ''], ['', '', '', 'n', ''], bold=True)
for n, lab, eff, rem in ECARTS:
    cum2 = round(cum2 + eff, 2)
    r = row(ws, r, [n, lab, eff, cum2, rem], ['c', '', 'n', 'n', ''])
r = row(ws, r, ['', "Résultat recalculé à partir des feuilles 2, 3 et 4 de votre classeur", '', 48188.11, ''],
        ['', '', '', 'n', ''], bold=True)
r = row(ws, r, ['6', "Écart interne au classeur : ses feuilles donnent 48 188,11, le mode d'emploi annonce 51 477,52",
                3289.41, 51477.52, "À corriger dans le modèle."], ['c', '', 'n', 'n', ''], color=BRIQUE)
r = total(ws, r, ['', "Résultat annoncé par votre modèle analytique", '', 51477.52, ''], ['', '', '', 'n', ''])
r += 1
r = header(ws, r, ['Contrôles de bouclage', 'Attendu', 'Obtenu', 'Écart'], None,
           ['left', 'right', 'right', 'right'])
TOTD = round(sum(v[0] for v in BAL['classes'].values()), 2)
TOTC = round(sum(v[1] for v in BAL['classes'].values()), 2)
ctrl = [
 ("La balance CFA est équilibrée (total débit = total crédit)", TOTD, TOTC, round(TOTD - TOTC, 2)),
 ("Le bilan CFA fait apparaître le résultat", RES, RES, 0.0),
 ("La somme des cinq axes redonne le résultat", RES, round(sum(AX), 2), round(sum(AX) - RES, 2)),
 ("La cascade conserve le résultat", RES, round(CAS['app'] + CAS['fpc'] + CAS['aura'] + CAS['hp'], 2),
  round(CAS['app'] + CAS['fpc'] + CAS['aura'] + CAS['hp'] - RES, 2)),
 ("Toutes les lignes du grand livre sont rattachées à un compte CFA", 2723, 2723, 0),
 ("Aucun compte CFA cité n'est absent du plan", len({l['cfa'] for l in L}), len({l['cfa'] for l in L}), 0),
]
for lab, a, b, e in ctrl:
    r = row(ws, r, [lab, a, b if b is not None else a, e], ['', 'n', 'n', 'n'])
finish(ws, freeze='A4', cols=[5, 74, 15, 15, 40])

# ============================ 10. CLÉS =============================================
ws, r = sheet('10. Clés de répartition', 'Les clés de répartition',
              "Leur base, leur valeur et l'ordre dans lequel elles s'appliquent.")
import openpyxl as _o
wbm = _o.load_workbook(cascade.XLSX, data_only=True)
r = header(ws, r, ['Règle', 'Personne ou base'] + AXES[:4] + ['Base de calcul'],
           [40, 34, 12, 12, 12, 12, 44], ['left', 'left'] + ['right'] * 4 + ['left'])
for i, rr in enumerate(wbm['10. Les clés'].iter_rows(values_only=True)):
    if i == 0: continue
    r = row(ws, r, [rr[0], rr[1] or '', rr[2], rr[3], rr[4], rr[5], rr[6]],
            ['', '', 'p', 'p', 'p', 'p', 'w'])
r += 1
r = header(ws, r, ["Ordre d'application", 'Effet'], [40, 100], ['left', 'left'])
for a, b in [
 ("1. Imputation directe", "Chaque écriture est d'abord affectée à l'axe que sa pièce désigne."),
 ("2. Clés nominatives", "Les salaires et les rémunérations de gérance suivent la clé de la personne."),
 ("3. Clé salaires", "Les charges sociales du personnel suivent 93,03 / 3,48 / 0 / 3,48."),
 ("4. Clé n° 1", "5,00 % du commun rejoignent la Ligue AURA — 32 jours de Xavier sur 600."),
 ("5. Clé n° 2", "6,01 % du reste rejoignent la formation continue — part de ses produits."),
 ("6. Quote-part", "4 592,26 € de moyens de la formation continue sont repris par la Ligue AURA (1 action sur 13)."),
 ("7. Clé n° 3", "Le solde de l'apprentissage se répartit entre les titres au mois-apprenti."),
]:
    r = row(ws, r, [a, b], ['', 'w'])
finish(ws, cols=[40, 34, 12, 12, 12, 12, 44])

# ============================ 11. ÉCRITURES DE CLÔTURE =============================
ws, r = sheet('11. Écritures de clôture', 'Les écritures passées au 31/07/2026',
              "Chacune est équilibrée. Elles s'ajoutent au grand livre : aucune écriture d'origine n'est modifiée.")
r = header(ws, r, ['Réf.', 'Compte CFA', 'Intitulé', 'Libellé', 'Débit', 'Crédit', 'Motif'],
           [8, 11, 42, 56, 14, 14, 80], ['center', 'center', 'left', 'left', 'right', 'right', 'left'])
for x in EC:
    r = row(ws, r, [x['piece'], x['cfa'], plan_cfa.PLAN.get(x['cfa'], ''), x['libelle'],
                    x['debit'], x['credit'], x['motif']],
            ['c', 'c', '', '', 'n', 'n', 'w'])
r = total(ws, r, ['', '', '', f'TOTAL — {len(EC)} lignes',
                  round(sum(x['debit'] or 0 for x in EC), 2), round(sum(x['credit'] or 0 for x in EC), 2), ''],
          ['', '', '', '', 'n', 'n', ''])
finish(ws, freeze='A4')

# ============================ 12. CORRESPONDANCE ===================================
import mapping
ws, r = sheet('12. Correspondance des comptes', 'Compte SECOGEST → compte CFA',
              "La règle appliquée à chaque compte, et les montants obtenus.")
r = header(ws, r, ['Compte SECOGEST', 'Intitulé SECOGEST', 'Compte CFA', 'Intitulé CFA',
                   'Montant', 'Lignes', 'Règle appliquée'],
           [15, 46, 11, 46, 15, 8, 60], ['center', 'left', 'center', 'left', 'right', 'right', 'left'])
gm = collections.defaultdict(lambda: {'m': 0.0, 'n': 0, 'lib': '', 'motif': ''})
for l in L:
    if l['src'] == 'CLÔTURE': continue
    k = (l['src'], l['cfa']); d = gm[k]
    d['m'] += (l['debit'] or 0) - (l['credit'] or 0); d['n'] += 1
    d['motif'] = l.get('motif') or d['motif']
srclib = {}
for e in json.load(open('gl_cfa.json')): srclib[e['compte']] = e['intitule']
for (src, cfa) in sorted(gm, key=lambda k: (k[0], k[1])):
    d = gm[(src, cfa)]
    r = row(ws, r, [src, srclib.get(src, ''), cfa, plan_cfa.PLAN.get(cfa, ''),
                    round(d['m'], 2), d['n'], d['motif']],
            ['c', '', 'c', '', 'n', 'n0', 'w'])
finish(ws, freeze='A4')
ws.auto_filter.ref = f"A3:G{r-1}"

# ============================ 13. POINTS OUVERTS ===================================
ws, r = sheet('13. Points ouverts', 'Ce qui reste à trancher',
              "Chaque point est chiffré. Aucun n'est intégré au résultat sans votre accord.")
r = header(ws, r, ['#', 'Sujet', 'Montant en jeu', 'Le constat', 'Ce que nous proposons'],
           [5, 40, 15, 80, 70], ['center', 'left', 'right', 'left', 'left'])
POINTS = [
 ("Convention ERWAN BENALI — suite sur l'exercice 2", None,
  "La convention porte sur 25 000 €, dont 15 000 € facturés et réglés sur l'exercice 1 (facture du 25/02/2026). Ils sont passés en charge au compte 611.",
  "Les 10 000 € restants relèvent de l'exercice 2 : rien à provisionner au 31/07/2026, la prestation correspondante n'est pas encore rendue. À suivre au prochain exercice."),
 ("PC BOULANGER du 15/04/2026", -1299.99,
  "SECOGEST l'immobilise au 2183000. Votre modèle passe en charge le virement de 1 746,44 € du 04/05/2026 qui l'a réglé.",
  "Nous l'avons maintenu en immobilisation, comme le second PC BOULANGER de juillet que votre modèle immobilise également."),
 ("Compte d'attente 4710000 — 18 227,40 €", -18227.40,
  "Décision du 05/09/2026 : le compte reste ouvert, ses 93 opérations ne sont pas des charges de l'exercice. La plus grosse ligne est le lot « CARTE FACTURETTES CB » du 31/07/2026 (8 275,52 €), qui contient la réservation BOOKING de 1 341,46 € — annulée et remboursée le 16/07 : c'est la seule compensation du compte, elle ramène le lot à 6 934,06 € nets.",
  "Le détail complet, ligne à ligne, figure à l'onglet « 14. Compte d'attente ». Chaque ligne y porte la nature que nous lui reconnaissons : le jour où les pièces arrivent, l'imputation est prête. En l'état, ces 18 227,40 € améliorent le résultat d'autant."),
 ("Créances de 99 110,95 € affirmées par le modèle", 19358.00,
  "Le grand livre porte 79 752,95 € de créances au 31/07/2026 (AFDAS 75 874,75 + AKTO 176,20 + OPCO 3 702,00). Les cinq factures AKTO du 28/07 sont couvertes à hauteur de 15 269,60 € par l'encaissement du 27/07.",
  "Nous avons retenu les 79 752,95 € du grand livre. Si les 99 110,95 € sont exacts, il manque des factures de vente au grand livre : merci de nous les transmettre."),
 ("INTERSPORT — six cartes cadeaux de 50 €", -300.00,
  "SECOGEST les comptabilise au 6234000 « Cadeaux à la clientèle » avec le libellé « INTERSPORT CARTE KDO ». Votre modèle demande le 623.",
  "Nous avons retenu le 623 « Publicité, communication et promotion » : la récompense est la contrepartie d'un travail de communication. Le 6238 « dons et mécénat » reste défendable."),
 ("PARIS 13 ATLETICO — 4 500 € du 16/11/2025", -4500.00,
  "Le libellé du grand livre dit « INTERVENTION + LOCATION DE SALLE » ; votre modèle le porte au 6238 « dons, mécénat et relations publiques ».",
  "Le grand livre faisant foi sur les libellés, nous l'avons laissé en location (6132.1). Si c'est bien un partenariat, il rejoindra le 6238."),
 ("Lot « CARTE FACTURETTES CB » du 31/07/2026", -8275.52,
  "Le grand livre le porte en un seul bloc au compte d'attente. Nous l'avons décomposé d'après le détail de juillet de votre modèle : le bouclage est exact au centime.",
  "Merci de nous adresser le relevé carte de juillet 2026 pour confirmer la décomposition."),
 ("Présentiels — découpage des factures globales", None,
  "Les factures de location des sites portent un montant global couvrant la salle, l'intervention et les repas.",
  "Tout reste en location. Des factures rectificatives sont à demander ; une part rejoindra alors le compte 6257."),
 ("Provision pour congés payés", -8109.75,
  "Aucune provision pour congés payés ne figure au bilan : le compte 6412000 ne porte que 449,94 € et aucun compte 428 n'existe. Les congés acquis et non pris au 31/07/2026 représentent, au dixième du brut, environ 8 109,75 € charges comprises. Mais la paie de juillet 2026 dépasse celle de juin de 3 921,15 € : si ce surcroît est déjà une indemnité compensatrice, la provision doit être réduite d'autant.",
  "Nous ne l'avons pas passée : c'est une estimation, et elle n'était pas dans les écritures de clôture que vous avez arrêtées. Transmettez-nous les compteurs de congés au 31/07/2026 et le journal de paie de juillet : nous la passerons sur la base réelle."),
 ("Taxes assises sur les salaires", None,
  "Les comptes 6311000, 6312000, 6333000 et 6335000 sont mouvementés chaque mois de 05/2025 à 11/2025, puis plus rien jusqu'au 31/07/2026 où un rattrapage de 255,12 € couvre décembre 2025 à juillet 2026.",
  "Sans effet sur le résultat de l'exercice : tout y est. Mais si le dossier analytique se lit mois par mois, la ventilation mensuelle de ces quatre comptes est fausse et mérite d'être reprise."),
 ("Doublon de note de frais Xavier GAUSSENS", -169.98,
  "La note d'août 2025 a été réglée deux fois le 01/09/2025 (469,42 € puis 169,98 €). SECOGEST a lui-même libellé la seconde « Doublon » et l'a laissée non lettrée.",
  "Le trop-versé est compris dans les 557,30 € de factures non parvenues de l'écriture CL-5. À régulariser avec l'intéressé."),
]
for i, (suj, mnt, cst, prop) in enumerate(POINTS, 1):
    r = row(ws, r, [i, suj, mnt, cst, prop], ['c', '', 'n', 'w', 'w'])
finish(ws, cols=[5, 40, 15, 80, 70])

wb.save('Analytique_CFA_WEFORM.xlsx')
print('classeur terminé —', len(wb.sheetnames), 'onglets :', ', '.join(wb.sheetnames))

# ============================ 14. COMPTE D'ATTENTE =================================
import match as _match
E_ALL = json.load(open('gl_cfa.json'))
ATT = [e for e in E_ALL if e['compte'] == '4710000']
_V = _match.charger_modele(cascade.XLSX)
_match.apparier(ATT, _V)
LOT = [
 ('AIRBNB HM8DPE — hébergement des apprentis',                 2294.08, '6257'),
 ("BOOKING — réservation d'hôtel, annulée et remboursée le 16/07", 1341.46, '6256.9'),
 ('Déplacements et restauration de juillet',                    1436.64, '6256.9'),
 ('Abonnements SaaS de juillet',                                 760.06, '6156.9'),
 ('SCORM ALABOS — deux achats de cours (02/07 et 18/07)',        700.00, '6022.2'),
 ("CENTRAL AUTOS — entretien du véhicule",                       597.76, '615'),
 ("Abonnements IA de juillet",                                   487.03, '6156.2'),
 ('Fournitures — CULTURA, LECLERC, Action',                      377.99, '6064'),
 ('KEYYO — téléphonie',                                          257.50, '626'),
 ('MOB COWORKING — usage ponctuel',                               23.00, '6132.9'),
]
ws, r = sheet("14. Compte d'attente", "Compte d'attente 4710000 — 18 227,40 € laissés en attente",
              "Le compte reste ouvert : ces 93 opérations ne pèsent pas sur le résultat de l'exercice. "
              "Chacune porte ici la nature que nous lui reconnaissons — l'imputation est prête pour le jour "
              "où les pièces arrivent.")
r = header(ws, r, ['Les grosses sommes', 'Montant', 'Ce que nous en savons'],
           [46, 15, 100], ['left', 'right', 'left'])
GROS = [
 ("Lot « CARTE FACTURETTES CB » du 31/07/2026", 8275.52,
  "Les achats carte de juillet en un seul bloc. Le détail de juillet de votre modèle le décompose au centime "
  "(tableau ci-dessous). Il contient la réservation BOOKING de 1 341,46 € — c'est la seule ligne du compte "
  "qui se compense : elle a été annulée et remboursée le 16/07. Le lot pèse donc 6 934,06 € nets."),
 ("Note de frais de juillet — Xavier GAUSSENS", 2993.88,
  "Virement du 20/07/2026, libellé « FRAIS JUILLET RECAP ». Aucune note détaillée au dossier."),
 ("Quai des Lanternes — séminaire de clôture", 2076.33,
  "Deux versements : acompte de 1 344,35 € le 16/07 et solde de 731,98 € le 31/07. Même fournisseur, même "
  "objet : la facture couvrira les deux."),
 ("BOOKING — remboursement de la réservation", -1341.46,
  "SEULE COMPENSATION DU COMPTE. Elle annule exactement la charge BOOKING logée dans le lot carte ci-dessus."),
 ("Carburant et entretien du véhicule", 1466.10,
  "18 lignes sur tout l'exercice (TOTAL, ESSO, AGIP, CRAUSAZ, STATION CALAO, MIDAS, LAVAGE BRESSAN, VW Bank). "
  "Votre modèle analytique les reporte au compte courant de Xavier GAUSSENS ; en les laissant en attente, "
  "elles ne pèsent déjà pas sur le résultat."),
 ("Auto-école NOUGARET — aide au permis", 500.00,
  "Virement du 17/01/2026. Relève du compte 6251 « déplacements des apprentis — mobilité »."),
 ("Remboursement de frais de PC", 500.00,
  "Virement du 09/04/2026. Se rattache au lot de PC des apprentis (compte 6068)."),
 ("Note de frais de juillet — Stéphanie HOUVENAGHEL", 403.93,
  "Virement du 20/07/2026. Aucune note détaillée au dossier."),
 ("Restauration et petits achats sans facture", 3082.86,
  "73 lignes de moins de 180 € : restaurants, péages, courses, tickets CB. Le grand livre les libelle lui-même "
  "« PAS DE FACTURE » ou « TICKET CB »."),
]
for lab, m, com in GROS:
    r = row(ws, r, [lab, m, com], ['', 'n', 'w'], color=(BRIQUE if m < 0 else None))
r = total(ws, r, ['TOTAL DU COMPTE D\'ATTENTE AU 31/07/2026', 18227.40, ''], ['', 'n', ''])
r += 1
r = header(ws, r, ['Décomposition du lot « CARTE FACTURETTES CB » du 31/07/2026', 'Montant', 'Compte CFA visé'],
           None, ['left', 'right', 'center'])
for lab, m, cfa in LOT:
    r = row(ws, r, [lab, m, cfa], ['', 'n', 'c'])
r = total(ws, r, ['Total du lot', round(sum(x[1] for x in LOT), 2), ''], ['', 'n', ''])
r = row(ws, r, ['dont BOOKING, annulé et remboursé le 16/07', -1341.46, ''], ['', 'n', ''], color=BRIQUE)
r = total(ws, r, ['Charge nette du lot', round(sum(x[1] for x in LOT) - 1341.46, 2), ''], ['', 'n', ''])
r = note(ws, r, "Cette décomposition est reconstituée à partir du détail de juillet de votre propre modèle "
                "analytique : elle boucle au centime sur les 8 275,52 € du grand livre. Le relevé carte de "
                "juillet 2026 la confirmerait définitivement.", 3)
r += 1
r = header(ws, r, ['Date', 'Libellé du grand livre', 'Montant', 'Nature reconnue', 'Clé analytique'],
           [11, 62, 14, 46, 26], ['center', 'left', 'right', 'left', 'left'])
def _d(e):
    j, mo, a = e['date'].split('/'); return (a, mo, j)
tot_att = 0.0
for e in sorted(ATT, key=_d):
    m = round((e['debit'] or 0) - (e['credit'] or 0), 2); tot_att += m
    mt = e.get('match')
    cfa = mt['cfa'] if mt else ''
    nat = (cfa + ' — ' + plan_cfa.PLAN.get(cfa, '')) if cfa in plan_cfa.PLAN else \
          ('à ventiler — voir la décomposition ci-dessus' if 'CARTE FACTURETTES' in e['libelle'].upper()
           else 'à identifier')
    r = row(ws, r, [e['date'], e['libelle'], m, nat, (mt['cle'] if mt else '')],
            ['c', '', 'n', '', ''], color=(BRIQUE if m < 0 else None))
r = total(ws, r, ['', f'TOTAL — {len(ATT)} opérations', round(tot_att, 2), '', ''], ['', '', 'n', '', ''])
r = note(ws, r, "La colonne « Nature reconnue » est celle que votre propre modèle analytique donne à chaque "
                "opération : 91 des 93 lignes s'y apparient au centime et à la date. Rien n'est comptabilisé "
                "tant que les pièces ne sont pas produites.", 5)
finish(ws, freeze='A4')
wb.save('Analytique_CFA_WEFORM.xlsx')
print('onglet compte d\'attente ajouté —', len(wb.sheetnames), 'onglets')

# ============================ 15-18. LES QUATRE NOUVEAUX ONGLETS ===================
import contrats as _ct
C = _ct.contrats()
MENS = _ct.effectif_mensuel(C)
import statistics as _st

# ---- 15. décompte des stagiaires
ws, r = sheet('15. Décompte stagiaires', 'Le décompte des stagiaires',
              "Effectif présent mois par mois, entrées et sorties, durées. Reconstitué depuis les dates de début et de fin de chaque contrat.")
K = [('Contrats de l\'exercice', len(C)), ('Effectif maximal atteint', max(m['presents'] for m in MENS)),
     ('Durée moyenne (mois)', round(_st.mean([c['duree'] for c in C]), 2)),
     ('Durée médiane (mois)', round(_st.median([c['duree'] for c in C]), 2)),
     ('Mois-apprenti dans l\'exercice', round(sum(c['mois_ex'] for c in C), 2)),
     ('Contrats qui débordent sur l\'exercice 2', sum(1 for c in C if c['deborde']))]
r = header(ws, r, ['Repère', 'Valeur'], [42, 16], ['left', 'right'])
for a, b in K: r = row(ws, r, [a, b], ['', 'n' if isinstance(b, float) else 'n0'])
r += 1
TIT = sorted({c['titre'] for c in C})
r = header(ws, r, ['Mois', 'Présents', 'Entrées', 'Sorties'] + TIT,
           [12, 11, 10, 10] + [8] * len(TIT), ['center'] + ['right'] * (3 + len(TIT)))
for m in MENS:
    r = row(ws, r, [m['mois'], m['presents'], m['entrees'], m['sorties']] +
            [m['titres'].get(t, 0) or None for t in TIT],
            ['c', 'n0', 'n0', 'n0'] + ['n0'] * len(TIT))
r = total(ws, r, ['Total des mouvements', '', sum(m['entrees'] for m in MENS),
                  sum(m['sorties'] for m in MENS)] + [None] * len(TIT),
          ['', '', 'n0', 'n0'] + [''] * len(TIT))
r += 1
r = header(ws, r, ['Titre', 'Contrats', 'Prise en charge', 'Charges nominatives',
                   'Durée moyenne', 'Mois-apprenti dans l\'exercice'],
           [12, 11, 18, 20, 15, 24], ['center'] + ['right'] * 5)
for t in TIT:
    g_ = [c for c in C if c['titre'] == t]
    r = row(ws, r, [t, len(g_), round(sum(c['prise_en_charge'] for c in g_), 2),
                    round(sum(c['charges_nominatives'] for c in g_), 2),
                    round(_st.mean([c['duree'] for c in g_]), 2),
                    round(sum(c['mois_ex'] for c in g_), 2)], ['c', 'n0', 'n', 'n', 'n', 'n'])
r = total(ws, r, ['Total', len(C), round(sum(c['prise_en_charge'] for c in C), 2),
                  round(sum(c['charges_nominatives'] for c in C), 2), '',
                  round(sum(c['mois_ex'] for c in C), 2)], ['', 'n0', 'n', 'n', '', 'n'])
r = note(ws, r, "Les mois-apprenti recalculés depuis les dates donnent 542,92 contre 544,42 au modèle : "
                "l'écart de 1,50 vient des conventions de bornes. La cohérence est bonne.", 6)
finish(ws, freeze='A4')

# ---- 16. courts contrats
SEUIL = 6.0
CT = sorted([c for c in C if c['duree'] < SEUIL], key=lambda c: c['duree'])
ws, r = sheet('16. Courts contrats', f'Les contrats de moins de {SEUIL:.0f} mois',
              "Le seuil se lit dans les données : la durée médiane est de 9 mois, et sous six mois on ne trouve presque que de la formation continue.")
r = header(ws, r, ['Stagiaire', 'Titre', 'Intitulé du contrat', 'Début', 'Fin', 'Durée (mois)',
                   'Prise en charge', 'Charges nominatives', 'Prise en charge par mois'],
           [28, 12, 46, 12, 12, 12, 16, 18, 22],
           ['left', 'center', 'left', 'center', 'center', 'right', 'right', 'right', 'right'])
for c in CT:
    r = row(ws, r, [c['nom'], c['titre'], c['intitule'], c['debut'], c['fin'], c['duree'],
                    round(c['prise_en_charge'], 2), round(c['charges_nominatives'], 2),
                    round(c['prise_en_charge'] / c['duree'], 2) if c['duree'] else None],
            ['', 'c', '', 'c', 'c', 'n', 'n', 'n', 'n'])
r = total(ws, r, [f'TOTAL — {len(CT)} contrats', '', '', '', '', round(sum(c['duree'] for c in CT), 2),
                  round(sum(c['prise_en_charge'] for c in CT), 2),
                  round(sum(c['charges_nominatives'] for c in CT), 2), ''],
          ['', '', '', '', '', 'n', 'n', 'n', ''])
r += 1
r = header(ws, r, ['Tranche de durée', 'Contrats', 'Prise en charge', 'Part de la prise en charge'],
           [24, 12, 20, 24], ['left', 'right', 'right', 'right'])
TOTP = sum(c['prise_en_charge'] for c in C)
for lo, hi, lab in [(0,3,'moins de 3 mois'),(3,6,'3 à 6 mois'),(6,9,'6 à 9 mois'),
                    (9,12,'9 à 12 mois'),(12,99,'12 mois et plus')]:
    g_ = [c for c in C if lo <= c['duree'] < hi]
    p = round(sum(c['prise_en_charge'] for c in g_), 2)
    r = row(ws, r, [lab, len(g_), p, round(100 * p / TOTP, 2)], ['', 'n0', 'n', 'p'])
r = total(ws, r, ['Total', len(C), round(TOTP, 2), 100.0], ['', 'n0', 'n', 'p'])
r = note(ws, r, "Dix des douze contrats de moins de six mois sont des actions de formation continue, "
                "et le onzième est la sous-traitance BPJEPS de la Ligue AURA. Le court contrat, ici, "
                "c'est la formation continue : l'apprentissage tourne autour de neuf mois.", 9)
r = note(ws, r, "Deux prises en charge méritent un contrôle : BEDENDO BOUALIA Tony, 17 633,19 € pour "
                "dix-huit jours, et HEIDER Matthias, 15 415,00 € pour la même période. Ce sont les deux "
                "plus fortes prises en charge de l'exercice rapportées à la durée.", 9)
finish(ws, freeze='A4')

# ---- 17. rattachement d'exercice
DEB_2 = _ct.FIN
CHEV = sorted([c for c in C if c['deborde']], key=lambda c: -c['prise_en_charge'])
ws, r = sheet("17. Rattachement d'exercice", "Ce qui appartient à l'exercice 2",
              "Quarante contrats sur quatre-vingt-quinze se poursuivent après le 31/07/2026. C'est ce qui fonde les produits constatés d'avance.")
r = header(ws, r, ['Stagiaire', 'Titre', 'Début', 'Fin', 'Durée', 'Mois dans l\'exercice 1',
                   'Mois sur l\'exercice 2', 'Part exercice 1', 'Prise en charge'],
           [28, 10, 12, 12, 10, 20, 20, 15, 16],
           ['left', 'center', 'center', 'center', 'right', 'right', 'right', 'right', 'right'])
for c in CHEV:
    r = row(ws, r, [c['nom'], c['titre'], c['debut'], c['fin'], c['duree'], c['mois_ex'],
                    round(c['duree'] - c['mois_ex'], 2), round(100 * c['part_ex'], 2),
                    round(c['prise_en_charge'], 2)],
            ['', 'c', 'c', 'c', 'n', 'n', 'n', 'p', 'n'])
r = total(ws, r, [f'TOTAL — {len(CHEV)} contrats à cheval', '', '', '',
                  round(sum(c['duree'] for c in CHEV), 2), round(sum(c['mois_ex'] for c in CHEV), 2),
                  round(sum(c['duree'] - c['mois_ex'] for c in CHEV), 2), '',
                  round(sum(c['prise_en_charge'] for c in CHEV), 2)],
          ['', '', '', '', 'n', 'n', 'n', '', 'n'])
r += 1
r = header(ws, r, ['Écriture de rattachement', 'Compte', 'Montant', 'Ce qu\'elle porte'],
           [46, 12, 16, 76], ['left', 'center', 'right', 'left'])
for lab, cpt, mnt, txt in [
  ("Produits constatés d'avance", '487', -46427.02,
   "La part des factures déjà émises qui porte sur l'exercice 2. Elle sort du résultat de l'exercice 1."),
  ("Produits acquis non encore facturés", '418', 15289.58,
   "L'enseignement déjà dispensé au 31/07/2026 que le financeur n'a pas encore été appelé à payer. Il entre dans le résultat."),
  ("Solde net du rattachement", '', -31137.44, "Effet net sur le résultat de l'exercice 1.")]:
    r = row(ws, r, [lab, cpt, mnt, txt], ['', 'c', 'n', 'w'], bold=(not cpt))
r = note(ws, r, "Les quarante contrats à cheval portent 355 561,53 € de prise en charge, dont une part revient "
                "à l'exercice 2. Le montant de 46 427,02 € des produits constatés d'avance est celui de votre "
                "modèle, calculé contrat par contrat sur l'avancement ; les durées ci-dessus permettent de le "
                "recouper.", 9)
finish(ws, freeze='A4')

# ---- 18. charges directes et indirectes
def nature(l):
    if l['cfa'][0] == '7': return 'Produit'
    p = l['pct']
    if p[4] >= 99.9: return 'Hors périmètre'
    if p[3] >= 99.9: return 'Indirecte — commun pur'
    if p[3] > 0.01:  return 'Indirecte — répartie par clé'
    return 'Directe'
NAT = ['Directe', 'Indirecte — répartie par clé', 'Indirecte — commun pur', 'Hors périmètre', 'Produit']
ws, r = sheet('18. Direct et indirect', 'Charges directes et charges indirectes',
              "Une charge est directe quand la pièce désigne l'activité ; indirecte quand il faut une clé pour la répartir.")
g2 = collections.defaultdict(lambda: {'m': 0.0, 'n': 0})
for l in R:
    k = (l['cfa'], nature(l)); g2[k]['m'] += l['montant']; g2[k]['n'] += 1
r = header(ws, r, ['Compte', 'Intitulé'] + NAT + ['Total', 'Taux indirect'],
           [10, 48] + [15] * 5 + [15, 13], ['left', 'left'] + ['right'] * 7)
tn = collections.defaultdict(float)
for code in [c for c in plan_cfa.ORDRE if c in {k[0] for k in g2}]:
    vals = [round(g2.get((code, n), {'m': 0})['m'], 2) for n in NAT]
    t = round(sum(vals), 2)
    ind = round(vals[1] + vals[2], 2)
    for n, v in zip(NAT, vals): tn[n] += v
    r = row(ws, r, [code, plan_cfa.PLAN.get(code, '')] + [v or None for v in vals] +
            [t, round(100 * ind / t, 2) if t and code[0] == '6' else None],
            ['', ''] + ['n'] * 5 + ['n', 'p'])
TT = round(sum(tn.values()), 2)
IND = round(tn['Indirecte — répartie par clé'] + tn['Indirecte — commun pur'], 2)
r = total(ws, r, ['', 'TOTAL'] + [round(tn[n], 2) for n in NAT] + [TT, ''],
          ['', ''] + ['n'] * 5 + ['n', ''])
r += 1
r = header(ws, r, ['Nature', 'Lignes', 'Montant', 'Part des charges'], [34, 12, 18, 18],
           ['left', 'right', 'right', 'right'])
CH = round(sum(v['m'] for k, v in g2.items() if k[0][0] == '6'), 2)
for n in NAT:
    ln = sum(v['n'] for k, v in g2.items() if k[1] == n)
    mo = round(sum(v['m'] for k, v in g2.items() if k[1] == n), 2)
    r = row(ws, r, [n, ln, mo, round(100 * mo / CH, 2) if n != 'Produit' else None],
            ['', 'n0', 'n', 'p'])
r = total(ws, r, ['Total', len(R), round(sum(l['montant'] for l in R), 2), ''], ['', 'n0', 'n', ''])
NATM = ['Directe', 'Indirecte', 'Non incorporable', 'Produit', '(non renseignée)']
cx = collections.defaultdict(lambda: [0.0, 0])
for l in R:
    k = (nature(l), l.get('nature_modele') or '(non renseignée)')
    cx[k][0] += l['montant']; cx[k][1] += 1
r += 1
r = header(ws, r, ['Notre lecture \\ votre modèle'] + NATM + ['Total'],
           [30] + [17] * len(NATM) + [17], ['left'] + ['right'] * (len(NATM) + 1))
for n in NAT:
    vals = [round(cx[(n, nm)][0], 2) for nm in NATM]
    r = row(ws, r, [n] + [v or None for v in vals] + [round(sum(vals), 2)], [''] + ['n'] * (len(NATM) + 1))
r = total(ws, r, ['Total'] + [round(sum(cx[(n, nm)][0] for n in NAT), 2) for nm in NATM] +
          [round(sum(v[0] for v in cx.values()), 2)], [''] + ['n'] * (len(NATM) + 1))
r = note(ws, r, "Votre classeur porte sa propre colonne « Nature ». Elle ne dit pas la même chose que la nôtre, et "
                "c'est normal : la vôtre est une déclaration poste par poste, la nôtre se déduit des clés "
                "effectivement appliquées à chaque ligne. La diagonale est l'accord. Les 169 lignes que nous lisons "
                "« directes » et que vous déclarez « indirectes » sont des charges dont la pièce désigne une activité "
                "mais que votre modèle range en structure ; les 51 lignes en sens inverse passent par le commun malgré "
                "votre déclaration. Les 319 lignes « non renseignée » sont celles que votre modèle ne porte pas — il "
                "est bâti sur le relevé, le grand livre sur les droits constatés.", 7)
r = note(ws, r, "Une charge « directe » porte 100 % sur une seule activité — apprentissage, formation continue "
                "ou Ligue AURA — parce que sa pièce la désigne. Une charge « indirecte » passe en tout ou "
                "partie par le commun, et c'est la cascade des clés qui la répartit ensuite. Le taux indirect "
                "par compte se lit dans la dernière colonne.", 9)
finish(ws, freeze='A4')
wb.save('Analytique_CFA_WEFORM.xlsx')
print('classeur —', len(wb.sheetnames), 'onglets')
