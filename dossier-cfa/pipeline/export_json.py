# -*- coding: utf-8 -*-
"""Export compact des données pour la page HTML de vérification."""
import json, sys, collections
sys.path.insert(0, '.')
import plan_cfa, cascade, axes_cfa, match as _match

R   = json.load(open('vent_cfa.json'))
L   = json.load(open('lignes_cfa.json'))
EC  = json.load(open('cloture.json'))
BAL = json.load(open('balance_cfa.json'))
GLC = json.load(open('gl_cfa.json'))

# --- lignes ventilées : tableau de tableaux
# [date, piece, jnl, libelle, src, cfa, montant, a0,a1,a2,a3,a4, cle, origine]
LIG = [[l['date'], l['piece'], l['jnl'], l['libelle'], l['src'], l['cfa'],
        round(l['montant'], 2)] + [round(x, 2) for x in l['axes']] + [l['cle'], l['origine']]
       for l in R]

# --- compte d'attente (conservé) : [date, libelle, montant, cfa_reconnu, cle]
ATT = [e for e in GLC if e['compte'] == '4710000']
_V = _match.charger_modele(cascade.XLSX)
_match.apparier(ATT, _V)
ATTJ = []
for e in ATT:
    m = round((e['debit'] or 0) - (e['credit'] or 0), 2)
    mt = e.get('match')
    ATTJ.append([e['date'], e['libelle'], m, (mt['cfa'] if mt else ''), (mt['cle'] if mt else '')])

# --- écritures de clôture
ECJ = [[x['piece'], x['cfa'], x['libelle'], x['debit'], x['credit'], x['motif']] for x in EC]

# --- correspondance des comptes
gm = collections.defaultdict(lambda: {'m': 0.0, 'n': 0, 'motif': ''})
for l in L:
    if l['src'] == 'CLÔTURE': continue
    d = gm[(l['src'], l['cfa'])]
    d['m'] += (l['debit'] or 0) - (l['credit'] or 0); d['n'] += 1
    d['motif'] = l.get('motif') or d['motif']
srclib = {e['compte']: e['intitule'] for e in GLC}
MAPJ = [[s, srclib.get(s, ''), c, round(v['m'], 2), v['n'], v['motif']]
        for (s, c), v in sorted(gm.items())]

# --- axes CFA
LIEUX = axes_cfa.par_lieu(R)
APPS, FRN = axes_cfa.par_outil(R)
MAT = axes_cfa.par_materiel(R, L)
STAG = axes_cfa.stabiaires() if hasattr(axes_cfa, 'stabiaires') else axes_cfa.stagiaires()
TIT = cascade.titres()

# les axes renvoient des sélections : on ré-exporte les index de lignes pour le détail
def idx_of(sel_pred):
    return [i for i, l in enumerate(R) if sel_pred(l)]

import re
def pack_dim(items, keyname, spec):
    """spec : nom -> (regex, comptes) ; renvoie item + indices des lignes."""
    out, pris = [], set()
    for it in items:
        out.append(it)
    return out

# reconstruction des index par dimension, avec la même logique que axes_cfa
def lieux_idx():
    res, pris = [], set()
    for nom, pat, comptes in axes_cfa.LIEUX:
        ids = [i for i, l in enumerate(R) if l['cfa'] in comptes
               and re.search(pat, l['libelle'], re.I) and i not in pris]
        pris.update(ids)
        if ids: res.append((nom, ids))
    reste = [i for i, l in enumerate(R) if l['cfa'] in ('6132.1','6132.9','6257','6238') and i not in pris]
    if reste: res.append(('Autres locations et présentiels', reste))
    return res

def outil_idx():
    sel = [i for i, l in enumerate(R) if l['cfa'] in axes_cfa.COMPTES_OUTIL]
    apps, pris = [], set()
    for nom, pat in axes_cfa.APPLI.items():
        ids = [i for i in sel if re.search(pat, R[i]['libelle'], re.I) and i not in pris]
        pris.update(ids); apps.append((nom, ids))
    apps.append(('Outils communs et frais non rattachés', [i for i in sel if i not in pris]))
    frn, pris2 = [], set()
    for nom, pat in axes_cfa.FOURN:
        ids = [i for i in sel if re.search(pat, R[i]['libelle'], re.I) and i not in pris2]
        pris2.update(ids)
        if ids: frn.append((nom, ids))
    reste = [i for i in sel if i not in pris2]
    if reste: frn.append(('Autres fournisseurs et frais', reste))
    return apps, frn

def mat_idx():
    sel = [i for i, l in enumerate(R) if l['cfa'] in ('6068', '6064')]
    out, pris = [], set()
    for nom, pat in axes_cfa.MATERIEL:
        ids = [i for i in sel if re.search(pat, R[i]['libelle'], re.I) and i not in pris]
        pris.update(ids)
        if ids: out.append((nom, ids))
    reste = [i for i in sel if i not in pris]
    if reste: out.append(('Autres fournitures et petit équipement', reste))
    return out

AX = [round(sum(l['axes'][i] for l in R), 2) for i in range(5)]
CAS = cascade.repartir(AX)

DATA = {
 'lignes': LIG,
 'plan': plan_cfa.PLAN,
 'ordre': plan_cfa.ORDRE,
 'attente': ATTJ,
 'cloture': ECJ,
 'mapping': MAPJ,
 'lieux': lieux_idx(),
 'applis': outil_idx()[0],
 'fournisseurs': outil_idx()[1],
 'materiel': mat_idx(),
 'immo': [[l['cfa'], l['libelle'], -round((l['debit'] or 0) - (l['credit'] or 0), 2)]
          for l in L if l['cfa'] in ('2183',)],
 'stagiaires': [[s['nom'], s['titre_contrat'], s['titre'], s['prise_en_charge'],
                 s['charges_nominatives'], s['lignes']] for s in STAG],
 'titres': [[t['code'], t['nom'], t['contrats'], t['mois'], t['produits_modele'], t['direct_modele']]
            for t in TIT],
 'axes': AX, 'cascade': CAS, 'resultat': BAL['resultat'], 'balance': BAL,
 'cle1': cascade.CLE1_AURA, 'cle2': cascade.CLE2_FPC, 'qpaura': cascade.QP_AURA,
}
json.dump(DATA, open('data.json', 'w'), ensure_ascii=False, separators=(',', ':'))
import os
print('data.json', round(os.path.getsize('data.json')/1024), 'Ko |', len(LIG), 'lignes |',
      len(ATTJ), 'attente |', len(STAG), 'stagiaires')
